-- ============================================================
-- SmartMasjid: Multi-Tenant Migration V2
-- ============================================================
-- Fixes V1 bigint mistake. Uses uuid consistently.
-- Does NOT recreate profiles table (already exists).
-- Fully idempotent: safe to run on a fresh or existing database.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. FIX V1: Drop bigint mosque_id columns if they exist from V1
--    and re-add as uuid
-- ============================================================

-- Remove old bigint foreign key constraints and columns if V1 was applied
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['announcements','slides','events','donations','transactions','qris_settings'])
  LOOP
    -- Drop index if exists (recreated later as uuid)
    -- Use %I to safely quote the constructed index identifier
    EXECUTE format('DROP INDEX IF EXISTS %I', 'idx_' || tbl || '_mosque_id');
    -- Check if column exists and is bigint (V1 artifact)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl
        AND column_name = 'mosque_id' AND data_type = 'bigint'
    ) THEN
      EXECUTE format('ALTER TABLE %I DROP COLUMN mosque_id', tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 2. ADD mosque_id (uuid) TO TABLES
-- ============================================================

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

ALTER TABLE slides
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

ALTER TABLE qris_settings
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_mosque_id ON announcements(mosque_id);
CREATE INDEX IF NOT EXISTS idx_slides_mosque_id ON slides(mosque_id);
CREATE INDEX IF NOT EXISTS idx_events_mosque_id ON events(mosque_id);
CREATE INDEX IF NOT EXISTS idx_donations_mosque_id ON donations(mosque_id);
CREATE INDEX IF NOT EXISTS idx_transactions_mosque_id ON transactions(mosque_id);
CREATE INDEX IF NOT EXISTS idx_qris_settings_mosque_id ON qris_settings(mosque_id);

-- ============================================================
-- 3. BACKFILL: Assign existing rows to first mosque
-- ============================================================

DO $$
DECLARE
  first_mosque uuid;
BEGIN
  SELECT id INTO first_mosque FROM mosques ORDER BY created_at LIMIT 1;

  IF first_mosque IS NOT NULL THEN
    UPDATE announcements SET mosque_id = first_mosque WHERE mosque_id IS NULL;
    UPDATE slides SET mosque_id = first_mosque WHERE mosque_id IS NULL;
    UPDATE events SET mosque_id = first_mosque WHERE mosque_id IS NULL;
    UPDATE donations SET mosque_id = first_mosque WHERE mosque_id IS NULL;
    UPDATE transactions SET mosque_id = first_mosque WHERE mosque_id IS NULL;
    UPDATE qris_settings SET mosque_id = first_mosque WHERE mosque_id IS NULL;
  END IF;
END $$;

-- ============================================================
-- 4. BACKFILL: Create profiles for auth.users that don't have one
-- ============================================================

DO $$
DECLARE
  first_mosque uuid;
BEGIN
  SELECT id INTO first_mosque FROM mosques ORDER BY created_at LIMIT 1;

  IF first_mosque IS NOT NULL THEN
    INSERT INTO profiles (id, mosque_id, full_name, role)
    SELECT
      u.id,
      first_mosque,
      COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'User'),
      'admin'
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 5. VALIDATION: Check no NULLs remain before enforcing NOT NULL
-- ============================================================

DO $$
DECLARE
  tbl text;
  null_count integer;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['announcements','slides','events','donations','transactions','qris_settings'])
  LOOP
    EXECUTE format('SELECT count(*) FROM %I WHERE mosque_id IS NULL', tbl) INTO null_count;
    IF null_count > 0 THEN
      RAISE EXCEPTION 'Table % still has % rows with NULL mosque_id. Aborting.', tbl, null_count;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 6. ENFORCE NOT NULL
-- ============================================================

ALTER TABLE announcements ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE slides ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE donations ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE qris_settings ALTER COLUMN mosque_id SET NOT NULL;

-- QRIS: one setting per mosque
ALTER TABLE qris_settings DROP CONSTRAINT IF EXISTS uq_qris_mosque;
ALTER TABLE qris_settings ADD CONSTRAINT uq_qris_mosque UNIQUE (mosque_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qris_settings ENABLE ROW LEVEL SECURITY;

-- Track the mosque owner during onboarding so the initial insert does not depend on profiles.
ALTER TABLE mosques
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mosques_owner_id ON mosques(owner_id);

-- Helper: get current user's mosque_id (public schema — auth schema is restricted)
CREATE OR REPLACE FUNCTION public.mosque_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mosque_id FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- PREFLIGHT: Drop ALL existing policies on affected tables
-- This handles unknown or mismatched policy names from previous
-- migration runs (V1, partial V2, patch files, etc.) so the
-- migration is safe to re-run on any existing database.
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
        'mosques', 'profiles', 'announcements', 'slides', 'events',
        'donations', 'transactions', 'qris_settings'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END $$;

-- Also drop legacy auth.mosque_id function from V1
DROP FUNCTION IF EXISTS auth.mosque_id();

-- ----- MOSQUES -----

-- Public read: allows the TV page (unauthenticated) to read mosque settings
CREATE POLICY "Public read mosques"
  ON mosques FOR SELECT USING (true);

-- Owner insert: used during mosque onboarding before a profile exists
CREATE POLICY "Users create own mosque"
  ON mosques FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owner update: mosque admin updates their own mosque record
CREATE POLICY "Admin manage own mosque"
  ON mosques FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ----- PROFILES -----

-- Users can read their own profile row
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can insert their own profile row (needed for onboarding / handle_new_user fallback)
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own profile row
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

-- ============================================================
-- 8. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, mosque_id, full_name, role)
  VALUES (
    NEW.id,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 9. VERIFY: Confirm only owner-based policies remain
-- ============================================================

DO $$
DECLARE
  legacy_count integer;
BEGIN
  -- Any policy referencing auth.mosque_id() is a V1 legacy
  SELECT count(*) INTO legacy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'mosques', 'profiles', 'announcements', 'slides', 'events',
      'donations', 'transactions', 'qris_settings'
    )
    AND (qual ILIKE '%auth.mosque_id%' OR with_check ILIKE '%auth.mosque_id%');

  IF legacy_count > 0 THEN
    RAISE EXCEPTION
      'Legacy V1 policies referencing auth.mosque_id() still exist (% found). '
      'Drop them before proceeding.', legacy_count;
  END IF;
END $$;

COMMIT;
