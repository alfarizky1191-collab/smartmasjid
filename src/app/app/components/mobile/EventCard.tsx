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
      <div className="flex items-center gap-3 mb-4">
        <CalendarDays size={18} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
        <h2 className="text-lg font-bold tracking-wide" style={{ color: "var(--pwa-text-primary)" }}>
          Jadwal Kegiatan
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "linear-gradient(to right, rgba(16,185,129,0.35), transparent)" }}
          aria-hidden="true"
        />
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-3xl flex flex-col items-center justify-center gap-4 py-14"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <CalendarDays size={40} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-base" style={{ color: "var(--pwa-text-muted)" }}>Belum ada kegiatan</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4" role="list">
          {events.slice(0, 5).map((event) => {
            const dateParts = event.eventDate.split("-").map(Number);
            const day = dateParts[2] ?? 1;
            const monthStr = new Date(
              dateParts[0], (dateParts[1] ?? 1) - 1, day
            ).toLocaleString("id-ID", { month: "short" });

            return (
              <li
                key={event.id}
                className="relative overflow-hidden rounded-3xl flex items-stretch gap-0"
                style={
                  event.isToday
                    ? {
                        background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.08) 100%)",
                        border: "1px solid rgba(16,185,129,0.45)",
                        boxShadow: "0 0 20px rgba(16,185,129,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
                      }
                    : {
                        background: "var(--glass-bg)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid var(--glass-border)",
                        boxShadow: "0 4px 24px 0 var(--glass-shadow), inset 0 1px 0 0 rgba(255,255,255,0.08)",
                      }
                }
              >
                {/* Left accent stripe */}
                <div
                  className="w-1.5 shrink-0 rounded-l-3xl"
                  style={{
                    background: event.isToday
                      ? "linear-gradient(to bottom, #34d399, #059669)"
                      : "linear-gradient(to bottom, rgba(212,175,55,0.6), rgba(212,175,55,0.2))",
                  }}
                  aria-hidden="true"
                />

                <div className="flex items-start gap-4 px-5 py-5 flex-1 min-w-0">
                  {/* Date badge */}
                  <div
                    className="shrink-0 flex flex-col items-center justify-center w-16 h-18 rounded-2xl min-h-[4.5rem]"
                    style={
                      event.isToday
                        ? {
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
                          }
                        : {
                            background: "rgba(212,175,55,0.1)",
                            border: "1px solid rgba(212,175,55,0.25)",
                          }
                    }
                    aria-hidden="true"
                  >
                    <span
                      className="text-2xl font-black leading-none"
                      style={{ color: event.isToday ? "#fff" : "var(--pwa-text-primary)" }}
                    >
                      {day}
                    </span>
                    <span
                      className="text-xs font-bold uppercase tracking-wide mt-0.5"
                      style={{ color: event.isToday ? "rgba(255,255,255,0.8)" : "var(--pwa-text-muted)" }}
                    >
                      {monthStr}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-base font-bold leading-snug line-clamp-2 flex-1"
                        style={{ color: event.isToday ? "var(--islamic-emerald)" : "var(--pwa-text-primary)" }}
                      >
                        {event.title}
                      </p>
                      {event.isToday && (
                        <span
                          className="shrink-0 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide text-slate-950"
                          style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
                        >
                          Hari ini
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {event.speaker && (
                        <div className="flex items-center gap-1.5">
                          <User size={13} strokeWidth={2} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
                          <span className="text-sm truncate max-w-[140px]" style={{ color: "var(--pwa-text-muted)" }}>
                            {event.speaker}
                          </span>
                        </div>
                      )}
                      {event.eventTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} strokeWidth={2} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
                          <time className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>
                            {event.eventTime}
                          </time>
                        </div>
                      )}
                    </div>
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
