/**
 * Skeleton loading UI for the mobile home screen.
 * Matches the layout of the real home so there's no layout shift on load.
 */
export default function SkeletonHome() {
  return (
    <div
      className="min-h-screen animate-pulse"
      style={{ background: "var(--pwa-bg)" }}
    >
      {/* Header skeleton */}
      <div
        className="px-5 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "var(--pwa-border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
          <div className="space-y-1.5">
            <div className="w-32 h-3 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
            <div className="w-20 h-2.5 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 rounded-xl" style={{ background: "var(--pwa-skeleton)" }} />
          <div className="w-9 h-9 rounded-xl" style={{ background: "var(--pwa-skeleton)" }} />
        </div>
      </div>

      {/* Hero / clock skeleton */}
      <div className="px-5 pt-6 pb-7 space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
          <div className="space-y-2">
            <div className="w-44 h-4 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
            <div className="w-28 h-3 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="w-48 h-14 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
          <div className="w-56 h-3.5 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
          <div className="w-36 h-6 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="mx-5">
        <div className="w-24 h-4 rounded-full mb-3" style={{ background: "var(--pwa-skeleton)" }} />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
          ))}
        </div>
      </div>

      {/* Prayer card skeleton */}
      <div className="mx-5 mt-5 space-y-3">
        <div className="h-32 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
        <div className="h-36 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
      </div>

      {/* Slide skeleton */}
      <div className="mx-5 mt-5">
        <div className="h-48 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
      </div>

      {/* Officers skeleton */}
      <div className="mx-5 mt-5 space-y-2">
        <div className="w-32 h-4 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
        <div className="h-28 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
      </div>

      {/* Announcements skeleton */}
      <div className="mx-5 mt-5 space-y-2">
        <div className="w-32 h-4 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
        ))}
      </div>

      {/* Events skeleton */}
      <div className="mx-5 mt-5 space-y-2">
        <div className="w-36 h-4 rounded-full" style={{ background: "var(--pwa-skeleton)" }} />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
        ))}
      </div>
    </div>
  );
}
