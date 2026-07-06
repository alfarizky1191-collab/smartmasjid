// Server Component — purely presentational prayer time grid.
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
  // Filter out Syuruq from the sholat grid (shown as badge only)
  const sholatGrid = prayers.filter((p) => p.name !== "Syuruq");

  return (
    <section className="mx-5" aria-label="Jadwal Sholat">
      {/* Prayer time grid */}
      <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Jadwal Sholat
            </span>
          </div>
          {syuruqTime && (
            <div className="flex items-center gap-1.5 bg-black/20 rounded-xl px-2.5 py-1">
              <Sunrise size={12} className="text-yellow-300" strokeWidth={2} aria-hidden="true" />
              <span className="text-yellow-300 text-[11px] font-semibold">
                Syuruq {syuruqTime}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 divide-x divide-y divide-slate-700/40" role="list">
          {sholatGrid.map((prayer) => (
            <div
              key={prayer.name}
              role="listitem"
              className={[
                "flex flex-col items-center justify-center py-4 px-2",
                prayer.isNext  ? "bg-emerald-500/10" : "",
                prayer.isDone  ? "opacity-40"        : "",
              ].join(" ")}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide mb-1 ${
                  prayer.isNext ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {prayer.name}
              </span>
              <time
                className={`text-base font-bold tabular-nums ${
                  prayer.isNext ? "text-emerald-300" : "text-white"
                }`}
                dateTime={prayer.time}
              >
                {prayer.time}
              </time>
              {prayer.isNext && (
                <span className="mt-1 text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
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
