-- ============================================================
-- SmartMasjid: Sprint 5.1 - Audit Trail
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id uuid NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  role text NOT NULL,
  action text NOT NULL,
  module text NOT NULL,
  ip_address text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_mosque_created_at
  ON audit_logs(mosque_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module
  ON audit_logs(module);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON audit_logs(user_id);

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert audit logs for own mosque" ON audit_logs;
DROP POLICY IF EXISTS "Admins read own mosque audit logs" ON audit_logs;

CREATE POLICY "Users insert audit logs for own mosque"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND mosque_id = public.mosque_id()
  );

CREATE POLICY "Admins read own mosque audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    mosque_id = public.mosque_id()
    AND public.current_role() IN ('super_admin', 'admin_masjid')
  );

COMMIT;
