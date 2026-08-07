import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformStats {
  mosqueCount: number;
  userCount: number;
  mobileAppActive: number;
}

// ─── Server-side Supabase client ──────────────────────────────────────────────
// Uses the anon key — sufficient because:
//   • mosques  → "Public read mosques" RLS policy allows COUNT for everyone
//   • profiles → queried via a SECURITY DEFINER RPC when available;
//                falls back to 0 until migration 013 is deployed

function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

async function countPublicTable(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: ReturnType<typeof createClient<any>>,
  table: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if (error || count === null) return 0;
  return count;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export const dynamic = "force-static";
export const revalidate = 300; // revalidate every 5 minutes

export async function GET(): Promise<NextResponse<PlatformStats>> {
  const supabase = createServerClient();

  // Try the SECURITY DEFINER RPC first (available after migration 013 is deployed)
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_platform_stats");

  if (!rpcError && rpcData) {
    return NextResponse.json({
      mosqueCount:    Number(rpcData.mosque_count    ?? 0),
      userCount:      Number(rpcData.user_count      ?? 0),
      mobileAppActive: Number(rpcData.mobile_app_active ?? 0),
    });
  }

  // RPC not yet deployed — fall back to direct table queries.
  // mosques has a public-read RLS policy so COUNT works with the anon key.
  // profiles is RLS-restricted; returns 0 until migration 013 is deployed.
  const [mosqueCount, userCount] = await Promise.all([
    countPublicTable(supabase, "mosques"),
    countPublicTable(supabase, "profiles"),
  ]);

  // TODO: Replace 0 with real mobile session count once a
  //       mobile_sessions(user_id, last_active) table is added.
  return NextResponse.json({
    mosqueCount,
    userCount,
    mobileAppActive: 0,
  });
}
