-- ============================================================
-- SmartMasjid: Platform Statistics RPC
-- ============================================================
-- Provides a SECURITY DEFINER function so the public landing
-- page can read aggregate counts without exposing individual rows.
-- The anon key can call this RPC safely.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- Return type
-- ──────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS platform_stats CASCADE;

CREATE TYPE platform_stats AS (
  mosque_count    bigint,
  user_count      bigint,
  -- TODO: Replace mobile_app_active with a real count once a
  --       mobile session / activity tracking table is introduced.
  --       Suggested table: mobile_sessions(user_id, mosque_id, last_active timestamptz)
  --       Query: COUNT(DISTINCT user_id) WHERE last_active >= now() - interval '30 days'
  mobile_app_active bigint
);

-- ──────────────────────────────────────────────────────────────
-- Function
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS platform_stats
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.mosques)::bigint   AS mosque_count,
    (SELECT COUNT(*) FROM public.profiles)::bigint  AS user_count,

    -- TODO: No mobile session tracking table exists yet.
    --       Return 0 until mobile_sessions table is added.
    --       When mobile_sessions is ready, replace this with:
    --         (SELECT COUNT(DISTINCT user_id) FROM public.mobile_sessions
    --          WHERE last_active >= now() - interval '30 days')::bigint
    0::bigint AS mobile_app_active
$$;

-- Allow the anon role (public visitors) to call this function
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO authenticated;
