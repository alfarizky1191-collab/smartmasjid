import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

/**
 * POST /api/push/send
 *
 * Mengirim push notification ke semua subscriber masjid.
 * Dipanggil dari:
 *   1. Dashboard admin (menggunakan Bearer token autentikasi)
 *   2. TV display saat adzan (menggunakan Bearer token autentikasi)
 *
 * Body: { mosque_id, title, body, url?, icon?, tag? }
 *
 * Security:
 *   - Wajib Bearer token valid (Supabase session)
 *   - mosque_id harus dimiliki oleh user yang sedang login
 *   - Semua keys diambil dari env vars, tidak ada fallback hardcoded
 */

// ─── Env validation ──────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getVapidKeys() {
  return {
    publicKey:  requireEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    privateKey: requireEnv("VAPID_PRIVATE_KEY"),
    subject:    process.env.VAPID_SUBJECT || "mailto:admin@smartmasjid.id",
  };
}

/** Client dengan service role key — hanya untuk operasi server-side */
function getServiceClient() {
  const url        = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/** Client dengan token user — untuk verifikasi identitas pengirim */
function getUserClient(bearerToken: string) {
  const url     = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    global: {
      headers: {
        apikey:        anonKey,
        Authorization: `Bearer ${bearerToken}`,
      },
    },
    auth: { persistSession: false },
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── 1. Autentikasi: wajib Bearer token ───────────────────────────────────
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const bearerToken = authorization.slice(7);

    const userClient = getUserClient(bearerToken);
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse & validasi body ─────────────────────────────────────────────
    let body: {
      mosque_id?: unknown;
      title?: unknown;
      body?: unknown;
      url?: unknown;
      icon?: unknown;
      tag?: unknown;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { mosque_id, title, body: notifBody, url, icon, tag } = body;

    if (typeof mosque_id !== "string" || !mosque_id)
      return NextResponse.json({ error: "mosque_id required" }, { status: 422 });
    if (typeof title !== "string" || !title)
      return NextResponse.json({ error: "title required" }, { status: 422 });
    if (typeof notifBody !== "string" || !notifBody)
      return NextResponse.json({ error: "body required" }, { status: 422 });

    // ── 3. Otorisasi: user harus memiliki mosque ini ──────────────────────────
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("mosque_id")
      .eq("id", userData.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // Izinkan jika mosque_id cocok dengan masjid user,
    // atau jika permintaan berasal dari TV display masjid yang sama
    if (profile.mosque_id !== mosque_id) {
      return NextResponse.json({ error: "Forbidden: mosque_id mismatch" }, { status: 403 });
    }

    // ── 4. Validasi VAPID env ────────────────────────────────────────────────
    let vapid: ReturnType<typeof getVapidKeys>;
    try {
      vapid = getVapidKeys();
    } catch (err) {
      console.error("[push/send] VAPID keys not configured:", err);
      return NextResponse.json({ error: "Push service not configured" }, { status: 500 });
    }

    const db = getServiceClient();

    // ── 5. Validasi masjid exists ────────────────────────────────────────────
    const { data: mosque, error: mosqueError } = await db
      .from("mosques")
      .select("id")
      .eq("id", mosque_id)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
    }

    // ── 6. Ambil subscribers ─────────────────────────────────────────────────
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

    // ── 7. Kirim push notifications ──────────────────────────────────────────
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    const payload = JSON.stringify({
      title,
      body:     notifBody,
      icon:     typeof icon === "string" ? icon : "/icons/icon-192.png",
      badge:    "/icons/icon-192.png",
      url:      typeof url  === "string" ? url  : "/app",
      tag:      typeof tag  === "string" ? tag  : `smartmasjid-${Date.now()}`,
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

    // ── 8. Bersihkan subscription expired ───────────────────────────────────
    if (expiredEndpoints.length > 0) {
      await db
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return NextResponse.json({
      ok:      true,
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
