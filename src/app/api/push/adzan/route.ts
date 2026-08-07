import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

/**
 * POST /api/push/adzan
 *
 * Endpoint khusus untuk TV display — mengirim push notif adzan ke subscriber.
 * Tidak memerlukan user auth karena TV display adalah halaman publik,
 * namun diproteksi dengan:
 *   1. Validasi mosque_id + prayer_name
 *   2. Rate limiting: max 1 notif per prayer per 5 menit (in-memory)
 *   3. Validasi masjid exists di database sebelum kirim
 *
 * Body: { mosque_id, prayer_name }
 */

// ─── In-memory rate limit store ───────────────────────────────────────────────
// Key: `${mosque_id}:${prayer_name}`, Value: timestamp last sent
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 menit

function isRateLimited(mosque_id: string, prayer_name: string): boolean {
  const key = `${mosque_id}:${prayer_name}`;
  const lastSent = rateLimitStore.get(key);
  const now = Date.now();
  if (lastSent && now - lastSent < RATE_LIMIT_MS) {
    return true;
  }
  rateLimitStore.set(key, now);
  return false;
}

// ─── Env helpers ─────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getServiceClient() {
  const url        = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Parse body ────────────────────────────────────────────────────────────
    let body: { mosque_id?: unknown; prayer_name?: unknown; audio_url?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { mosque_id, prayer_name } = body;

    if (typeof mosque_id !== "string" || !mosque_id)
      return NextResponse.json({ error: "mosque_id required" }, { status: 422 });
    if (typeof prayer_name !== "string" || !prayer_name)
      return NextResponse.json({ error: "prayer_name required" }, { status: 422 });

    // Validasi UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(mosque_id)) {
      return NextResponse.json({ error: "Invalid mosque_id format" }, { status: 422 });
    }

    // Whitelist prayer names
    const VALID_PRAYERS = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"];
    if (!VALID_PRAYERS.includes(prayer_name)) {
      return NextResponse.json({ error: "Invalid prayer_name" }, { status: 422 });
    }

    // ── Rate limit ────────────────────────────────────────────────────────────
    if (isRateLimited(mosque_id, prayer_name)) {
      return NextResponse.json(
        { ok: true, sent: 0, message: "Rate limited — already sent recently" },
        { status: 429 }
      );
    }

    // ── Validasi VAPID ────────────────────────────────────────────────────────
    const publicKey  = requireEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    const privateKey = requireEnv("VAPID_PRIVATE_KEY");
    const subject    = process.env.VAPID_SUBJECT || "mailto:admin@smartmasjid.id";

    const db = getServiceClient();

    // ── Validasi masjid exists ────────────────────────────────────────────────
    const { data: mosque, error: mosqueError } = await db
      .from("mosques")
      .select("id")
      .eq("id", mosque_id)
      .single();

    if (mosqueError || !mosque) {
      return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
    }

    // ── Ambil subscribers ─────────────────────────────────────────────────────
    const { data: subs, error: subsError } = await db
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("mosque_id", mosque_id);

    if (subsError) {
      console.error("[push/adzan] Fetch subs error:", subsError);
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No subscribers" });
    }

    // ── Kirim push ────────────────────────────────────────────────────────────
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title:    `Adzan ${prayer_name} 🕌`,
      body:     "Waktu sholat telah tiba. Segera bersiap untuk sholat berjamaah.",
      icon:     "/icons/icon-192.png",
      badge:    "/icons/icon-192.png",
      url:      "/app",
      tag:      `adzan-${prayer_name}-${new Date().toISOString().slice(0, 13)}`,
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
          }
        }
      })
    );

    if (expiredEndpoints.length > 0) {
      await db
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expiredEndpoints);
    }

    return NextResponse.json({ ok: true, sent, expired: expiredEndpoints.length });
  } catch (err: unknown) {
    console.error("[push/adzan] Internal error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
