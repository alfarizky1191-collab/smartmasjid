-- ============================================================
-- SmartMasjid: Fix mosques RLS policies
-- ============================================================
-- The INSERT policy for mosques was missing, blocking onboarding.
-- The ALL policy used mosque_id() which returns NULL for new users
-- (no mosque yet), so UPDATE/DELETE also failed.
-- Replace both with correct owner_id-based policies.
-- ============================================================

BEGIN;

-- Drop existing mosques policies and recreate correctly
DROP POLICY IF EXISTS "Public read mosques"     ON mosques;
DROP POLICY IF EXISTS "Admin manage own mosque" ON mosques;
DROP POLICY IF EXISTS "Users create own mosque" ON mosques;
DROP POLICY IF EXISTS "Users read own mosque"   ON mosques;

-- Anyone (including TV display, unauthenticated) can read mosque records
CREATE POLICY "Public read mosques"
  ON mosques FOR SELECT
  USING (true);

-- Owner can insert their own mosque (used during onboarding)
-- owner_id must match the authenticated user
CREATE POLICY "Users create own mosque"
  ON mosques FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Owner can update their own mosque record
CREATE POLICY "Admin manage own mosque"
  ON mosques FOR UPDATE
  TO authenticated
  USING    (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Owner can delete their own mosque record
CREATE POLICY "Users delete own mosque"
  ON mosques FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

COMMIT;
