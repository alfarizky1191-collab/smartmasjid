import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

/**
 * POST /api/push/send
 *
 * Admin-only endpoint to broadcast a push notification to all subscribers
 * of a given mosque.
 *
 * Auth: Bearer token (Supabase JWT) — must belong to the mosque as admin/superadmin
 *
 * Body:
 * {
 *   mosque_id: string
 *   title: string
 *   body: string
 *   url?: string       (deep link, e.g. "/app/info")
 *   icon?: string      (custom icon URL, fallback to default)
 * }
 */

const VAPID_PUBLIC_KEY  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT     = process.env.VAPID_SUBJECT ?? "mailto:admin@smartmasjid.id";

// Service-role client for reading subscriptions (bypasses RLS)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

// Anon client authenticated with user JWT
function getUserClient(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function POST(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userClient = getUserClient(token);
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Validate body ────────────────────────────────────────────────────────
  let body: {
    mosque_id?: unknown;
    title?: unknown;
    body?: unknown;
    url?: unknown;
    icon?: unknown;
  };
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

  // ── RBAC: check user is admin of this mosque ─────────────────────────────
  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("mosque_id, role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }
  if (profile.mosque_id !== mosque_id) {
    return NextResponse.json({ error: "Forbidden: mosque mismatch" }, { status: 403 });
  }
  if (!["admin", "superadmin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
  }

  // ── Validate VAPID env ───────────────────────────────────────────────────
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("[push/send] VAPID keys not configured");
    return NextResponse.json({ error: "Push service not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // ── Fetch subscriptions ──────────────────────────────────────────────────
  const serviceClient = getServiceClient();
  const { data: subs, error: subsError } = await serviceClient
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

  // ── Send notifications ───────────────────────────────────────────────────
  const payload = JSON.stringify({
    title,
    body: notifBody,
    icon:  typeof icon === "string" ? icon : "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    url:   typeof url === "string" ? url : "/app",
    tag:   "smartmasjid-notification",
    renotify: true,
  });

  const expiredEndpoints: string[] = [];
  let sent = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404 or 410 means the subscription is gone — clean it up
        if (status === 404 || status === 410) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.warn("[push/send] Failed to send to endpoint:", status, sub.endpoint);
        }
      }
    })
  );

  // ── Clean up expired subscriptions ──────────────────────────────────────
  if (expiredEndpoints.length > 0) {
    await serviceClient
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  return NextResponse.json({
    ok: true,
    sent,
    expired: expiredEndpoints.length,
    total: subs.length,
  });
}
