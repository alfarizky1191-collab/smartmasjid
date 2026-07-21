import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/push/subscribe
 *
 * Body: { subscription: PushSubscriptionJSON, mosque_id: string }
 * - mosque_id ties the device subscription to a specific mosque
 * - subscription contains endpoint, keys.p256dh, keys.auth from the browser
 *
 * DELETE /api/push/subscribe
 * Body: { endpoint: string, mosque_id: string }
 */

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  // Must pass apikey header explicitly so Supabase grants the anon role
  // and RLS policies for TO anon apply correctly from server-side calls
  return createClient(url, key, {
    global: {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  let body: { subscription?: unknown; mosque_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subscription, mosque_id } = body;

  // Validate subscription shape
  if (
    !subscription ||
    typeof subscription !== "object" ||
    typeof (subscription as Record<string, unknown>).endpoint !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription object" }, { status: 422 });
  }

  const sub = subscription as {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Subscription keys missing" }, { status: 422 });
  }

  if (typeof mosque_id !== "string" || !mosque_id) {
    return NextResponse.json({ error: "mosque_id required" }, { status: 422 });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(mosque_id)) {
    console.error("[push/subscribe] Invalid mosque_id format:", mosque_id);
    return NextResponse.json({ error: `Invalid mosque_id format: "${mosque_id}"` }, { status: 422 });
  }

  const userAgent = request.headers.get("user-agent") ?? null;

  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        mosque_id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent,
      },
      { onConflict: "mosque_id,endpoint" }
    );

    if (error) {
      console.error("[push/subscribe] DB error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe] Unexpected error:", String(err));
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let body: { endpoint?: unknown; mosque_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint, mosque_id } = body;

  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 422 });
  }
  if (typeof mosque_id !== "string" || !mosque_id) {
    return NextResponse.json({ error: "mosque_id required" }, { status: 422 });
  }

  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("mosque_id", mosque_id)
      .eq("endpoint", endpoint);

    if (error) {
      console.error("[push/subscribe] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
