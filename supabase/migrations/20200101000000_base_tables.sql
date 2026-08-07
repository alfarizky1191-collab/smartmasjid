-- ============================================================
-- SmartMasjid: Base Tables
-- Tabel dasar yang harus ada sebelum migration 001 dijalankan.
-- ============================================================

BEGIN;

-- MOSQUES
CREATE TABLE IF NOT EXISTS mosques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text,
  city text,
  province text,
  address text,
  tagline text,
  running_text text,
  running_text_speed integer DEFAULT 20,
  iqomah_duration integer DEFAULT 300,
  slug text UNIQUE,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SLIDES
CREATE TABLE IF NOT EXISTS slides (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date date,
  event_time text,
  speaker text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DONATIONS
CREATE TABLE IF NOT EXISTS donations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  donor_name text,
  amount bigint NOT NULL DEFAULT 0,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text,
  amount bigint NOT NULL DEFAULT 0,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- QRIS_SETTINGS
CREATE TABLE IF NOT EXISTS qris_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PROFILES (dengan mosque_id karena mosques sudah dibuat di atas)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
