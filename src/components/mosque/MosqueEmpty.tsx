export default function MosqueEmpty() {
  return (
    <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-slate-100" role="status">
      <div className="text-6xl" aria-hidden="true">🕌</div>
      <h2 className="mt-4 text-xl font-bold text-slate-800">Belum ada masjid yang terdaftar.</h2>
      <p className="mt-2 text-slate-500 text-sm">
        Jadilah yang pertama mendaftarkan masjid Anda di SmartMasjid.
      </p>
    </div>
  );
}
