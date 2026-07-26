import { Clock, Sunrise } from "lucide-react";

export interface PrayerTime {
  name: string;
  time: string;
  isNext?: boolean;
  isDone?: boolean;
}

interface PrayerCardProps {
  prayers: PrayerTime[];
  nextPrayer?: string;
  syuruqTime?: string;
}

export default function PrayerCard({ prayers, syuruqTime }: PrayerCardProps) {
  // Filter out Syuruq from the sholat grid
  const sholatGrid = prayers.filter((p) => p.name !== "Syuruq");

  return (
    <section className="mx-5" aria-label="Jadwal Sholat">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <Clock size={18} className="text-amber-400" strokeWidth={2.5} aria-hidden="true" />
        <h2 className="text-lg font-bold tracking-wide" style={{ color: "var(--pwa-text-primary)" }}>
          Jadwal Sholat Hari Ini
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "linear-gradient(to right, rgba(251,191,36,0.35), transparent)" }}
          aria-hidden="true"
        />
        {/* Syuruq pill */}
        {syuruqTime && (
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 shrink-0"
            style={{
              background: "rgba(251,191,36,0.10)",
              border: "1px solid rgba(251,191,36,0.30)",
            }}
          >
            <Sunrise size={14} className="text-amber-300" strokeWidth={2.5} aria-hidden="true" />
            <span className="text-amber-300 text-xs font-bold">Syuruq {syuruqTime}</span>
          </div>
        )}
      </div>

      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(16,185,129,0.3)",
          boxShadow: "0 4px 24px 0 var(--glass-shadow), inset 0 1px 0 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Prayer grid */}
        <div className="grid grid-cols-3 gap-3 p-4" role="list">
          {sholatGrid.map((prayer) => (
            <div
              key={prayer.name}
              role="listitem"
              className={[
                "flex flex-col items-center justify-center py-6 px-3 rounded-2xl border transition-all duration-300",
                prayer.isNext ? "scale-[1.04] shadow-lg" : "",
                prayer.isDone ? "opacity-40" : "",
              ].join(" ")}
              style={
                prayer.isNext
                  ? {
                      background: "linear-gradient(160deg, rgba(245,158,11,0.22), rgba(15,23,42,0.85), rgba(120,53,15,0.3))",
                      borderColor: "rgba(245,158,11,0.8)",
                      boxShadow: "0 4px 24px rgba(245,158,11,0.22)",
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(16,185,129,0.12)",
                    }
              }
            >
              <span
                className={`text-sm font-extrabold uppercase tracking-wide mb-2 ${
                  prayer.isNext ? "text-amber-300" : "text-emerald-400"
                }`}
              >
                {prayer.name}
              </span>
              <time
                className={`text-3xl font-black font-mono tracking-tight tabular-nums ${
                  prayer.isNext ? "text-white drop-shadow-sm" : ""
                }`}
                style={!prayer.isNext ? { color: "var(--pwa-text-primary)" } : undefined}
                dateTime={prayer.time}
              >
                {prayer.time}
              </time>
              {prayer.isNext && (
                <span className="mt-2 text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Berikutnya
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
