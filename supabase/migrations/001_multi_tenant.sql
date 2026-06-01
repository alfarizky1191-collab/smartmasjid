-- ============================================================
-- SmartMasjid: Multi-Tenant Migration
-- ============================================================
-- PENTING: Jalankan di Supabase SQL Editor
-- Backup database sebelum menjalankan migration ini.
--
-- Asumsi: mosques.id bertipe BIGINT (serial/identity).
-- Jika mosques.id sudah UUID, ganti semua "bigint" → "uuid".
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PROFILES: Relasi user → mosque
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mosque_id bigint NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin'
    CHECK (role IN ('superadmin', 'admin', 'viewer')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_mosque_id ON profiles(mosque_id);

-- ============================================================
-- 2. TAMBAH mosque_id KE TABEL-TABEL DATA
-- ============================================================

-- announcements
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS mosque_id bigint REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_announcements_mosque_id ON announcements(mosque_id);

-- slides
ALTER TABLE slides
  ADD COLUMN IF NOT EXISTS mosque_id bigint REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_slides_mosque_id ON slides(mosque_id);

-- events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS mosque_id bigint REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_events_mosque_id ON events(mosque_id);

-- donations
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS mosque_id bigint REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_donations_mosque_id ON donations(mosque_id);

-- transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS mosque_id bigint REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_transactions_mosque_id ON transactions(mosque_id);

-- qris_settings
ALTER TABLE qris_settings
  ADD COLUMN IF NOT EXISTS mosque_id bigint REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_qris_settings_mosque_id ON qris_settings(mosque_id);

-- prayer_schedules (jika ada)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_schedules') THEN
    EXECUTE 'ALTER TABLE prayer_schedules ADD COLUMN IF NOT EXISTS mosque_id bigint REFERENCES mosques(id) ON DELETE CASCADE';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_prayer_schedules_mosque_id ON prayer_schedules(mosque_id)';
  END IF;
END $$;

-- ============================================================
-- 3. MIGRATE DATA EXISTING → ASSIGN KE MASJID PERTAMA
-- ============================================================

DO $$
DECLARE
  first_mosque_id bigint;
BEGIN
  SELECT id INTO first_mosque_id FROM mosques ORDER BY id LIMIT 1;

  IF first_mosque_id IS NOT NULL THEN
    UPDATE announcements SET mosque_id = first_mosque_id WHERE mosque_id IS NULL;
    UPDATE slides SET mosque_id = first_mosque_id WHERE mosque_id IS NULL;
    UPDATE events SET mosque_id = first_mosque_id WHERE mosque_id IS NULL;
    UPDATE donations SET mosque_id = first_mosque_id WHERE mosque_id IS NULL;
    UPDATE transactions SET mosque_id = first_mosque_id WHERE mosque_id IS NULL;
    UPDATE qris_settings SET mosque_id = first_mosque_id WHERE mosque_id IS NULL;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_schedules') THEN
      EXECUTE format('UPDATE prayer_schedules SET mosque_id = %s WHERE mosque_id IS NULL', first_mosque_id);
    END IF;
  END IF;
END $$;

-- ============================================================
-- 4. ENFORCE NOT NULL (setelah data di-migrate)
-- ============================================================

ALTER TABLE announcements ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE slides ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE donations ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN mosque_id SET NOT NULL;
ALTER TABLE qris_settings ALTER COLUMN mosque_id SET NOT NULL;

-- QRIS: 1 masjid = 1 setting
ALTER TABLE qris_settings
  DROP CONSTRAINT IF EXISTS uq_qris_mosque;
ALTER TABLE qris_settings
  ADD CONSTRAINT uq_qris_mosque UNIQUE (mosque_id);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qris_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's mosque_id
CREATE OR REPLACE FUNCTION auth.mosque_id()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT mosque_id FROM profiles WHERE id = auth.uid()
$$;

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
-- 6. AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Jika user baru, buat profile kosong (mosque_id harus di-set saat onboarding)
  -- Untuk sekarang, assign ke masjid pertama agar tidak break
  INSERT INTO profiles (id, mosque_id, role)
  VALUES (
    NEW.id,
    (SELECT id FROM mosques ORDER BY id LIMIT 1),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop trigger jika sudah ada, lalu buat ulang
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;
