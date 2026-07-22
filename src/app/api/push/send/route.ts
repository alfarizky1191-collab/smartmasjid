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

const DEFAULT_VAPID_PUBLIC_KEY  = "BMGo_iix-OGUlFc9Fdk2GEMIjuVW9rXpBVozyO0M9gMbFzhw5eGbon3uZM8xmEdgVL5U65n0G78CZ6F5N280k10";
const DEFAULT_VAPID_PRIVATE_KEY = "v-dI6MdZIVMKdmsFdB4OOSWOECPTmeD-ZPCDeVz4Xrw";
const DEFAULT_VAPID_SUBJECT     = "mailto:admin@smartmasjid.id";

const DEFAULT_SUPABASE_URL = "https://ndwzafvikiosrdhbhxbk.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kd3phZnZpa2lvc3JkaGJoeGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTE2MzQsImV4cCI6MjA5NTI4NzYzNH0.wJbxqBsvzuaGJYGdeserdg4hFUKNZAYGHigdH7ph5Jc";
const DEFAULT_SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kd3phZnZpa2lvc3JkaGJoeGJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTcxMTYzNCwiZXhwIjoyMDk1Mjg3NjM0fQ.sfrc7go_J5RxKq8Tz4k8Zzag0Hp489q2ISjTFFuK52g";

function getVapidKeys() {
  const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
  const subject    = process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT;
  return { publicKey, privateKey, subject };
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_SERVICE_KEY;
  const anonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, {
    global: {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
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
    const { publicKey, privateKey, subject } = getVapidKeys();

    if (!publicKey || !privateKey) {
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
    webpush.setVapidDetails(subject, publicKey, privateKey);

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
  } catch (err: unknown) {
    console.error("[push/send] Internal error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
