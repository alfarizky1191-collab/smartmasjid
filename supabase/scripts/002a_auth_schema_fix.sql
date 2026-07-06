-- ============================================================
-- SmartMasjid: Auth Schema Fix
-- ============================================================
-- Run BEFORE 002_multi_tenant_v2.sql
-- Fixes: permission denied for schema auth
-- ============================================================

-- Drop any previous attempt that may have partially succeeded
DROP FUNCTION IF EXISTS auth.mosque_id();
DROP FUNCTION IF EXISTS public.mosque_id();

-- Create helper function in public schema (accessible by SQL Editor)
CREATE OR REPLACE FUNCTION public.mosque_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mosque_id FROM profiles WHERE id = auth.uid()
$$;
