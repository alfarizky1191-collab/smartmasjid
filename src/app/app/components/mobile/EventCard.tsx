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
        <h2 className="text-sm font-bold" style={{ color: "var(--pwa-text-primary)" }}>Jadwal Kegiatan</h2>
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-3xl border p-5 flex flex-col items-center justify-center gap-2 py-8"
          style={{
            background: "var(--pwa-bg-card)",
            borderColor: "var(--pwa-border-subtle)",
          }}
        >
          <CalendarDays size={28} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>Belum ada kegiatan</p>
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
                    : "",
                ].join(" ")}
                style={!event.isToday ? {
                  background: "var(--pwa-bg-card)",
                  borderColor: "var(--pwa-border-subtle)",
                } : undefined}
              >
                {/* Date badge */}
                <div
                  className={[
                    "shrink-0 flex flex-col items-center justify-center w-10 h-12 rounded-xl",
                    event.isToday ? "bg-emerald-500" : "",
                  ].join(" ")}
                  style={!event.isToday ? { background: "var(--pwa-bg-card-hover)" } : undefined}
                  aria-hidden="true"
                >
                  <span
                    className={`text-[18px] font-extrabold leading-none ${event.isToday ? "text-black" : ""}`}
                    style={!event.isToday ? { color: "var(--pwa-text-primary)" } : undefined}
                  >
                    {day}
                  </span>
                  <span
                    className={`text-[9px] font-semibold uppercase tracking-wide ${event.isToday ? "text-black/70" : ""}`}
                    style={!event.isToday ? { color: "var(--pwa-text-muted)" } : undefined}
                  >
                    {monthStr}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-bold leading-snug line-clamp-2 flex-1 ${event.isToday ? "text-emerald-300" : ""}`}
                      style={!event.isToday ? { color: "var(--pwa-text-primary)" } : undefined}
                    >
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
                        <User size={11} strokeWidth={2} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
                        <span
                          className="text-[11px] truncate max-w-[140px]"
                          style={{ color: "var(--pwa-text-muted)" }}
                        >
                          {event.speaker}
                        </span>
                      </div>
                    )}
                    {event.eventTime && (
                      <div className="flex items-center gap-1">
                        <Clock size={11} strokeWidth={2} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
                        <time
                          className="text-[11px]"
                          style={{ color: "var(--pwa-text-muted)" }}
                        >
                          {event.eventTime}
                        </time>
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
