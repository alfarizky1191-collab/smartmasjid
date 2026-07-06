// Server Component — no interactivity needed, purely presentational header.
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
      className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between px-5 py-3">
        {/* Mosque branding */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`Logo ${mosqueName}`}
              width={36}
              height={36}
              className="rounded-full object-cover border-2 border-emerald-400 bg-slate-800 shrink-0"
              priority
              unoptimized={logoUrl.startsWith("http")}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 border-2 border-emerald-400 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="text-white text-base font-bold leading-none">☽</span>
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate leading-tight">
              {mosqueName}
            </h1>
            {location && (
              <p className="text-[11px] text-slate-400 truncate leading-tight">
                {location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" aria-hidden="true" />
    </header>
  );
}
