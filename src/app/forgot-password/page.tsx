"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { AlertCircle, ArrowLeft, CheckCircle, Loader, Mail, Shield } from "lucide-react";

const SITE_URL = "https://smartmasjid.biz.id";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${SITE_URL}/reset-password`,
      });

      if (resetError) {
        console.error("Supabase password reset error:", resetError);
        setError(resetError.message || "Unable to send the reset email. Please try again.");
        return;
      }

      setSent(true);
    } catch (err) {
      console.error("Password reset request error:", err);
      setError(err instanceof Error ? err.message : "Unable to send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold">SmartMasjid</h1>
          </div>
          <p className="text-slate-600">Reset your admin password</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Check your email</h2>
              <p className="text-slate-600 leading-relaxed">
                If an account uses that email address, we sent instructions to reset the password.
              </p>
              <Link href="/login" className="mt-6 inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Forgot password?</h2>
              <p className="text-slate-600 mb-7">Enter your admin email and we&apos;ll send you a secure password reset link.</p>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-3">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" disabled={loading} className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all disabled:opacity-50" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold transition-colors flex items-center justify-center gap-2">
                  {loading ? <><Loader className="w-5 h-5 animate-spin" />Sending...</> : <><Mail className="w-5 h-5" />Send Reset Link</>}
                </button>
              </form>

              <Link href="/login" className="mt-6 inline-flex items-center justify-center gap-2 w-full text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
