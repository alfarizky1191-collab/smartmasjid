-- SmartMasjid: Add district column to mosques
BEGIN;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS district text;
COMMIT;
