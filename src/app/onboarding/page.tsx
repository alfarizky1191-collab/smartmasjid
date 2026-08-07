"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MosqueForm {
  name: string;
  province: string;
  city: string;
  district: string;
  address: string;
  postalCode: string;
  whatsapp: string;
  latitude: string;
  longitude: string;
}

interface FormErrors {
  name?: string;
  province?: string;
  city?: string;
  address?: string;
  whatsapp?: string;
  latitude?: string;
  longitude?: string;
  general?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateSlug(name: string, city: string): string {
  const base = slugify(`${name} ${city}`);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

// ─── Mosque SVG icon ─────────────────────────────────────────────────────────

function MosqueIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <path d="M32 4C28 4 24 8 24 12L24 16L8 16L8 56L56 56L56 16L40 16L40 12C40 8 36 4 32 4ZM28 12C28 10 30 8 32 8C34 8 36 10 36 12L36 16L28 16ZM12 20L52 20L52 52L38 52L38 36C38 32 35 28 32 28C29 28 26 32 26 36L26 52L12 52Z" />
    </svg>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  error,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  error?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full px-4 py-2.5 rounded-xl border text-gray-800 bg-white text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/30 disabled:bg-gray-50 disabled:text-gray-400 ${
        error
          ? "border-red-400 focus:border-red-400"
          : "border-gray-200 focus:border-emerald-500"
      }`}
    />
  );
}

// ─── Logo uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  logoPreview,
  uploading,
  onFileChange,
  onRemove,
}: {
  logoPreview: string | null;
  uploading: boolean;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-gray-700">Logo Masjid</span>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
          {logoPreview ? (
            <>
              <Image
                src={logoPreview}
                alt="Logo preview"
                fill
                className="object-cover rounded-2xl"
              />
              <button
                type="button"
                onClick={onRemove}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Hapus logo"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </>
          ) : uploading ? (
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          ) : (
            <MosqueIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>

        {/* Upload button */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm px-4 py-2 rounded-xl border border-emerald-200 transition-colors disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Mengunggah..." : "Upload Logo"}
          </button>
          <p className="text-xs text-gray-400">PNG, JPG. Maks 2 MB.</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChange(file);
            // Reset so same file can be re-selected
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: MosqueForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Nama masjid wajib diisi.";
  if (!form.province.trim()) errors.province = "Provinsi wajib diisi.";
  if (!form.city.trim()) errors.city = "Kota/Kabupaten wajib diisi.";
  if (!form.address.trim()) errors.address = "Alamat wajib diisi.";

  const phoneRe = /^\+?[0-9\s\-]{8,16}$/;
  if (form.whatsapp && !phoneRe.test(form.whatsapp)) {
    errors.whatsapp = "Format nomor WhatsApp tidak valid.";
  }

  if (form.latitude && isNaN(Number(form.latitude))) {
    errors.latitude = "Latitude harus berupa angka.";
  }
  if (form.longitude && isNaN(Number(form.longitude))) {
    errors.longitude = "Longitude harus berupa angka.";
  }

  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState<MosqueForm>({
    name: "",
    province: "",
    city: "",
    district: "",
    address: "",
    postalCode: "",
    whatsapp: "",
    latitude: "",
    longitude: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/register";
        return;
      }
      setUserId(data.user.id);
      setAuthChecked(true);
    });
  }, []);

  // ── Field helper ───────────────────────────────────────────────────────────
  const setField = useCallback(
    (field: keyof MosqueForm) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    },
    []
  );

  // ── Logo handling ──────────────────────────────────────────────────────────
  const handleLogoFile = useCallback((file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, general: "Ukuran logo maksimal 2 MB." }));
      return;
    }
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  }, []);

  const handleLogoRemove = useCallback(() => {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
  }, [logoPreview]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!userId) return;

    setSaving(true);
    setErrors({});

    try {
      // 1. Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        setUploading(true);
        const ext = logoFile.name.split(".").pop() ?? "jpg";
        const path = `logos/${userId}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("mosque-assets")
          .upload(path, logoFile, { upsert: true, contentType: logoFile.type });

        if (uploadError) throw new Error(`Upload logo gagal: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("mosque-assets")
          .getPublicUrl(path);
        logoUrl = urlData.publicUrl;
        setUploading(false);
      }

      // 2. Ensure a profile exists for the current user before creating the mosque
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Sesi tidak valid. Silakan masuk kembali.");
      }

      const fullName =
        (userData.user.user_metadata?.full_name as string | undefined) ??
        userData.user.email ??
        "Admin";

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userData.user.id,
            full_name: fullName,
            role: "admin_masjid",
            mosque_id: null,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        throw new Error(`Gagal menyimpan profil: ${profileError.message}`);
      }

      // 3. Insert mosque record owned by the current user
      const slug = generateSlug(form.name, form.city);
      
      // Build insert payload with proper field mapping
      const insertPayload: Record<string, unknown> = {
        owner_id: userData.user.id,
        name: form.name.trim(),
        slug,
        province: form.province.trim() || null,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        logo_url: logoUrl,
      };
      
      // Add optional fields
      if (form.district.trim()) insertPayload.district = form.district.trim();
      if (form.postalCode.trim()) insertPayload.postal_code = form.postalCode.trim();
      if (form.latitude) insertPayload.latitude = parseFloat(form.latitude);
      if (form.longitude) insertPayload.longitude = parseFloat(form.longitude);
      
      const { data: mosqueData, error: mosqueError } = await supabase
        .from("mosques")
        .insert(insertPayload)
        .select("id")
        .single();

      if (mosqueError || !mosqueData) {
        throw new Error(mosqueError?.message ?? "Gagal menyimpan data masjid.");
      }

      // 4. Link the profile to the newly created mosque
      const { error: profileLinkError } = await supabase
        .from("profiles")
        .update({ mosque_id: mosqueData.id })
        .eq("id", userData.user.id);

      if (profileLinkError) {
        throw new Error(`Gagal menghubungkan profil ke masjid: ${profileLinkError.message}`);
      }

      setDone(true);
      // Brief delay so user sees the success state before redirect
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi." });
      setSaving(false);
      setUploading(false);
    }
  };

  // ── Loading / auth ─────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center gap-5 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Masjid Berhasil Didaftarkan!</h2>
            <p className="text-gray-500 text-sm">Mengarahkan ke Dashboard...</p>
          </div>
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <MosqueIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">SmartMasjid</span>
          </Link>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-600">Buat Akun</span>
            </div>
            <div className="w-12 h-0.5 bg-emerald-300 rounded-full" />
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">Profil Masjid</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-200 rounded-full" />
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-400">3</span>
              </div>
              <span className="text-xs font-semibold text-gray-400">Dashboard</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Lengkapi Profil Masjid
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Informasi ini akan ditampilkan di TV Display, Mobile App, dan Dashboard Admin Anda.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* General error */}
            {errors.general && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Logo */}
            <LogoUploader
              logoPreview={logoPreview}
              uploading={uploading}
              onFileChange={handleLogoFile}
              onRemove={handleLogoRemove}
            />

            <div className="h-px bg-gray-100" />

            {/* Nama Masjid */}
            <Field id="name" label="Nama Masjid" required error={errors.name}>
              <TextInput
                id="name"
                value={form.name}
                onChange={setField("name")}
                placeholder="Masjid Al-Ikhlas"
                error={!!errors.name}
                disabled={saving}
              />
            </Field>

            {/* Provinsi + Kota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="province" label="Provinsi" required error={errors.province}>
                <TextInput
                  id="province"
                  value={form.province}
                  onChange={setField("province")}
                  placeholder="Jawa Barat"
                  error={!!errors.province}
                  disabled={saving}
                />
              </Field>
              <Field id="city" label="Kabupaten / Kota" required error={errors.city}>
                <TextInput
                  id="city"
                  value={form.city}
                  onChange={setField("city")}
                  placeholder="Kota Bandung"
                  error={!!errors.city}
                  disabled={saving}
                />
              </Field>
            </div>

            {/* Kecamatan */}
            <Field id="district" label="Kecamatan">
              <TextInput
                id="district"
                value={form.district}
                onChange={setField("district")}
                placeholder="Coblong"
                disabled={saving}
              />
            </Field>

            {/* Alamat */}
            <Field id="address" label="Alamat Lengkap" required error={errors.address}>
              <textarea
                id="address"
                value={form.address}
                onChange={(e) => setField("address")(e.target.value)}
                placeholder="Jl. Dipatiukur No. 1"
                rows={3}
                disabled={saving}
                className={`w-full px-4 py-2.5 rounded-xl border text-gray-800 bg-white text-sm outline-none transition-colors resize-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-gray-50 disabled:text-gray-400 ${
                  errors.address
                    ? "border-red-400 focus:border-red-400"
                    : "border-gray-200 focus:border-emerald-500"
                }`}
              />
            </Field>

            {/* Kode Pos */}
            <Field id="postalCode" label="Kode Pos">
              <TextInput
                id="postalCode"
                value={form.postalCode}
                onChange={setField("postalCode")}
                placeholder="40135"
                type="text"
                disabled={saving}
              />
            </Field>

            {/* WhatsApp */}
            <Field id="whatsapp" label="Nomor WhatsApp" error={errors.whatsapp}>
              <TextInput
                id="whatsapp"
                value={form.whatsapp}
                onChange={setField("whatsapp")}
                placeholder="08123456789"
                type="tel"
                autoComplete="tel"
                error={!!errors.whatsapp}
                disabled={saving}
              />
            </Field>

            <div className="h-px bg-gray-100" />

            {/* Lat/Long optional */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Koordinat GPS{" "}
                <span className="text-xs text-gray-400 font-normal">(opsional)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="latitude" label="Latitude" error={errors.latitude}>
                  <TextInput
                    id="latitude"
                    value={form.latitude}
                    onChange={setField("latitude")}
                    placeholder="-6.9175"
                    error={!!errors.latitude}
                    disabled={saving}
                  />
                </Field>
                <Field id="longitude" label="Longitude" error={errors.longitude}>
                  <TextInput
                    id="longitude"
                    value={form.longitude}
                    onChange={setField("longitude")}
                    placeholder="107.6191"
                    error={!!errors.longitude}
                    disabled={saving}
                  />
                </Field>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm mt-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Simpan &amp; Lanjutkan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Skip link */}
            <p className="text-center text-xs text-gray-400">
              Ingin mengisi nanti?{" "}
              <Link href="/dashboard" className="text-emerald-600 font-semibold hover:underline">
                Lewati untuk sekarang
              </Link>
            </p>

          </form>
        </div>
      </div>
    </main>
  );
}
