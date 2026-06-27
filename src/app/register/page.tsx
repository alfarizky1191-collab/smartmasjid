"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Shield, Eye, EyeOff, Loader, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return;
    if (password.length < 6) { setError("Password minimal 6 karakter."); return; }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);

    if (signUpError) { setError(signUpError.message); return; }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          ← Kembali
        </Link>
      </div>

      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">SmartMasjid</h1>
        </div>
        <p className="text-slate-600">Daftar akun super admin</p>
      </div>

      <div className="w-full max-w-md">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {success ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-lg">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-emerald-900 mb-2">Akun Berhasil Dibuat!</h2>
            <p className="text-slate-600 text-sm">
              Cek email Anda untuk konfirmasi, lalu login untuk melanjutkan setup masjid.
            </p>
            <p className="text-xs text-slate-400 mt-3">Mengarahkan ke halaman login...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-1 text-slate-900">Buat Akun</h2>
            <p className="text-slate-500 text-sm mb-7">Jadilah super admin pertama SmartMasjid Anda</p>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@masjid.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 placeholder-slate-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all text-slate-900 placeholder-slate-400 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader className="w-5 h-5 animate-spin" /> Mendaftar...</> : "Daftar Sekarang"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">Login</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
