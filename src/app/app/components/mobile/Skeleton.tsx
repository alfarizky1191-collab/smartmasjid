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
      className={`bg-slate-800 rounded-2xl animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a Prayer page */
export function SkeletonPrayer() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse px-5 pt-5 space-y-5">
      {/* Header */}
      <div className="h-10 bg-slate-800 rounded-2xl w-40" />
      {/* Countdown card */}
      <div className="h-32 bg-slate-800 rounded-3xl" />
      {/* Prayer grid */}
      <div className="h-48 bg-slate-800 rounded-3xl" />
      {/* Tomorrow label */}
      <div className="h-5 bg-slate-800 rounded-full w-24" />
      {/* Tomorrow grid */}
      <div className="h-48 bg-slate-800 rounded-3xl" />
      {/* 30-day label */}
      <div className="h-5 bg-slate-800 rounded-full w-36" />
      {/* 30-day list */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-slate-800 rounded-2xl" />
      ))}
    </div>
  );
}

/** Skeleton for Info page */
export function SkeletonInfo() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse px-5 pt-5 space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 bg-slate-800 rounded-full flex-1" />
        ))}
      </div>
      {/* Content list */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-800 rounded-2xl" />
      ))}
    </div>
  );
}

/** Skeleton for Donation page */
export function SkeletonDonation() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse px-5 pt-5 space-y-5">
      {/* QRIS card */}
      <div className="h-72 bg-slate-800 rounded-3xl" />
      {/* Bank section */}
      <div className="h-5 bg-slate-800 rounded-full w-28" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-800 rounded-2xl" />
      ))}
      {/* Programs */}
      <div className="h-5 bg-slate-800 rounded-full w-32" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-14 bg-slate-800 rounded-2xl" />
      ))}
    </div>
  );
}

/** Skeleton for Profile page */
export function SkeletonProfile() {
  return (
    <div className="min-h-screen bg-slate-950 animate-pulse px-5 pt-5 space-y-5">
      {/* Mosque card */}
      <div className="h-36 bg-slate-800 rounded-3xl" />
      {/* Details */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-12 bg-slate-800 rounded-2xl" />
      ))}
      {/* App info */}
      <div className="h-20 bg-slate-800 rounded-3xl" />
    </div>
  );
}
