// Server Component — premium Islamic glassmorphism header.
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
      className="sticky top-0 z-40"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Glassmorphism background layer */}
      <div className="relative overflow-hidden">
        {/* Background blur layer */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(2,6,23,0.92) 0%, rgba(6,28,20,0.92) 50%, rgba(2,6,23,0.92) 100%)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
          aria-hidden="true"
        />

        {/* Ambient glow — decorative */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-16 opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, #10b981 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative flex items-center justify-between px-5 py-4 gap-3">
          {/* Islamic geometric ornament left */}
          <div className="absolute left-0 top-0 h-full w-12 opacity-10 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, #d4af37 0px, #d4af37 1px, transparent 1px, transparent 8px)`,
              }}
            />
          </div>

          {/* Mosque branding */}
          <div className="relative flex items-center gap-4 flex-1 min-w-0">
            {/* Logo with gold ring */}
            <div className="relative shrink-0">
              <div
                className="absolute -inset-0.5 rounded-2xl opacity-60"
                style={{
                  background: "linear-gradient(135deg, #d4af37, #10b981, #d4af37)",
                }}
                aria-hidden="true"
              />
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`Logo ${mosqueName}`}
                  width={52}
                  height={52}
                  className="relative rounded-2xl object-cover bg-slate-900"
                  priority
                  unoptimized={logoUrl.startsWith("http")}
                />
              ) : (
                <div
                  className="relative w-13 h-13 rounded-2xl flex items-center justify-center"
                  style={{
                    width: 52,
                    height: 52,
                    background: "linear-gradient(135deg, #064e3b, #065f46)",
                  }}
                  aria-hidden="true"
                >
                  <span className="text-2xl">🕌</span>
                </div>
              )}
            </div>

            {/* Name & location */}
            <div className="min-w-0 flex-1">
              <h1
                className="text-lg font-black truncate leading-tight tracking-wide"
                style={{
                  background: "linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {mosqueName}
              </h1>
              {location && (
                <p className="text-sm font-medium text-emerald-300/80 truncate leading-tight mt-0.5 flex items-center gap-1.5">
                  <span className="text-base leading-none" aria-hidden="true">📍</span>
                  <span>{location}</span>
                </p>
              )}
            </div>
          </div>

          {/* SmartMasjid badge right */}
          <div
            className="relative shrink-0 px-3 py-1.5 rounded-full border"
            style={{
              background: "rgba(16,185,129,0.1)",
              borderColor: "rgba(16,185,129,0.25)",
            }}
          >
            <span className="text-xs font-bold text-emerald-400 tracking-wide">Smart</span>
          </div>

          {/* Islamic geometric ornament right */}
          <div className="absolute right-0 top-0 h-full w-12 opacity-10 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(-45deg, #d4af37 0px, #d4af37 1px, transparent 1px, transparent 8px)`,
              }}
            />
          </div>
        </div>

        {/* Gold accent line */}
        <div
          className="h-px"
          style={{
            background: "linear-gradient(90deg, transparent 0%, #d4af37 30%, #10b981 50%, #d4af37 70%, transparent 100%)",
            opacity: 0.5,
          }}
          aria-hidden="true"
        />
      </div>
    </header>
  );
}
