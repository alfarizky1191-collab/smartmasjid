import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md text-center">
        <div className="text-6xl mb-4" aria-hidden="true">🕌</div>
        <h1 className="text-2xl font-bold text-slate-800">Masjid Tidak Ditemukan</h1>
        <p className="text-slate-500 mt-2">
          Masjid yang kamu cari tidak tersedia atau alamatnya salah.
        </p>
        <Link
          href="/masjid"
          className="inline-block mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
        >
          ← Kembali ke Direktori Masjid
        </Link>
      </div>
    </main>
  );
}
