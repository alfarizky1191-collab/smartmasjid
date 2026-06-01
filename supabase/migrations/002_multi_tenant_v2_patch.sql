-- ============================================================
-- SmartMasjid: Multi-Tenant Migration V2 — PATCH
-- ============================================================
-- Apply AFTER 002_multi_tenant_v2.sql
-- Adds: prayer_schedules support + safe preflight policy wipe
-- ============================================================

BEGIN;

-- ============================================================
-- PREFLIGHT: Drop ALL existing policies on affected tables
-- (handles unknown/mismatched policy names from production)
-- ============================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'mosques','profiles','announcements','slides','events',
        'donations','transactions','qris_settings','prayer_schedules'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- PATCH 1: prayer_schedules — mosque_id column
-- ============================================================

ALTER TABLE prayer_schedules
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_prayer_schedules_mosque_id ON prayer_schedules(mosque_id);

-- Backfill
DO $$
DECLARE
  first_mosque uuid;
BEGIN
  SELECT id INTO first_mosque FROM mosques ORDER BY created_at LIMIT 1;
  IF first_mosque IS NOT NULL THEN
    UPDATE prayer_schedules SET mosque_id = first_mosque WHERE mosque_id IS NULL;
  END IF;
END $$;

-- Validate
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT count(*) INTO null_count FROM prayer_schedules WHERE mosque_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'prayer_schedules still has % rows with NULL mosque_id. Aborting.', null_count;
  END IF;
END $$;

-- Enforce NOT NULL
ALTER TABLE prayer_schedules ALTER COLUMN mosque_id SET NOT NULL;

-- ============================================================
-- PATCH 2: RLS — Enable + recreate all policies
-- ============================================================

ALTER TABLE prayer_schedules ENABLE ROW LEVEL SECURITY;

-- Ensure helper function exists (idempotent, public schema)
CREATE OR REPLACE FUNCTION public.mosque_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mosque_id FROM profiles WHERE id = auth.uid()
$$;

-- ----- MOSQUES -----
CREATE POLICY "Public read mosques"
  ON mosques FOR SELECT USING (true);

CREATE POLICY "Admin manage own mosque"
  ON mosques FOR ALL
  USING (id = public.mosque_id())
  WITH CHECK (id = public.mosque_id());

-- ----- PROFILES -----
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ----- ANNOUNCEMENTS -----
CREATE POLICY "Public read announcements"
  ON announcements FOR SELECT USING (true);

CREATE POLICY "Admin manage announcements"
  ON announcements FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

-- ----- SLIDES -----
CREATE POLICY "Public read slides"
  ON slides FOR SELECT USING (true);

CREATE POLICY "Admin manage slides"
  ON slides FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

-- ----- EVENTS -----
CREATE POLICY "Public read events"
  ON events FOR SELECT USING (true);

CREATE POLICY "Admin manage events"
  ON events FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

-- ----- DONATIONS -----
CREATE POLICY "Public read donations"
  ON donations FOR SELECT USING (true);

CREATE POLICY "Admin manage donations"
  ON donations FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

-- ----- TRANSACTIONS -----
CREATE POLICY "Public read transactions"
  ON transactions FOR SELECT USING (true);

CREATE POLICY "Admin manage transactions"
  ON transactions FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

-- ----- QRIS_SETTINGS -----
CREATE POLICY "Public read qris"
  ON qris_settings FOR SELECT USING (true);

CREATE POLICY "Admin manage qris"
  ON qris_settings FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

-- ----- PRAYER_SCHEDULES -----
CREATE POLICY "Public read prayer_schedules"
  ON prayer_schedules FOR SELECT USING (true);

CREATE POLICY "Admin manage prayer_schedules"
  ON prayer_schedules FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

COMMIT;
