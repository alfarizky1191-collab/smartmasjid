-- ============================================================
-- SmartMasjid: TV Display Theme Engine
-- ============================================================
-- Adds tv_theme column to mosques table to store the selected theme.
-- Default theme: "classic"
-- ============================================================

BEGIN;

-- Add tv_theme column to mosques table
ALTER TABLE mosques
  ADD COLUMN IF NOT EXISTS tv_theme text NOT NULL DEFAULT 'classic'
    CHECK (tv_theme IN (
      'classic',
      'emerald-modern',
      'royal-ottoman',
      'andalusia-luxury',
      'midnight-sapphire',
      'nabawi-green',
      'makkah-premium',
      'ramadan-special',
      'eid-celebration'
    ));

-- Create index for efficient theme queries (optional, useful for analytics)
CREATE INDEX IF NOT EXISTS idx_mosques_tv_theme ON mosques(tv_theme);

COMMIT;
