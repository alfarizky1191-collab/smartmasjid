import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AuditRequest = {
  action?: unknown;
  module?: unknown;
  metadata?: unknown;
};

function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const clientIp = request.headers.get("x-client-ip");
  const cfIp = request.headers.get("cf-connecting-ip");
  const value = forwardedFor || realIp || clientIp || cfIp;

  return value?.split(",")[0]?.trim() || null;
}

function isMetadata(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase environment is not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AuditRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.action !== "string" || typeof body.module !== "string") {
    return NextResponse.json({ error: "Action and module are required" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("mosque_id, role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile?.mosque_id) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  const metadata = isMetadata(body.metadata) ? body.metadata : {};
  const userName =
    typeof userData.user.user_metadata?.full_name === "string"
      ? userData.user.user_metadata.full_name
      : userData.user.email || userData.user.id;

  const { error } = await supabase.from("audit_logs").insert({
    mosque_id: profile.mosque_id,
    user_id: userData.user.id,
    user_email: userData.user.email,
    user_name: userName,
    role: profile.role || "unknown",
    action: body.action,
    module: body.module,
    ip_address: getRequestIp(request),
    metadata,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
