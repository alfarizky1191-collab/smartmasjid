// Server Component — purely presentational.
import { CalendarDays, Clock, User } from "lucide-react";

export interface MosqueEvent {
  id: string | number;
  title: string;
  speaker?: string;
  eventDate: string;
  eventTime?: string;
  isToday?: boolean;
}

interface EventCardProps {
  events: MosqueEvent[];
}

export default function EventCard({ events }: EventCardProps) {
  return (
    <section className="mx-5" aria-label="Jadwal Kegiatan">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={15} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
        <h2 className="text-sm font-bold text-white">Jadwal Kegiatan</h2>
      </div>

      {events.length === 0 ? (
        <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 p-5 flex flex-col items-center justify-center gap-2 py-8">
          <CalendarDays size={28} className="text-slate-600" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-slate-500 text-sm">Belum ada kegiatan</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {events.slice(0, 5).map((event) => {
            // Parse date safely server-side
            const dateParts = event.eventDate.split("-").map(Number);
            const day = dateParts[2] ?? 1;
            const monthStr = new Date(
              dateParts[0], (dateParts[1] ?? 1) - 1, day
            ).toLocaleString("id-ID", { month: "short" });

            return (
              <li
                key={event.id}
                className={[
                  "relative overflow-hidden rounded-2xl border px-4 py-3.5 flex items-start gap-3",
                  event.isToday
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-slate-900/70 border-slate-700/40",
                ].join(" ")}
              >
                {/* Date badge */}
                <div
                  className={[
                    "shrink-0 flex flex-col items-center justify-center w-10 h-12 rounded-xl",
                    event.isToday ? "bg-emerald-500" : "bg-slate-800",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <span className={`text-[18px] font-extrabold leading-none ${event.isToday ? "text-black" : "text-white"}`}>
                    {day}
                  </span>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide ${event.isToday ? "text-black/70" : "text-slate-400"}`}>
                    {monthStr}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold leading-snug line-clamp-2 flex-1 ${event.isToday ? "text-emerald-300" : "text-white"}`}>
                      {event.title}
                    </p>
                    {event.isToday && (
                      <span className="shrink-0 text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        Hari ini
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {event.speaker && (
                      <div className="flex items-center gap-1">
                        <User size={11} className="text-slate-500" strokeWidth={2} aria-hidden="true" />
                        <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {event.speaker}
                        </span>
                      </div>
                    )}
                    {event.eventTime && (
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-500" strokeWidth={2} aria-hidden="true" />
                        <time className="text-[11px] text-slate-400">{event.eventTime}</time>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
