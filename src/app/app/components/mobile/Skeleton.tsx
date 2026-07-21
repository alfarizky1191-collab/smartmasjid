/**
 * Reusable skeleton shimmer primitives for SmartMasjid Mobile.
 * All skeleton blocks use a CSS shimmer animation via Tailwind animate-pulse.
 */

/** Single shimmer block */
export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl animate-pulse ${className}`}
      style={{ background: "var(--pwa-skeleton)" }}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a Prayer page */
export function SkeletonPrayer() {
  return (
    <div
      className="min-h-screen animate-pulse px-5 pt-5 space-y-5"
      style={{ background: "var(--pwa-bg)" }}
    >
      {/* Header */}
      <div className="h-10 rounded-2xl w-40" style={{ background: "var(--pwa-skeleton)" }} />
      {/* Countdown card */}
      <div className="h-32 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
      {/* Prayer grid */}
      <div className="h-48 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
      {/* Tomorrow label */}
      <div className="h-5 rounded-full w-24" style={{ background: "var(--pwa-skeleton)" }} />
      {/* Tomorrow grid */}
      <div className="h-48 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
      {/* 30-day label */}
      <div className="h-5 rounded-full w-36" style={{ background: "var(--pwa-skeleton)" }} />
      {/* 30-day list */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
      ))}
    </div>
  );
}

/** Skeleton for Info page */
export function SkeletonInfo() {
  return (
    <div
      className="min-h-screen animate-pulse px-5 pt-5 space-y-4"
      style={{ background: "var(--pwa-bg)" }}
    >
      {/* Tab bar */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 rounded-full flex-1" style={{ background: "var(--pwa-skeleton)" }} />
        ))}
      </div>
      {/* Content list */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
      ))}
    </div>
  );
}

/** Skeleton for Donation page */
export function SkeletonDonation() {
  return (
    <div
      className="min-h-screen animate-pulse px-5 pt-5 space-y-5"
      style={{ background: "var(--pwa-bg)" }}
    >
      {/* QRIS card */}
      <div className="h-72 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
      {/* Bank section */}
      <div className="h-5 rounded-full w-28" style={{ background: "var(--pwa-skeleton)" }} />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
      ))}
      {/* Programs */}
      <div className="h-5 rounded-full w-32" style={{ background: "var(--pwa-skeleton)" }} />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-14 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
      ))}
    </div>
  );
}

/** Skeleton for Profile page */
export function SkeletonProfile() {
  return (
    <div
      className="min-h-screen animate-pulse px-5 pt-5 space-y-5"
      style={{ background: "var(--pwa-bg)" }}
    >
      {/* Mosque card */}
      <div className="h-36 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
      {/* Details */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 rounded-2xl" style={{ background: "var(--pwa-skeleton)" }} />
      ))}
      {/* App info */}
      <div className="h-20 rounded-3xl" style={{ background: "var(--pwa-skeleton)" }} />
    </div>
  );
}
