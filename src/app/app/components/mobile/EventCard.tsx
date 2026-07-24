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
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={16} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
        <h2 className="text-base font-bold" style={{ color: "var(--pwa-text-primary)" }}>Jadwal Kegiatan</h2>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, var(--pwa-border-subtle), transparent)" }} aria-hidden="true" />
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-3xl border flex flex-col items-center justify-center gap-3 py-12"
          style={{
            background: "var(--pwa-bg-card)",
            borderColor: "var(--pwa-border-subtle)",
            backdropFilter: "blur(12px)",
          }}
        >
          <CalendarDays size={36} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>Belum ada kegiatan</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
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
                  "relative overflow-hidden rounded-2xl border px-5 py-4 flex items-start gap-4",
                  event.isToday
                    ? "border-emerald-500/40"
                    : "",
                ].join(" ")}
                style={
                  event.isToday
                    ? {
                        background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)",
                        borderColor: "rgba(16,185,129,0.4)",
                        boxShadow: "0 0 16px rgba(16,185,129,0.15)",
                      }
                    : {
                        background: "var(--pwa-bg-card)",
                        borderColor: "var(--pwa-border-subtle)",
                        backdropFilter: "blur(12px)",
                      }
                }
              >
                {/* Date badge */}
                <div
                  className={[
                    "shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl",
                    event.isToday ? "bg-emerald-500" : "",
                  ].join(" ")}
                  style={!event.isToday ? { background: "var(--pwa-bg-card-hover)" } : undefined}
                  aria-hidden="true"
                >
                  <span
                    className={`text-2xl font-extrabold leading-none ${event.isToday ? "text-black" : ""}`}
                    style={!event.isToday ? { color: "var(--pwa-text-primary)" } : undefined}
                  >
                    {day}
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${event.isToday ? "text-black/70" : ""}`}
                    style={!event.isToday ? { color: "var(--pwa-text-muted)" } : undefined}
                  >
                    {monthStr}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-base font-bold leading-snug line-clamp-2 flex-1 ${event.isToday ? "text-emerald-300" : ""}`}
                      style={!event.isToday ? { color: "var(--pwa-text-primary)" } : undefined}
                    >
                      {event.title}
                    </p>
                    {event.isToday && (
                      <span className="shrink-0 text-xs bg-emerald-500 text-black font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        Hari ini
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {event.speaker && (
                      <div className="flex items-center gap-1">
                        <User size={12} strokeWidth={2} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
                        <span
                          className="text-sm truncate max-w-[140px]"
                          style={{ color: "var(--pwa-text-muted)" }}
                        >
                          {event.speaker}
                        </span>
                      </div>
                    )}
                    {event.eventTime && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} strokeWidth={2} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
                        <time
                          className="text-sm"
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
