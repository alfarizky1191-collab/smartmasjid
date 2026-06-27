export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-emerald-700 px-4 py-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-emerald-600" />
          <div className="h-8 w-64 rounded-xl bg-emerald-600" />
          <div className="h-4 w-40 rounded-xl bg-emerald-600" />
          <div className="h-16 w-72 rounded-3xl bg-emerald-600" />
          <div className="h-12 w-40 rounded-2xl bg-emerald-600" />
        </div>
      </div>

      {/* Menu skeleton */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-16 h-14 rounded-2xl bg-slate-200 shrink-0" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Prayer times */}
        <div className="h-6 w-32 rounded bg-slate-200 mb-4" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200" />
          ))}
        </div>

        {/* Cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-40 rounded bg-slate-200" />
            <div className="h-28 rounded-2xl bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
