"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Building2, CheckCircle2 } from "lucide-react";

type PageState = "loading" | "form" | "success";

function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `masjid-${Date.now()}`;
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  let candidate = base;

  for (let i = 1; i <= 50; i++) {
    const { data, error } = await supabase
      .from("mosques")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;
    candidate = `${base}-${i + 1}`;
  }

  return `${base}-${Date.now()}`;
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
  if (!data.mosqueName.trim()) errors.mosqueName = "Nama masjid wajib diisi.";
  return errors;
}

export default function SetupPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ mosqueName: "", city: "", province: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("mosque_id")
      .eq("id", user.id)
      .single();

    if (profile?.mosque_id) { router.replace("/dashboard"); return; }
    setUserId(user.id);
    setPageState("form");
  }, [router]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    if (!userId) { setSubmitError("Sesi tidak valid. Silakan login ulang."); return; }

    setLoading(true);
    setSubmitError(null);

    try {
      const slug = await generateUniqueSlug(formData.mosqueName);
      const { data: mosqueData, error: mosqueError } = await supabase
        .from("mosques")
        .insert({
          name: formData.mosqueName.trim(),
          slug,
          owner_id: userId,
          ...(formData.city.trim() ? { city: formData.city.trim() } : {}),
          ...(formData.province.trim() ? { province: formData.province.trim() } : {}),
        })
        .select("id, slug")
        .single();

      if (mosqueError || !mosqueData?.id) {
        setSubmitError(mosqueError?.message || "Gagal membuat masjid.");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ mosque_id: mosqueData.id })
        .eq("id", userId);

      if (profileError) {
        setSubmitError("Masjid dibuat, tapi gagal menghubungkan ke profil: " + profileError.message);
        return;
      }

      setPageState("success");
      setTimeout(() => router.replace("/dashboard"), 1500);
    } catch (error: any) {
      setSubmitError(error?.message || "Terjadi kesalahan tidak terduga. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (pageState === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-8">
          <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><Building2 className="w-8 h-8 text-white" /></div></div>
          {pageState === "success" && (
            <div className="text-center"><CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" /><h1 className="text-2xl font-bold text-slate-800 mb-2">Masjid Berhasil Dibuat!</h1><p className="text-slate-600 text-sm">Mengarahkan ke dashboard...</p></div>
          )}
          {pageState === "form" && (
            <>
              <div className="text-center mb-8"><h1 className="text-2xl font-bold text-slate-800 mb-1">Daftarkan Masjid Anda</h1><p className="text-slate-500 text-sm">Masukkan nama masjid untuk memulai. Detail lainnya dapat dilengkapi nanti di pengaturan.</p></div>
              {submitError && <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{submitError}</div>}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div><label htmlFor="mosqueName" className="block text-sm font-medium text-slate-700 mb-1">Nama Masjid <span className="text-red-500">*</span></label><input id="mosqueName" name="mosqueName" type="text" autoComplete="organization" autoFocus value={formData.mosqueName} onChange={handleChange} disabled={loading} aria-invalid={!!errors.mosqueName} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm" placeholder="Contoh: Masjid Al-Hidayah" />{errors.mosqueName && <p className="text-red-600 text-xs mt-1">{errors.mosqueName}</p>}</div>
                <div><label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">Kota / Kabupaten <span className="text-slate-400 font-normal">(opsional)</span></label><input id="city" name="city" type="text" value={formData.city} onChange={handleChange} disabled={loading} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm" placeholder="Contoh: Bandung" /></div>
                <div><label htmlFor="province" className="block text-sm font-medium text-slate-700 mb-1">Provinsi <span className="text-slate-400 font-normal">(opsional)</span></label><input id="province" name="province" type="text" value={formData.province} onChange={handleChange} disabled={loading} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-sm" placeholder="Contoh: Jawa Barat" /></div>
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-semibold disabled:opacity-50">{loading ? "Membuat masjid..." : "Buat Masjid"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
