"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader, Shield } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setError("This password reset link is invalid or has expired. Please request a new one.");
      } else {
        setReady(true);
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "Unable to update your password. Please request a new reset link.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login"), 1500);
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
          <p className="text-slate-600">Set a new admin password</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          {checkingSession ? (
            <div className="py-8 text-center text-slate-600"><Loader className="w-6 h-6 animate-spin mx-auto mb-3" />Checking reset link...</div>
          ) : success ? (
            <div className="py-4 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Password updated</h2>
              <p className="text-slate-600">Your password has been changed. Redirecting to login...</p>
            </div>
          ) : !ready ? (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Reset link unavailable</h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Link href="/forgot-password" className="inline-flex w-full justify-center px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">Request a new link</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Create new password</h2>
              <p className="text-slate-600 mb-7">Use a password with at least 6 characters.</p>
              {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3"><AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" /><p className="text-sm font-medium text-red-800">{error}</p></div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold mb-3">New Password</label>
                  <div className="relative"><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" className="w-full px-4 pr-12 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none" /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}</button></div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold mb-3">Confirm Password</label>
                  <div className="relative"><input id="confirm-password" type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} autoComplete="new-password" className="w-full px-4 pr-12 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none" /><button type="button" onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showConfirm?"Hide password":"Show password"}>{showConfirm?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}</button></div>
                </div>
                <button type="submit" disabled={loading} className="w-full px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold flex items-center justify-center gap-2">{loading?<><Loader className="w-5 h-5 animate-spin"/>Updating...</>:"Update Password"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
