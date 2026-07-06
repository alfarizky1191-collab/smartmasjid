/**
 * Beautiful empty states for SmartMasjid Mobile.
 * Used across Prayer, Info, Donation, and Profile pages.
 */

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  emoji,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-14 px-6 text-center"
      role="status"
      aria-label={title}
    >
      {/* Emoji with soft glow ring */}
      <div className="relative mb-5">
        <div
          className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shadow-inner"
          aria-hidden="true"
        >
          <span className="text-4xl select-none">{emoji}</span>
        </div>
        {/* Subtle ambient glow */}
        <div
          className="absolute inset-0 rounded-3xl bg-emerald-500/5 blur-xl -z-10"
          aria-hidden="true"
        />
      </div>

      <h3 className="text-white font-bold text-base mb-1.5">{title}</h3>

      {subtitle && (
        <p className="text-slate-500 text-sm leading-relaxed max-w-[220px]">
          {subtitle}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-sm px-5 py-2.5 rounded-2xl active:bg-emerald-500/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
