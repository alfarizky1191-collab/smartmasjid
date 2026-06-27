import Link from "next/link";
import type { Mosque } from "./types";
import MosqueSearch from "./MosqueSearch";

export default function MosqueDirectory({ mosques }: { mosques: Mosque[] }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Cari Masjid</h1>
            <p className="text-slate-500">Temukan masjid yang terdaftar di SmartMasjid</p>
          </div>
          <Link href="/" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
            Beranda
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-5 py-8">
        <MosqueSearch mosques={mosques} />
      </section>
    </main>
  );
}
