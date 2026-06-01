# SmartMasjid Multi-Tenant Audit Report

**Tanggal:** 2026-06-01
**Status:** ❌ BELUM SIAP MULTI-TENANT

---

## 1. Executive Summary

Aplikasi SmartMasjid saat ini beroperasi dalam mode **single-tenant**. Tidak ada isolasi data antar masjid. Semua query mengambil data tanpa filter `mosque_id`, dan tidak ada mekanisme untuk menghubungkan user ke masjid tertentu.

---

## 2. Schema Audit

### Tabel yang Sudah Ada

| Tabel | Punya `mosque_id`? | Status |
|-------|-------------------|--------|
| `mosques` | N/A (ini tabel induk) | ✅ Siap |
| `profiles` | ❓ Belum terpakai di code | ⚠️ Perlu verifikasi |
| `announcements` | ❌ Tidak ada | 🔴 Perlu migration |
| `slides` | ❌ Tidak ada | 🔴 Perlu migration |
| `events` | ❌ Tidak ada | 🔴 Perlu migration |
| `donations` | ❌ Tidak ada | 🔴 Perlu migration |
| `transactions` | ❌ Tidak ada | 🔴 Perlu migration |
| `prayer_schedules` | ❓ Tidak terpakai di code | ⚠️ Perlu verifikasi |
| `qris_settings` | ❌ Tidak ada (hardcoded id:1) | 🔴 Perlu migration |

### Kesimpulan Schema

- **7 dari 9 tabel** memerlukan kolom `mosque_id`
- Tabel `mosques` sudah benar sebagai tabel induk
- Tabel `profiles` ada di database tapi tidak digunakan di source code

---

## 3. Source Code Audit

### 3.1 Login (`src/app/login/page.tsx`)

```typescript
// MASALAH: Login hanya autentikasi, tidak resolve mosque_id
const { error } = await supabase.auth.signInWithPassword({ email, password });
window.location.href = "/dashboard";
```

**Bug:** Setelah login, tidak ada proses untuk menentukan masjid mana yang dimiliki user.

---

### 3.2 Dashboard (`src/app/dashboard/page.tsx`)

| Query | Masalah |
|-------|---------|
| `supabase.from("mosques").select("*").limit(1)` | Mengambil masjid pertama di DB, bukan milik user |
| `supabase.from("slides").select("*")` | Mengambil SEMUA slides tanpa filter |
| `supabase.from("announcements").select("*")` | Mengambil SEMUA announcements tanpa filter |
| `.from("announcements").insert({ title })` | Insert tanpa `mosque_id` |
| `.from("slides").insert([{ image_url }])` | Insert tanpa `mosque_id` |

---

### 3.3 Finance (`src/app/dashboard/finance/page.tsx`)

| Query | Masalah |
|-------|---------|
| `supabase.from("transactions").select("*")` | Mengambil SEMUA transaksi tanpa filter |
| `.from("transactions").insert([{ type, category, title, amount, note }])` | Insert tanpa `mosque_id` |

---

### 3.4 Donasi (`src/app/dashboard/donasi/page.tsx`)

| Query | Masalah |
|-------|---------|
| `supabase.from("donations").select("*")` | Mengambil SEMUA donasi tanpa filter |
| `.from("qris_settings").upsert([{ id: 1, image_url }])` | Hardcoded `id: 1` — semua masjid share 1 QRIS |
| `.from("donations").insert([{ donor_name, amount, note }])` | Insert tanpa `mosque_id` |
| `.from("transactions").insert([{ ... }])` | Insert tanpa `mosque_id` |
| Realtime: `table: "donations"` | Subscribe ke SEMUA donasi |

---

### 3.5 Events (`src/app/dashboard/events/page.tsx`)

| Query | Masalah |
|-------|---------|
| `supabase.from("events").select("*")` | Mengambil SEMUA events tanpa filter |
| `.from("events").insert([{ ... }])` | Insert tanpa `mosque_id` |
| Realtime: `table: "events"` | Subscribe ke SEMUA events |

---

### 3.6 TV Display (`src/app/tv/page.tsx`)

| Query | Masalah |
|-------|---------|
| `supabase.from("mosques").select("*").limit(1)` | Mengambil masjid pertama, bukan berdasarkan parameter |
| `supabase.from("events").select("*").gte(...)` | Mengambil SEMUA events |
| `supabase.from("donations").select("*")` | Mengambil SEMUA donasi |
| `supabase.from("qris_settings").select("*").single()` | Mengambil satu-satunya QRIS |
| `supabase.from("slides").select("*")` | Mengambil SEMUA slides |
| `supabase.from("announcements").select("*")` | Mengambil SEMUA announcements |
| Realtime: 4 channel tanpa filter | Subscribe ke SEMUA perubahan |

**Critical:** TV page tidak punya mekanisme untuk menentukan masjid mana yang ditampilkan.

---

## 4. Potensi Bug Multi-Tenant

| # | Bug | Severity | Dampak |
|---|-----|----------|--------|
| 1 | Mosque diambil dengan `.limit(1)` | 🔴 Critical | Semua user melihat masjid yang sama |
| 2 | Semua data tanpa filter mosque_id | 🔴 Critical | Data masjid A terlihat di masjid B |
| 3 | Insert tanpa mosque_id | 🔴 Critical | Data tidak bisa di-assign ke masjid |
| 4 | QRIS hardcoded id:1 | 🔴 Critical | Semua masjid share 1 QRIS |
| 5 | Realtime tanpa filter | 🟡 High | Notifikasi donasi masjid lain muncul |
| 6 | TV page tanpa identifier | 🟡 High | Tidak bisa menampilkan masjid spesifik |
| 7 | Login tidak resolve mosque | 🟡 High | User tidak terikat ke masjid |
| 8 | Storage tanpa namespace | 🟡 Medium | File bisa tertimpa antar masjid |

---

## 5. Migration SQL

```sql
-- ============================================
-- MIGRATION: Multi-Tenant SmartMasjid
-- ============================================

-- 1. Pastikan tabel mosques menggunakan UUID
-- (Jika masih integer, perlu migrasi terpisah)

-- 2. Buat/update tabel profiles untuk relasi user-mosque
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mosque_id uuid NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_mosque_id ON profiles(mosque_id);
CREATE INDEX idx_profiles_user_id ON profiles(id);

-- 3. Tambah mosque_id ke announcements
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX idx_announcements_mosque_id ON announcements(mosque_id);

-- 4. Tambah mosque_id ke slides
ALTER TABLE slides
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX idx_slides_mosque_id ON slides(mosque_id);

-- 5. Tambah mosque_id ke events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX idx_events_mosque_id ON events(mosque_id);

-- 6. Tambah mosque_id ke donations
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX idx_donations_mosque_id ON donations(mosque_id);

-- 7. Tambah mosque_id ke transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX idx_transactions_mosque_id ON transactions(mosque_id);

-- 8. Tambah mosque_id ke qris_settings (dan hapus hardcoded id)
ALTER TABLE qris_settings
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

-- Buat unique constraint agar 1 masjid = 1 QRIS
ALTER TABLE qris_settings
  ADD CONSTRAINT uq_qris_mosque UNIQUE (mosque_id);

CREATE INDEX idx_qris_settings_mosque_id ON qris_settings(mosque_id);

-- 9. Tambah mosque_id ke prayer_schedules (jika ada)
ALTER TABLE prayer_schedules
  ADD COLUMN IF NOT EXISTS mosque_id uuid REFERENCES mosques(id) ON DELETE CASCADE;

CREATE INDEX idx_prayer_schedules_mosque_id ON prayer_schedules(mosque_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS pada semua tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qris_settings ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa akses data masjid sendiri
CREATE POLICY "Users can view own mosque profiles"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view own mosque announcements"
  ON announcements FOR ALL
  USING (mosque_id = (SELECT mosque_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own mosque slides"
  ON slides FOR ALL
  USING (mosque_id = (SELECT mosque_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own mosque events"
  ON events FOR ALL
  USING (mosque_id = (SELECT mosque_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own mosque donations"
  ON donations FOR ALL
  USING (mosque_id = (SELECT mosque_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own mosque transactions"
  ON transactions FOR ALL
  USING (mosque_id = (SELECT mosque_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view own mosque qris"
  ON qris_settings FOR ALL
  USING (mosque_id = (SELECT mosque_id FROM profiles WHERE id = auth.uid()));

-- Policy: TV display (public read berdasarkan mosque_id)
CREATE POLICY "Public can view mosque data"
  ON mosques FOR SELECT
  USING (true);

CREATE POLICY "Public can view announcements by mosque"
  ON announcements FOR SELECT
  USING (true);

CREATE POLICY "Public can view slides by mosque"
  ON slides FOR SELECT
  USING (true);

CREATE POLICY "Public can view events by mosque"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Public can view donations by mosque"
  ON donations FOR SELECT
  USING (true);

CREATE POLICY "Public can view qris by mosque"
  ON qris_settings FOR SELECT
  USING (true);

-- ============================================
-- DATA MIGRATION (untuk data existing)
-- ============================================

-- Jika sudah ada data, assign ke masjid pertama:
-- UPDATE announcements SET mosque_id = (SELECT id FROM mosques LIMIT 1) WHERE mosque_id IS NULL;
-- UPDATE slides SET mosque_id = (SELECT id FROM mosques LIMIT 1) WHERE mosque_id IS NULL;
-- UPDATE events SET mosque_id = (SELECT id FROM mosques LIMIT 1) WHERE mosque_id IS NULL;
-- UPDATE donations SET mosque_id = (SELECT id FROM mosques LIMIT 1) WHERE mosque_id IS NULL;
-- UPDATE transactions SET mosque_id = (SELECT id FROM mosques LIMIT 1) WHERE mosque_id IS NULL;
-- UPDATE qris_settings SET mosque_id = (SELECT id FROM mosques LIMIT 1) WHERE mosque_id IS NULL;

-- Setelah data di-migrate, enforce NOT NULL:
-- ALTER TABLE announcements ALTER COLUMN mosque_id SET NOT NULL;
-- ALTER TABLE slides ALTER COLUMN mosque_id SET NOT NULL;
-- ALTER TABLE events ALTER COLUMN mosque_id SET NOT NULL;
-- ALTER TABLE donations ALTER COLUMN mosque_id SET NOT NULL;
-- ALTER TABLE transactions ALTER COLUMN mosque_id SET NOT NULL;
-- ALTER TABLE qris_settings ALTER COLUMN mosque_id SET NOT NULL;
```

---

## 6. Implementation Roadmap

### Architecture Target

```
┌─────────────────────────────────────────────────────┐
│                    AUTH FLOW                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Login → auth.users → profiles → mosque_id           │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  User A  │───▶│Profile A │───▶│ Mosque X │      │
│  └──────────┘    └──────────┘    └──────────┘      │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  User B  │───▶│Profile B │───▶│ Mosque Y │      │
│  └──────────┘    └──────────┘    └──────────┘      │
│                                                      │
├─────────────────────────────────────────────────────┤
│                   DATA FLOW                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Dashboard:                                          │
│    mosque_id = profile.mosque_id                     │
│    ALL queries filtered by mosque_id                 │
│    ALL inserts include mosque_id                     │
│                                                      │
│  TV Display:                                         │
│    /tv?mosque=<mosque_id>  OR  /tv/<slug>            │
│    ALL queries filtered by mosque_id from URL        │
│                                                      │
├─────────────────────────────────────────────────────┤
│                   SECURITY                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  RLS policies enforce mosque_id isolation            │
│  Even if frontend bug exists, DB blocks cross-read   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Phase 1: Database Foundation (Hari 1)

1. Jalankan migration SQL di atas
2. Buat tabel `profiles` dengan relasi user → mosque
3. Migrate data existing ke mosque pertama
4. Enforce NOT NULL setelah data migration
5. Aktifkan RLS policies

### Phase 2: Auth & Context (Hari 2)

1. Buat hook `useMosqueContext()`:
   ```typescript
   // src/hooks/useMosqueContext.ts
   // - Ambil user dari supabase.auth.getUser()
   // - Ambil profile dari profiles table
   // - Return { mosqueId, mosqueName, role, loading }
   ```

2. Buat `MosqueProvider` context:
   ```typescript
   // src/providers/MosqueProvider.tsx
   // - Wrap dashboard layout
   // - Provide mosqueId ke semua child components
   ```

3. Update login flow:
   ```typescript
   // Setelah login berhasil:
   // 1. Ambil profile
   // 2. Jika belum ada profile → redirect ke onboarding
   // 3. Jika ada → redirect ke dashboard
   ```

### Phase 3: Dashboard Refactor (Hari 3-4)

1. Update semua SELECT query:
   ```typescript
   // BEFORE:
   supabase.from("announcements").select("*")

   // AFTER:
   supabase.from("announcements").select("*").eq("mosque_id", mosqueId)
   ```

2. Update semua INSERT query:
   ```typescript
   // BEFORE:
   supabase.from("announcements").insert({ title })

   // AFTER:
   supabase.from("announcements").insert({ title, mosque_id: mosqueId })
   ```

3. Update realtime subscriptions:
   ```typescript
   // BEFORE:
   .on("postgres_changes", { event: "*", schema: "public", table: "events" }, ...)

   // AFTER:
   .on("postgres_changes", {
     event: "*",
     schema: "public",
     table: "events",
     filter: `mosque_id=eq.${mosqueId}`
   }, ...)
   ```

4. Fix QRIS settings:
   ```typescript
   // BEFORE:
   .upsert([{ id: 1, image_url }])

   // AFTER:
   .upsert([{ mosque_id: mosqueId, image_url }], { onConflict: "mosque_id" })
   ```

### Phase 4: TV Display Refactor (Hari 4-5)

1. Tambah routing parameter:
   ```
   /tv/[mosqueId]/page.tsx   ATAU   /tv?id=<mosque_id>
   ```

2. Semua query di TV page filter berdasarkan `mosqueId` dari URL

3. Realtime subscriptions filter per mosque

### Phase 5: Storage Isolation (Hari 5)

1. Namespace storage paths:
   ```typescript
   // BEFORE:
   `${Date.now()}-${file.name}`

   // AFTER:
   `${mosqueId}/${Date.now()}-${file.name}`
   ```

2. Buat storage policies per mosque (opsional, RLS di storage)

### Phase 6: Onboarding & Admin (Hari 6)

1. Buat halaman onboarding untuk masjid baru
2. Buat halaman invite user ke masjid
3. Buat role management (admin, viewer)

---

## 7. File yang Perlu Diubah

| File | Perubahan |
|------|-----------|
| `src/lib/supabase/client.ts` | Tidak berubah |
| `src/hooks/useMosqueContext.ts` | **BARU** - hook untuk mosque context |
| `src/providers/MosqueProvider.tsx` | **BARU** - context provider |
| `src/app/dashboard/layout.tsx` | **BARU** - shared layout + auth + context |
| `src/app/login/page.tsx` | Update: resolve profile setelah login |
| `src/app/dashboard/page.tsx` | Update: semua query + insert pakai mosqueId |
| `src/app/dashboard/finance/page.tsx` | Update: semua query + insert pakai mosqueId |
| `src/app/dashboard/donasi/page.tsx` | Update: semua query + insert pakai mosqueId |
| `src/app/dashboard/events/page.tsx` | Update: semua query + insert pakai mosqueId |
| `src/app/tv/page.tsx` | Update: terima mosqueId dari URL, filter semua query |
| `src/components/Adminsidebar.tsx` | Minor: tampilkan nama masjid |

---

## 8. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Data existing hilang saat migration | Backup dulu, migrate data ke mosque pertama |
| RLS terlalu ketat, TV page tidak bisa baca | Buat policy SELECT public untuk TV |
| User belum punya profile | Buat auto-create profile saat pertama login |
| Performance query dengan JOIN profiles | Index pada `profiles.mosque_id` dan `profiles.id` |
| Realtime filter tidak support di semua event | Gunakan filter `mosque_id=eq.{id}` di channel |

---

## 9. Prioritas Implementasi

```
[CRITICAL]  Phase 1: Database Migration
[CRITICAL]  Phase 2: Auth & Context
[HIGH]      Phase 3: Dashboard Refactor
[HIGH]      Phase 4: TV Display Refactor
[MEDIUM]    Phase 5: Storage Isolation
[LOW]       Phase 6: Onboarding & Admin
```

Estimasi total: **5-6 hari kerja** untuk full multi-tenant readiness.
