-- ============================================================
-- SmartMasjid: Testimonials table
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS testimonials (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id  uuid        NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  role       text        NOT NULL DEFAULT '',
  rating     integer     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  content    text        NOT NULL,
  is_approved boolean    NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_mosque_id   ON testimonials(mosque_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_approved ON testimonials(is_approved);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admin manage testimonials"         ON testimonials;

-- Anyone can read approved testimonials (for landing page, unauthenticated)
CREATE POLICY "Public read approved testimonials"
  ON testimonials FOR SELECT
  USING (is_approved = true);

-- Authenticated admins can insert/update/delete their own mosque's testimonials
CREATE POLICY "Admin manage testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING    (mosque_id = public.mosque_id())
  WITH CHECK (mosque_id = public.mosque_id());

COMMIT;
