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
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-emerald-500/30 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-emerald-500/20 flex items-center justify-between bg-emerald-950/40">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-400" strokeWidth={2.5} aria-hidden="true" />
            <span className="text-sm font-extrabold text-amber-300 uppercase tracking-wider">
              Jadwal Sholat Hari Ini
            </span>
          </div>
          {syuruqTime && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-1">
              <Sunrise size={14} className="text-amber-300" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-amber-300 text-xs font-bold">
                Syuruq {syuruqTime}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5 p-3" role="list">
          {sholatGrid.map((prayer) => (
            <div
              key={prayer.name}
              role="listitem"
              className={[
                "flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border transition-all duration-300",
                prayer.isNext
                  ? "bg-gradient-to-b from-amber-500/20 via-slate-900 to-amber-950/40 border-amber-400 shadow-md shadow-amber-500/20 scale-[1.02]"
                  : "bg-slate-950/70 border-emerald-500/10 hover:border-emerald-500/30",
                prayer.isDone ? "opacity-50" : "",
              ].join(" ")}
            >
              <span
                className={`text-xs sm:text-sm font-extrabold uppercase tracking-wide mb-1 ${
                  prayer.isNext ? "text-amber-300" : "text-emerald-400"
                }`}
              >
                {prayer.name}
              </span>
              <time
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight tabular-nums ${
                  prayer.isNext ? "text-white drop-shadow-sm" : "text-slate-100"
                }`}
                dateTime={prayer.time}
              >
                {prayer.time}
              </time>
              {prayer.isNext && (
                <span className="mt-1 text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
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
