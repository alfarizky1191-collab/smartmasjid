import Image from "next/image";
import { MapPin, ChevronRight } from "lucide-react";
import type { MosqueRow, FavoriteMosque } from "@/lib/mobile/types";

// Accepts either a full MosqueRow or a FavoriteMosque — both have the fields we need
export type MosqueCardData = MosqueRow | FavoriteMosque;

interface MosqueCardProps {
  mosque: MosqueCardData;
  onSelect: (mosque: MosqueCardData) => void;
  isSelected?: boolean;
  badge?: string;
}

export default function MosqueCard({
  mosque,
  onSelect,
  isSelected = false,
  badge,
}: MosqueCardProps) {
  const location = [mosque.city, mosque.province].filter(Boolean).join(", ");

  return (
    <button
      type="button"
      onClick={() => onSelect(mosque)}
      className={[
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border",
        "transition-all duration-150 active:scale-[0.98] text-left",
        isSelected
          ? "bg-emerald-500/10 border-emerald-500/40"
          : "",
      ].join(" ")}
      style={!isSelected ? {
        background: "var(--pwa-bg-card)",
        borderColor: "var(--pwa-border-subtle)",
      } : undefined}
      aria-pressed={isSelected}
      aria-label={`Pilih ${mosque.name}${location ? ", " + location : ""}`}
    >
      {/* Logo */}
      {mosque.logo_url ? (
        <Image
          src={mosque.logo_url}
          alt={`Logo ${mosque.name}`}
          width={44}
          height={44}
          className="w-11 h-11 rounded-xl object-cover border border-emerald-400/30 shrink-0"
          unoptimized={mosque.logo_url.startsWith("http")}
        />
      ) : (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/30 flex items-center justify-center shrink-0">
          <span className="text-lg" aria-hidden="true">🕌</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-sm font-bold truncate ${isSelected ? "text-emerald-300" : ""}`}
            style={!isSelected ? { color: "var(--pwa-text-primary)" } : undefined}
          >
            {mosque.name}
          </p>
          {badge && (
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
              {badge}
            </span>
          )}
        </div>
        {location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} strokeWidth={2} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
            <span className="text-[11px] truncate" style={{ color: "var(--pwa-text-muted)" }}>{location}</span>
          </div>
        )}
      </div>

      {/* Arrow or check */}
      {isSelected ? (
        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <span className="text-black text-[10px] font-bold">✓</span>
        </div>
      ) : (
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
      )}
    </button>
  );
}
