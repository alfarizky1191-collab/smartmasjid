-- ============================================================
-- SmartMasjid: Sprint 4.1 — Mosque Profile Fields
-- ============================================================

BEGIN;

ALTER TABLE mosques ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS tagline text;

COMMIT;
