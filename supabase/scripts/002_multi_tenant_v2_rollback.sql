-- ============================================================
-- SmartMasjid: Multi-Tenant Migration V2 — ROLLBACK
-- ============================================================
-- Reverses 002_multi_tenant_v2.sql
-- WARNING: This will remove mosque_id columns and all tenant isolation.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. DROP TRIGGER
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================
-- 2. DROP ALL RLS POLICIES
-- ============================================================

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
DROP POLICY IF EXISTS "Public read prayer_schedules" ON prayer_schedules;
DROP POLICY IF EXISTS "Admin manage prayer_schedules" ON prayer_schedules;

-- ============================================================
-- 3. DISABLE RLS
-- ============================================================

ALTER TABLE mosques DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE qris_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_schedules DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. DROP HELPER FUNCTION
-- ============================================================

DROP FUNCTION IF EXISTS public.mosque_id();

-- ============================================================
-- 5. DROP mosque_id COLUMNS AND INDEXES
-- ============================================================

ALTER TABLE qris_settings DROP CONSTRAINT IF EXISTS uq_qris_mosque;

DROP INDEX IF EXISTS idx_announcements_mosque_id;
DROP INDEX IF EXISTS idx_slides_mosque_id;
DROP INDEX IF EXISTS idx_events_mosque_id;
DROP INDEX IF EXISTS idx_donations_mosque_id;
DROP INDEX IF EXISTS idx_transactions_mosque_id;
DROP INDEX IF EXISTS idx_qris_settings_mosque_id;
DROP INDEX IF EXISTS idx_prayer_schedules_mosque_id;

ALTER TABLE announcements DROP COLUMN IF EXISTS mosque_id;
ALTER TABLE slides DROP COLUMN IF EXISTS mosque_id;
ALTER TABLE events DROP COLUMN IF EXISTS mosque_id;
ALTER TABLE donations DROP COLUMN IF EXISTS mosque_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS mosque_id;
ALTER TABLE qris_settings DROP COLUMN IF EXISTS mosque_id;
ALTER TABLE prayer_schedules DROP COLUMN IF EXISTS mosque_id;

-- ============================================================
-- NOTE: This rollback does NOT delete profiles created by backfill.
-- The profiles table is preserved as-is since it pre-existed V2.
-- ============================================================

COMMIT;
