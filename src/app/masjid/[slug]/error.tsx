"use client";

export default function Error({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md text-center">
        <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-800">Terjadi Kesalahan</h1>
        <p className="text-slate-500 mt-2">Gagal memuat halaman portal masjid.</p>
        <button
          onClick={reset}
          className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
