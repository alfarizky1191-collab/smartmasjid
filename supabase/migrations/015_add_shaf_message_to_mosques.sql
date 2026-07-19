-- Add shaf_message column to mosques table
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS shaf_message text DEFAULT 'Harap rapatkan dan luruskan barisan shaf sholat';
