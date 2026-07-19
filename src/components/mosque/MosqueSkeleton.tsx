function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-md animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
      </div>
      <div className="mt-6 h-10 w-32 rounded-xl bg-slate-200" />
    </div>
  );
}

export default function MosqueSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Memuat daftar masjid...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
