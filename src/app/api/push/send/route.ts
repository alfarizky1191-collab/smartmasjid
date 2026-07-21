import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

/**
 * POST /api/push/send
 *
 * Sends a push notification to all subscribers of a mosque.
 * Security: validates mosque_id exists in DB (no user auth required —
 * this endpoint is only called from authenticated dashboard pages).
 *
 * Body: { mosque_id, title, body, url?, icon? }
 */

const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT ?? "mailto:admin@smartmasjid.id";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey ?? anonKey;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, {
    global: {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    },
  });
}

export async function POST(request: NextRequest) {
  // ── Parse body ───────────────────────────────────────────────────────────
  let body: { mosque_id?: unknown; title?: unknown; body?: unknown; url?: unknown; icon?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { mosque_id, title, body: notifBody, url, icon } = body;

  if (typeof mosque_id !== "string" || !mosque_id)
    return NextResponse.json({ error: "mosque_id required" }, { status: 422 });
  if (typeof title !== "string" || !title)
    return NextResponse.json({ error: "title required" }, { status: 422 });
  if (typeof notifBody !== "string" || !notifBody)
    return NextResponse.json({ error: "body required" }, { status: 422 });

  // ── Validate VAPID env ───────────────────────────────────────────────────
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("[push/send] VAPID keys not configured");
    return NextResponse.json({ error: "Push service not configured" }, { status: 500 });
  }

  const db = getClient();

  // ── Validate mosque exists ───────────────────────────────────────────────
  const { data: mosque, error: mosqueError } = await db
    .from("mosques")
    .select("id")
    .eq("id", mosque_id)
    .single();

  if (mosqueError || !mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  // ── Fetch subscribers ────────────────────────────────────────────────────
  const { data: subs, error: subsError } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("mosque_id", mosque_id);

  if (subsError) {
    console.error("[push/send] Fetch subs error:", subsError);
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No subscribers" });
  }

  // ── Send push notifications ──────────────────────────────────────────────
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({
    title,
    body:     notifBody,
    icon:     typeof icon === "string" ? icon : "/icons/icon-192.svg",
    badge:    "/icons/icon-192.svg",
    url:      typeof url  === "string" ? url  : "/app",
    tag:      "smartmasjid-notification",
    renotify: true,
  });

  const expiredEndpoints: string[] = [];
  let sent = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.warn("[push/send] Failed:", status, sub.endpoint);
        }
      }
    })
  );

  // ── Clean up expired subscriptions ──────────────────────────────────────
  if (expiredEndpoints.length > 0) {
    await db
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  return NextResponse.json({
    ok: true,
    sent,
    expired: expiredEndpoints.length,
    total:   subs.length,
  });
}
