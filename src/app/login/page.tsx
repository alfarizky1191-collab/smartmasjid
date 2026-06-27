"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { logAuditAction } from "@/lib/audit";
import { isKnownRole, defaultRoute } from "@/lib/rbac";
import { Eye, EyeOff, LogIn, Loader, Shield, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("smartmasjid_saved_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Validate email format
  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // Handle validation
  const validate = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      // Show success state
      setSuccess(true);

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("smartmasjid_saved_email", email);
      } else {
        localStorage.removeItem("smartmasjid_saved_email");
      }

      // Log audit action
      await logAuditAction({ action: "Login", module: "Auth" });

      // Get user role and redirect appropriately
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const userRole = profileData?.role;
      const redirectPath = isKnownRole(userRole) ? defaultRoute(userRole) : "/dashboard";

      // Redirect after a brief delay to show success state
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login");
      setLoading(false);
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-amber-100/30 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Back to home link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hover:bg-white"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Logo and branding */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
            <Shield className="w-7 h-7 text-white font-bold" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">SmartMasjid</h1>
        </div>
        <p className="text-base text-slate-600">Admin Dashboard</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-md">
        {/* Error alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{error}</p>
              <p className="text-sm text-red-700 mt-1">
                Please check your email and password and try again.
              </p>
            </div>
          </div>
        )}

        {/* Success alert */}
        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3 animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-emerald-900">Login successful! Redirecting...</p>
          </div>
        )}

        {/* Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-2 text-slate-900">Welcome Back</h2>
          <p className="text-slate-600 mb-8">Sign in to your admin account</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-3">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors({ ...validationErrors, email: "" });
                  }
                }}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-2xl border-2 transition-all text-slate-900 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                  validationErrors.email
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : "border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white"
                } focus:outline-none`}
              />
              {validationErrors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                  Password
                </label>
                <Link
                  href="/login"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: "" });
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-2xl border-2 transition-all text-slate-900 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                    validationErrors.password
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white"
                  } focus:outline-none pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-5 h-5 rounded-lg border-2 border-slate-300 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-700 cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-8 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Redirecting...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500 font-medium">Or continue as</span>
            </div>
          </div>

          {/* Footer links */}
          <p className="text-center text-sm text-slate-600">
            Need help?{" "}
            <Link href="/" className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Contact support
            </Link>
          </p>
        </div>

        {/* Info box */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-600 text-center leading-relaxed">
            This is a secure admin login. Your credentials are encrypted and protected by Supabase authentication.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-xs text-slate-500">
        © 2024 SmartMasjid. Made for mosques, by muslims.
      </div>
    </div>
  );
}
