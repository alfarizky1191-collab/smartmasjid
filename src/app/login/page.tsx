"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { logAuditAction } from "@/lib/audit";
export default function LoginPage() {


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await logAuditAction({ action: "Login", module: "Auth" });
    window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-emerald-400">
          Login Smart Masjid
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="p-3 rounded-lg bg-slate-800 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="p-3 rounded-lg bg-slate-800 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="bg-emerald-500 hover:bg-emerald-600 p-3 rounded-lg text-white font-semibold"
        >
          Login
        </button>
      </div>
    </main>
  );
}
