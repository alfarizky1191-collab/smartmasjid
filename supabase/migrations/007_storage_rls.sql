-- ============================================================
-- SmartMasjid: Storage RLS Hardened Policies
-- ============================================================
-- This migration applies storage object policies for the three buckets
-- used by the application: mosque-assets, slides, and qris.
-- It preserves public read access for existing public URLs while
-- enforcing tenant-scoped authenticated write/update/delete.
-- ============================================================

BEGIN;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ----- mosque-assets -----
DROP POLICY IF EXISTS "mosque-assets authenticated insert own mosque" ON storage.objects;
DROP POLICY IF EXISTS "mosque-assets authenticated update own mosque" ON storage.objects;
DROP POLICY IF EXISTS "mosque-assets authenticated delete own mosque" ON storage.objects;

CREATE POLICY "mosque-assets authenticated insert own mosque"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'mosque-assets'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

CREATE POLICY "mosque-assets authenticated update own mosque"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'mosque-assets'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  )
  WITH CHECK (
    bucket_id = 'mosque-assets'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

CREATE POLICY "mosque-assets authenticated delete own mosque"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'mosque-assets'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

-- ----- slides -----
DROP POLICY IF EXISTS "slides authenticated insert own mosque" ON storage.objects;
DROP POLICY IF EXISTS "slides authenticated update own mosque" ON storage.objects;
DROP POLICY IF EXISTS "slides authenticated delete own mosque" ON storage.objects;

CREATE POLICY "slides authenticated insert own mosque"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'slides'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

CREATE POLICY "slides authenticated update own mosque"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'slides'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  )
  WITH CHECK (
    bucket_id = 'slides'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

CREATE POLICY "slides authenticated delete own mosque"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'slides'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

-- ----- qris -----
DROP POLICY IF EXISTS "qris authenticated insert own mosque" ON storage.objects;
DROP POLICY IF EXISTS "qris authenticated update own mosque" ON storage.objects;
DROP POLICY IF EXISTS "qris authenticated delete own mosque" ON storage.objects;

CREATE POLICY "qris authenticated insert own mosque"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'qris'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

CREATE POLICY "qris authenticated update own mosque"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'qris'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  )
  WITH CHECK (
    bucket_id = 'qris'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

CREATE POLICY "qris authenticated delete own mosque"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'qris'
    AND split_part(name, '/', 1) = public.mosque_id()::text
  );

COMMIT;
