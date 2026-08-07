-- ============================================================
-- SmartMasjid: Fix handle_new_user trigger
-- ============================================================
-- The trigger was inserting role = 'admin' which violates the
-- profiles_role_check constraint. Valid values are:
--   'super_admin', 'admin_masjid', 'bendahara', 'operator_tv', 'jamaah'
-- New users registering a mosque should get 'admin_masjid'.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, mosque_id, full_name, role)
  VALUES (
    NEW.id,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin_masjid'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMIT;
