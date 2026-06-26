BEGIN;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS adzan_url text;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS adzan_subuh_url text;
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS alarm_url text;
COMMIT;
