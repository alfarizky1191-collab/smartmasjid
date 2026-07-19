"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Building2, CheckCircle2 } from "lucide-react";

type PageState = "loading" | "form" | "success";

/**
 * Derive a URL-safe slug from any string.
 *
 * Steps:
 *  1. Lowercase the whole string.
 *  2. Normalise Unicode (NFD) and strip combining diacritics so that
 *     accented/Arabic-latin characters become their base ASCII equivalents.
 *  3. Replace any character that is NOT a letter, digit, or hyphen with "-".
 *  4. Collapse consecutive hyphens into one.
 *  5. Trim leading/trailing hyphens.
 *  6. Fall back to a timestamp slug if the result is empty (e.g. pure Arabic input).
 *
 * Examples:
 *   "Masjid AT-TAQWA"  → "masjid-at-taqwa"
 *   "Al Hidayah"       → "al-hidayah"
 *   "Masjid Jami'"     → "masjid-jami"
 */
function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9-]/g, "-")    // non-alphanumeric → hyphen
    .replace(/-{2,}/g, "-")          // collapse duplicate hyphens
    .replace(/^-+|-+$/g, "");        // trim leading/trailing hyphens

  return slug || `masjid-${Date.now()}`;
}

interface FormData {
  mosqueName: string;
  city: string;
  province: string;
}

interface FormErrors {
  mosqueName?: string;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.mosqueName.trim()) {
    errors.mosqueName = "Nama masjid wajib diisi.";
  }
  return errors;
}

export default function SetupPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    mosqueName: "",
    city: "",
    province: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Not logged in — send to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Already has a mosque — send to dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("mosque_id")
      .eq("id", user.id)
      .single();

    if (profile?.mosque_id) {
      router.replace("/dashboard");
      return;
    }

    setUserId(user.id);
    setPageState("form");
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!userId) {
      setSubmitError("Sesi tidak valid. Silakan login ulang.");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      // 1. Always generate a slug — the column is NOT NULL
      const slug = generateSlug(formData.mosqueName);

      // 2. INSERT new mosque row
      const { data: mosqueData, error: mosqueError } = await supabase
        .from("mosques")
        .insert({
          name: formData.mosqueName.trim(),
          slug,
          ...(formData.city.trim() ? { city: formData.city.trim() } : {}),
          ...(formData.province.trim() ? { province: formData.province.trim() } : {}),
        })
        .select("id")
        .single();

      if (mosqueError || !mosqueData?.id) {
        const msg = mosqueError?.message || "Gagal membuat masjid.";
        setSubmitError(msg);
        return;
      }

      // 3. Link this mosque to the current user's profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ mosque_id: mosqueData.id })
        .eq("id", userId);

      if (profileError) {
        setSubmitError("Masjid dibuat, tapi gagal menghubungkan ke profil: " + profileError.message);
        return;
      }

      // 4. All done
      setPageState("success");

      // Redirect after a brief moment so the user sees the success state
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1500);
    } catch {
      setSubmitError("Terjadi kesalahan tidak terduga. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Success state */}
          {pageState === "success" && (
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Masjid Berhasil Dibuat!</h1>
              <p className="text-slate-600 text-sm">
                Mengarahkan ke dashboard...
              </p>
            </div>
          )}

          {/* Form state */}
          {pageState === "form" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-1">Daftarkan Masjid Anda</h1>
                <p className="text-slate-500 text-sm">
                  Masukkan nama masjid untuk memulai. Detail lainnya dapat dilengkapi nanti di pengaturan.
                </p>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
                >
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Mosque Name */}
                <div>
                  <label htmlFor="mosqueName" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Masjid <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mosqueName"
                    name="mosqueName"
                    type="text"
                    autoComplete="organization"
                    autoFocus
                    value={formData.mosqueName}
                    onChange={handleChange}
                    disabled={loading}
                    aria-invalid={!!errors.mosqueName}
                    aria-describedby={errors.mosqueName ? "mosqueName-error" : undefined}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm"
                    placeholder="Contoh: Masjid Al-Hidayah"
                  />
                  {errors.mosqueName && (
                    <p id="mosqueName-error" className="text-red-600 text-xs mt-1">
                      {errors.mosqueName}
                    </p>
                  )}
                </div>

                {/* City (optional) */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
                    Kota / Kabupaten{" "}
                    <span className="text-slate-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm"
                    placeholder="Contoh: Bandung"
                  />
                </div>

                {/* Province (optional) */}
                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-slate-700 mb-1">
                    Provinsi{" "}
                    <span className="text-slate-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    id="province"
                    name="province"
                    type="text"
                    value={formData.province}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm"
                    placeholder="Contoh: Jawa Barat"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  aria-busy={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membuat Masjid...
                    </>
                  ) : (
                    "Buat Masjid & Mulai"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
