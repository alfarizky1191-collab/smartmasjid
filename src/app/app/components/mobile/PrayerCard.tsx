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

export default function PrayerCard({
  prayers,
  syuruqTime,
}: PrayerCardProps) {
  // Filter out Syuruq from the sholat grid
  const sholatGrid = prayers.filter((p) => p.name !== "Syuruq");

  return (
    <section className="mx-4 sm:mx-5" aria-label="Jadwal Sholat">
      <div
        className="glass-card backdrop-blur-xl rounded-3xl border overflow-hidden shadow-premium"
        style={{
          background: "var(--pwa-bg-card)",
          borderColor: "rgba(16,185,129,0.3)",
        }}
      >
        {/* Header with gold bottom divider */}
        <div
          className="py-4 px-5 flex items-center justify-between"
          style={{
            background: "rgba(6,78,59,0.15)",
            borderBottom: "1px solid rgba(212,175,55,0.35)",
          }}
        >
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-400" strokeWidth={2.5} aria-hidden="true" />
            <span className="text-base font-extrabold text-amber-300 uppercase tracking-wider">
              Jadwal Sholat Hari Ini
            </span>
          </div>

          {/* Syuruq: glass pill badge */}
          {syuruqTime && (
            <div
              className="flex items-center gap-1.5 rounded-xl px-3 py-1 backdrop-blur-sm border"
              style={{
                background: "rgba(251,191,36,0.10)",
                borderColor: "rgba(251,191,36,0.30)",
              }}
            >
              <Sunrise size={14} className="text-amber-300" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-amber-300 text-sm font-bold">
                Syuruq {syuruqTime}
              </span>
            </div>
          )}
        </div>

        {/* Prayer grid: 3 cols, gap-3, p-4 */}
        <div className="grid grid-cols-3 gap-3 p-4" role="list">
          {sholatGrid.map((prayer) => (
            <div
              key={prayer.name}
              role="listitem"
              className={[
                "flex flex-col items-center justify-center py-5 px-3 rounded-2xl border transition-all duration-300 min-h-24",
                prayer.isNext
                  ? "scale-[1.03] shadow-md"
                  : "",
                prayer.isDone ? "opacity-40" : "",
              ].join(" ")}
              style={
                prayer.isNext
                  ? {
                      background:
                        "linear-gradient(to bottom, rgba(245,158,11,0.25), rgba(15,23,42,0.9), rgba(120,53,15,0.35))",
                      borderColor: "rgba(245,158,11,0.85)",
                      boxShadow: "0 4px 20px rgba(245,158,11,0.20)",
                    }
                  : {
                      background: "var(--pwa-bg)",
                      borderColor: "rgba(16,185,129,0.1)",
                    }
              }
            >
              <span
                className={`text-sm font-extrabold uppercase tracking-wide mb-1 ${
                  prayer.isNext ? "text-amber-300" : "text-emerald-400"
                }`}
              >
                {prayer.name}
              </span>
              <time
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums ${
                  prayer.isNext ? "text-white drop-shadow-sm" : ""
                }`}
                style={!prayer.isNext ? { color: "var(--pwa-text-primary)" } : undefined}
                dateTime={prayer.time}
              >
                {prayer.time}
              </time>
              {prayer.isNext && (
                <span className="mt-1.5 text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
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
