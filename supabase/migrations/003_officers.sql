-- ============================================================
-- SmartMasjid: Sprint 3.1 — Petugas (Officers) Management
-- ============================================================

BEGIN;

-- 1. OFFICERS TABLE
CREATE TABLE IF NOT EXISTS officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  default_role text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_officers_mosque_id ON officers(mosque_id);

-- 2. OFFICER_SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS officer_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  role text NOT NULL,
  officer_id uuid NOT NULL REFERENCES officers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_officer_schedules_mosque_id ON officer_schedules(mosque_id);
CREATE INDEX IF NOT EXISTS idx_officer_schedules_date ON officer_schedules(schedule_date);

-- 3. RLS
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read officers" ON officers;
DROP POLICY IF EXISTS "Admin manage officers" ON officers;
DROP POLICY IF EXISTS "Public read officer_schedules" ON officer_schedules;
DROP POLICY IF EXISTS "Admin manage officer_schedules" ON officer_schedules;

CREATE POLICY "Public read officers"
  ON officers FOR SELECT USING (true);

CREATE POLICY "Admin manage officers"
  ON officers FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

CREATE POLICY "Public read officer_schedules"
  ON officer_schedules FOR SELECT USING (true);

CREATE POLICY "Admin manage officer_schedules"
  ON officer_schedules FOR ALL
  USING (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

COMMIT;
