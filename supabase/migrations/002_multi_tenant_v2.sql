-- ============================================================
-- SmartMasjid: Multi-Tenant Migration V2
-- ============================================================
-- Fixes V1 bigint mistake. Uses uuid consistently.
-- Does NOT recreate profiles table (already exists).
-- Drops existing RLS policies before recreating.
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
    -- Drop index if exists
    EXECUTE format('DROP INDEX IF EXISTS idx_%s_mosque_id', tbl);
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

-- Helper: get current user's mosque_id
CREATE OR REPLACE FUNCTION auth.mosque_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT mosque_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ----- DROP EXISTING POLICIES -----
DROP POLICY IF EXISTS "Public read mosques" ON mosques;
DROP POLICY IF EXISTS "Admin manage own mosque" ON mosques;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Public read announcements" ON announcements;
DROP POLICY IF EXISTS "Admin manage announcements" ON announcements;
DROP POLICY IF EXISTS "Public read slides" ON slides;
DROP POLICY IF EXISTS "Admin manage slides" ON slides;
DROP POLICY IF EXISTS "Public read events" ON events;
DROP POLICY IF EXISTS "Admin manage events" ON events;
DROP POLICY IF EXISTS "Public read donations" ON donations;
DROP POLICY IF EXISTS "Admin manage donations" ON donations;
DROP POLICY IF EXISTS "Public read transactions" ON transactions;
DROP POLICY IF EXISTS "Admin manage transactions" ON transactions;
DROP POLICY IF EXISTS "Public read qris" ON qris_settings;
DROP POLICY IF EXISTS "Admin manage qris" ON qris_settings;

-- ----- MOSQUES -----
CREATE POLICY "Public read mosques"
  ON mosques FOR SELECT USING (true);

CREATE POLICY "Admin manage own mosque"
  ON mosques FOR ALL
  USING (id = auth.mosque_id())
  WITH CHECK (id = auth.mosque_id());

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
  USING (mosque_id = auth.mosque_id())
  WITH CHECK (mosque_id = auth.mosque_id());

-- ----- SLIDES -----
CREATE POLICY "Public read slides"
  ON slides FOR SELECT USING (true);

CREATE POLICY "Admin manage slides"
  ON slides FOR ALL
  USING (mosque_id = auth.mosque_id())
  WITH CHECK (mosque_id = auth.mosque_id());

-- ----- EVENTS -----
CREATE POLICY "Public read events"
  ON events FOR SELECT USING (true);

CREATE POLICY "Admin manage events"
  ON events FOR ALL
  USING (mosque_id = auth.mosque_id())
  WITH CHECK (mosque_id = auth.mosque_id());

-- ----- DONATIONS -----
CREATE POLICY "Public read donations"
  ON donations FOR SELECT USING (true);

CREATE POLICY "Admin manage donations"
  ON donations FOR ALL
  USING (mosque_id = auth.mosque_id())
  WITH CHECK (mosque_id = auth.mosque_id());

-- ----- TRANSACTIONS -----
CREATE POLICY "Public read transactions"
  ON transactions FOR SELECT USING (true);

CREATE POLICY "Admin manage transactions"
  ON transactions FOR ALL
  USING (mosque_id = auth.mosque_id())
  WITH CHECK (mosque_id = auth.mosque_id());

-- ----- QRIS_SETTINGS -----
CREATE POLICY "Public read qris"
  ON qris_settings FOR SELECT USING (true);

CREATE POLICY "Admin manage qris"
  ON qris_settings FOR ALL
  USING (mosque_id = auth.mosque_id())
  WITH CHECK (mosque_id = auth.mosque_id());

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
    (SELECT id FROM mosques ORDER BY created_at LIMIT 1),
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

COMMIT;
