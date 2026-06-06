-- ============================================================
-- SmartMasjid: Sprint 4 — Add slug to mosques
-- ============================================================

BEGIN;

ALTER TABLE mosques ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mosques_slug ON mosques(slug) WHERE slug IS NOT NULL;

-- Backfill: generate slug from name for existing mosques
UPDATE mosques
SET slug = lower(replace(replace(trim(name), ' ', '-'), '.', ''))
WHERE slug IS NULL AND name IS NOT NULL;

COMMIT;
