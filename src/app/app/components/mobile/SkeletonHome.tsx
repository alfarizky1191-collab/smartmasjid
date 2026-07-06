/**
 * Skeleton loading UI for the mobile home screen.
 * Matches the layout of the real home so there's no layout shift on load.
 */
export default function SkeletonHome() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse">
      {/* Header skeleton */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800" />
          <div className="space-y-1.5">
            <div className="w-32 h-3 bg-slate-800 rounded-full" />
            <div className="w-20 h-2.5 bg-slate-800 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 rounded-xl bg-slate-800" />
          <div className="w-9 h-9 rounded-xl bg-slate-800" />
        </div>
      </div>

      {/* Hero / clock skeleton */}
      <div className="px-5 pt-6 pb-7 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800" />
          <div className="space-y-2">
            <div className="w-44 h-4 bg-slate-800 rounded-full" />
            <div className="w-28 h-3 bg-slate-800 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="w-48 h-14 bg-slate-800 rounded-2xl" />
          <div className="w-56 h-3.5 bg-slate-800 rounded-full" />
          <div className="w-36 h-6 bg-slate-800 rounded-full" />
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="mx-5">
        <div className="w-24 h-4 bg-slate-800 rounded-full mb-3" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Prayer card skeleton */}
      <div className="mx-5 mt-5 space-y-3">
        <div className="h-32 bg-slate-800 rounded-3xl" />
        <div className="h-36 bg-slate-800 rounded-3xl" />
      </div>

      {/* Slide skeleton */}
      <div className="mx-5 mt-5">
        <div className="h-48 bg-slate-800 rounded-3xl" />
      </div>

      {/* Officers skeleton */}
      <div className="mx-5 mt-5 space-y-2">
        <div className="w-32 h-4 bg-slate-800 rounded-full" />
        <div className="h-28 bg-slate-800 rounded-3xl" />
      </div>

      {/* Announcements skeleton */}
      <div className="mx-5 mt-5 space-y-2">
        <div className="w-32 h-4 bg-slate-800 rounded-full" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-800 rounded-2xl" />
        ))}
      </div>

      {/* Events skeleton */}
      <div className="mx-5 mt-5 space-y-2">
        <div className="w-36 h-4 bg-slate-800 rounded-full" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-800 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
