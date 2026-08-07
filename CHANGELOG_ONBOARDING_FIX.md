# Fix: Data Onboarding Otomatis Terisi di Settings

## Masalah
Setelah registrasi dan mengisi form onboarding, data yang diinput (Nama Masjid, Provinsi, Kota, Alamat, Kode Pos, dll.) tidak muncul di halaman `/dashboard/settings`.

## Penyebab
Di file `src/app/onboarding/page.tsx`, data disimpan dengan format yang tidak sesuai dengan struktur tabel `mosques`:
- Field `address` digabung dari `district + address + postalCode`
- Field `district` dan `postal_code` tidak disimpan sebagai kolom terpisah

## Solusi
Memperbaiki logika `INSERT` di onboarding agar menyimpan data dengan struktur yang benar:

```typescript
const insertPayload: Record<string, unknown> = {
  owner_id: userData.user.id,
  name: form.name.trim(),
  slug,
  province: form.province.trim() || null,
  city: form.city.trim() || null,
  address: form.address.trim() || null,  // ← Alamat lengkap SAJA
  whatsapp: form.whatsapp.trim() || null,
  logo_url: logoUrl,
};

// Add optional fields
if (form.district.trim()) insertPayload.district = form.district.trim();  // ← Kolom terpisah
if (form.postalCode.trim()) insertPayload.postal_code = form.postalCode.trim();  // ← Kolom terpisah
if (form.latitude) insertPayload.latitude = parseFloat(form.latitude);
if (form.longitude) insertPayload.longitude = parseFloat(form.longitude);
```

## Hasil
✅ Setelah registrasi dan onboarding, semua field di `/dashboard/settings` akan otomatis terisi:
- Nama Masjid
- Slug (URL)
- Alamat
- Provinsi
- Kota
- Kecamatan
- Kode Pos
- Logo (jika diupload)

## File yang Dimodifikasi
- `src/app/onboarding/page.tsx` (baris ~353-374)

## Testing
```bash
npm run build  # ✓ Build berhasil tanpa error
```

---
**Catatan**: User yang sudah registrasi sebelum fix ini perlu mengisi ulang data di halaman Settings secara manual.
