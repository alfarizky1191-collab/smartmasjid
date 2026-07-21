// Server Component — presentational header with Islamic luxury styling.
import Image from "next/image";

interface MobileHeaderProps {
  mosqueName?: string;
  logoUrl?: string;
  location?: string;
}

export default function MobileHeader({
  mosqueName = "SmartMasjid",
  logoUrl,
  location,
}: MobileHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 bg-gradient-to-r from-emerald-950/95 via-slate-950/95 to-emerald-950/95 backdrop-blur-xl border-b border-emerald-500/30 shadow-lg shadow-emerald-950/40"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between px-5 py-3.5">
        {/* Mosque branding */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`Logo ${mosqueName}`}
              width={44}
              height={44}
              className="rounded-2xl object-cover border-2 border-amber-400 bg-slate-900 shadow-md shrink-0"
              priority
              unoptimized={logoUrl.startsWith("http")}
            />
          ) : (
            <div
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-amber-600 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-md"
              aria-hidden="true"
            >
              <span className="text-amber-300 text-xl font-bold leading-none">🕌</span>
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-amber-300 truncate leading-tight tracking-wide">
              {mosqueName}
            </h1>
            {location && (
              <p className="text-xs font-semibold text-slate-300 truncate leading-tight mt-0.5 flex items-center gap-1">
                <span>📍</span>
                <span>{location}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Gold Accent Line */}
      <div className="h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" aria-hidden="true" />
    </header>
  );
}
