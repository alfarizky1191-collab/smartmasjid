"use client";

import { useEffect, useState } from "react";

export default function ResetPage() {
  const [status, setStatus] = useState("Menghapus Service Worker lama...");

  useEffect(() => {
    const reset = async () => {
      try {
        // Unregister all SW
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }

        // Clear all caches
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }

        // Clear push localStorage
        localStorage.removeItem("push_subscribed_mosque");

        setStatus("✅ Berhasil! Mengalihkan ke halaman utama...");
        setTimeout(() => {
          window.location.replace("/app");
        }, 1500);
      } catch (err) {
        setStatus("❌ Gagal: " + String(err));
      }
    };

    reset();
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-8 text-center"
      style={{ background: "#0f172a" }}
    >
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white font-semibold text-lg">{status}</p>
      <p className="text-slate-400 text-sm">Jangan tutup halaman ini</p>
    </main>
  );
}
