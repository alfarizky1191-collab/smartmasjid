import Link from "next/link";
import { Landmark } from "lucide-react";
import type { Mosque } from "./types";
import MosqueSearch from "./MosqueSearch";

export default function MosqueDirectory({ mosques }: { mosques: Mosque[] }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── Top nav ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <Landmark className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <span className="text-xl font-bold text-slate-900">SmartMasjid</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-emerald-600 transition-colors">Beranda</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">Direktori Masjid</span>
          </nav>

          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Landmark className="w-4 h-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Daftarkan Masjid</span>
            <span className="sm:hidden">Daftar</span>
          </Link>
        </div>
      </header>

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/30 text-white text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            {mosques.length} Masjid Terdaftar
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            Direktori Masjid
            <br />
            <span className="text-[#D4AF37]">SmartMasjid</span>
          </h1>
          <p className="text-emerald-100 text-base sm:text-lg max-w-xl mx-auto">
            Temukan masjid yang menggunakan SmartMasjid di seluruh Indonesia.
          </p>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <MosqueSearch mosques={mosques} />
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} SmartMasjid. Platform Masjid Digital Indonesia.</p>
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </footer>

    </div>
  );
}
