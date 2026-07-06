# Multi-Tenant Migration V2 — Risk Assessment

**Date:** 2026-06-01
**Migration:** `002_multi_tenant_v2.sql`

---

## Summary

This migration adds `mosque_id uuid` columns to 6 tables, enables Row Level Security, and creates a signup trigger. It also cleans up any leftover bigint columns from V1.

---

## Risk Matrix

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Data loss from dropping bigint mosque_id column | HIGH | LOW (only if V1 was applied AND data was manually assigned) | V1 bigint columns are dropped only if detected. If V1 was never applied, this is a no-op. **Pre-check:** verify if any rows have non-null bigint mosque_id before running. |
| Backfill assigns all data to wrong mosque | MEDIUM | LOW (only matters if multiple mosques exist) | Currently single-tenant in production. Backfill uses first mosque. If multiple mosques exist, manually assign before running. |
| NOT NULL enforcement fails | LOW | LOW | Validation block will ABORT the transaction if any NULLs remain. No partial state. |
| RLS locks out existing sessions | MEDIUM | MEDIUM | `auth.mosque_id()` depends on profiles row existing. Backfill step 4 ensures all auth.users get a profile. Existing sessions may need to re-authenticate. |
| TV page (public, no auth) breaks | HIGH | MEDIUM | All tables have `FOR SELECT USING (true)` — public reads are unrestricted. TV page should continue working without auth. |
| New user signup fails if no mosques exist | MEDIUM | LOW | Trigger inserts profile with first mosque. If mosques table is empty, mosque_id will be NULL and insert will fail FK constraint. **Ensure at least one mosque exists.** |
| Performance during backfill | LOW | LOW | UPDATE with WHERE mosque_id IS NULL is a full table scan but tables are small in production. |

---

## Pre-Migration Checklist

1. **Backup database** — Use Supabase dashboard or `pg_dump`.
2. **Verify mosques table has at least 1 row:**
   ```sql
   SELECT count(*) FROM mosques;
   ```
3. **Check if V1 was applied (bigint columns exist):**
   ```sql
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'announcements' AND column_name = 'mosque_id';
   ```
4. **If V1 was applied with real data, export it first:**
   ```sql
   SELECT id, mosque_id FROM announcements WHERE mosque_id IS NOT NULL;
   -- Repeat for other tables
   ```
5. **Check for auth.users without profiles:**
   ```sql
   SELECT u.id, u.email FROM auth.users u
   WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
   ```

---

## Post-Migration Validation

Run these after migration succeeds:

```sql
-- 1. Verify no NULLs
SELECT 'announcements' AS tbl, count(*) AS nulls FROM announcements WHERE mosque_id IS NULL
UNION ALL SELECT 'slides', count(*) FROM slides WHERE mosque_id IS NULL
UNION ALL SELECT 'events', count(*) FROM events WHERE mosque_id IS NULL
UNION ALL SELECT 'donations', count(*) FROM donations WHERE mosque_id IS NULL
UNION ALL SELECT 'transactions', count(*) FROM transactions WHERE mosque_id IS NULL
UNION ALL SELECT 'qris_settings', count(*) FROM qris_settings WHERE mosque_id IS NULL;

-- 2. Verify all auth.users have profiles
SELECT u.id FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- 3. Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('mosques','profiles','announcements','slides','events','donations','transactions','qris_settings');

-- 4. Verify policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Test public read (should work without auth)
SET role anon;
SELECT count(*) FROM mosques;
SELECT count(*) FROM announcements;
RESET role;

-- 6. Test authenticated access
SET role authenticated;
SET request.jwt.claims = '{"sub": "<your-user-uuid>"}';
SELECT * FROM profiles;
RESET role;
```

---

## Rollback Plan

1. Run `002_multi_tenant_v2_rollback.sql` within a transaction.
2. Rollback removes: mosque_id columns, indexes, RLS policies, trigger, helper function.
3. Rollback preserves: profiles table and its data.
4. After rollback, the app returns to single-tenant mode (no RLS, no mosque_id filtering).

**Rollback does NOT recover data** if bigint mosque_id columns from V1 were dropped. This is why step 4 of the pre-migration checklist is critical.

---

## Deployment Recommendation

- **Environment:** Run on staging/local first with `supabase db reset` or a branch database.
- **Downtime:** Expect brief write interruption during ALTER TABLE. Reads continue.
- **Monitoring:** Watch Supabase logs for RLS denial errors after deployment.
- **Rollback window:** Immediate — rollback SQL is idempotent and safe to run anytime.
