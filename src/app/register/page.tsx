"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Monitor,
  Smartphone,
  Bell,
  Calendar,
  BarChart2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  namaAdmin: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface FormErrors {
  namaAdmin?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms?: string;
  general?: string;
}

// ─── Mosque SVG icon ─────────────────────────────────────────────────────────

function MosqueIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <path d="M32 4C28 4 24 8 24 12L24 16L8 16L8 56L56 56L56 16L40 16L40 12C40 8 36 4 32 4ZM28 12C28 10 30 8 32 8C34 8 36 10 36 12L36 16L28 16ZM12 20L52 20L52 52L38 52L38 36C38 32 35 28 32 28C29 28 26 32 26 36L26 52L12 52Z" />
    </svg>
  );
}

// ─── Benefits list ────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: BarChart2,  label: "Dashboard Admin lengkap" },
  { icon: Monitor,    label: "TV Display real-time" },
  { icon: Smartphone, label: "Mobile App untuk jamaah" },
  { icon: Bell,       label: "Pengumuman digital" },
  { icon: Calendar,   label: "Jadwal kegiatan otomatis" },
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.namaAdmin.trim()) {
    errors.namaAdmin = "Nama pengelola wajib diisi.";
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.email.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!emailRe.test(form.email)) {
    errors.email = "Format email tidak valid.";
  }

  if (!form.password) {
    errors.password = "Password wajib diisi.";
  } else if (form.password.length < 8) {
    errors.password = "Password minimal 8 karakter.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password wajib diisi.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Password tidak cocok.";
  }

  if (!form.agreeTerms) {
    errors.agreeTerms = "Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.";
  }

  return errors;
}

// ─── Register Form ────────────────────────────────────────────────────────────

function RegisterForm() {
  const [form, setForm] = useState<FormState>({
    namaAdmin: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear field error on change
      setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          full_name: form.namaAdmin.trim(),
        },
      },
    });

    if (error) {
      let msg = error.message;
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("unique")) {
        msg = "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
      } else if (msg.includes("invalid")) {
        msg = "Format email tidak valid.";
      } else if (msg.includes("weak")) {
        msg = "Password terlalu lemah. Gunakan kombinasi huruf dan angka.";
      }
      setErrors({ general: msg });
      setLoading(false);
      return;
    }

    // If email confirmation is required, Supabase returns a user without a session.
    // If auto-confirm is on, session is set and we redirect to /onboarding.
    if (data.session) {
      window.location.href = "/onboarding";
    } else {
      // Email verification required
      setSuccessMsg(
        "Akun berhasil dibuat! Periksa email Anda untuk konfirmasi, lalu kembali untuk masuk."
      );
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="flex flex-col items-center text-center gap-5 py-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cek Email Anda</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{successMsg}</p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Masuk ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* General error */}
      {errors.general && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Nama Pengelola */}
      <div className="flex flex-col gap-1">
        <label htmlFor="namaAdmin" className="text-sm font-semibold text-gray-700">
          Nama Pengelola
        </label>
        <input
          id="namaAdmin"
          type="text"
          autoComplete="name"
          placeholder="Nama lengkap Anda"
          value={form.namaAdmin}
          onChange={set("namaAdmin")}
          className={`w-full px-4 py-2.5 rounded-xl border text-gray-800 bg-white text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/30 ${
            errors.namaAdmin ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-emerald-500"
          }`}
        />
        {errors.namaAdmin && (
          <p className="text-xs text-red-500">{errors.namaAdmin}</p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="email@masjid.id"
          value={form.email}
          onChange={set("email")}
          className={`w-full px-4 py-2.5 rounded-xl border text-gray-800 bg-white text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/30 ${
            errors.email ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-emerald-500"
          }`}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-semibold text-gray-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChange={set("password")}
            className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-gray-800 bg-white text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/30 ${
              errors.password ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-emerald-500"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
          Konfirmasi Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ulangi password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-gray-800 bg-white text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/30 ${
              errors.confirmPassword ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-emerald-500"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showConfirmPw ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms checkbox */}
      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.agreeTerms}
            onChange={set("agreeTerms")}
            className="mt-0.5 w-4 h-4 accent-emerald-600 flex-shrink-0"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            Saya telah membaca dan menyetujui{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-semibold underline-offset-2 hover:underline transition-all"
            >
              Syarat &amp; Ketentuan
            </Link>{" "}
            serta{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-semibold underline-offset-2 hover:underline transition-all"
            >
              Kebijakan Privasi
            </Link>{" "}
            SmartMasjid.
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="text-xs text-red-500 ml-7">{errors.agreeTerms}</p>
        )}

        {/* Informational notice */}
        <div className="ml-7 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Dengan mendaftarkan masjid, Anda menyatakan bahwa Anda adalah pengurus atau pihak yang
            memiliki wewenang untuk mengelola masjid yang didaftarkan.
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !form.agreeTerms}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm mt-1"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Membuat Akun...
          </>
        ) : (
          "Buat Akun"
        )}
      </button>

      {/* Login link */}
      <p className="text-center text-sm text-gray-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 overflow-hidden flex flex-col lg:flex-row">

          {/* ── Left panel ────────────────────────────────────────── */}
          <div className="lg:w-5/12 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Logo */}
              <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MosqueIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-bold text-xl">SmartMasjid</span>
              </Link>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug mb-3">
                Daftarkan Masjid Anda
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base leading-relaxed mb-8">
                Mulai digitalisasi pengelolaan masjid hanya dalam beberapa menit.
              </p>

              {/* Benefits */}
              <ul className="flex flex-col gap-3">
                {BENEFITS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-emerald-50 text-sm">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom tagline */}
            <p className="text-emerald-200/60 text-xs mt-8 hidden lg:block">
              © {new Date().getFullYear()} SmartMasjid · Gratis untuk masjid Indonesia
            </p>
          </div>

          {/* ── Right panel ───────────────────────────────────────── */}
          <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
            <div className="max-w-sm w-full mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">Buat Akun Baru</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Isi data berikut untuk mendaftar sebagai pengelola masjid.
                </p>
              </div>
              <RegisterForm />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
