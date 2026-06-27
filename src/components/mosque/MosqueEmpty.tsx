export default function MosqueEmpty() {
  return (
    <div className="rounded-3xl bg-white p-12 text-center shadow-md" role="status">
      <div className="text-6xl" aria-hidden="true">🕌</div>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">Belum ada masjid</h2>
      <p className="mt-2 text-slate-500">Belum ada masjid yang tersedia.</p>
    </div>
  );
}
