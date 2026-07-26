// Server Component — purely presentational.
import { Megaphone } from "lucide-react";

export interface Announcement {
  id: string | number;
  title: string;
  createdAt?: string;
}

interface AnnouncementCardProps {
  announcements: Announcement[];
}

export default function AnnouncementCard({ announcements }: AnnouncementCardProps) {
  return (
    <section className="mx-5" aria-label="Pengumuman">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-amber-300 text-lg leading-none" aria-hidden="true">☽</span>
        <h2 className="text-lg font-bold tracking-wide" style={{ color: "var(--pwa-text-primary)" }}>
          Pengumuman
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "linear-gradient(to right, rgba(212,175,55,0.35), transparent)" }}
          aria-hidden="true"
        />
      </div>

      {announcements.length === 0 ? (
        <div
          className="rounded-3xl border flex flex-col items-center justify-center gap-4 py-14"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <Megaphone size={40} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-base" style={{ color: "var(--pwa-text-muted)" }}>Belum ada pengumuman</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4" role="list">
          {announcements.slice(0, 5).map((item, idx) => (
            <li
              key={item.id}
              className="rounded-3xl border px-5 py-5 flex items-start gap-4"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid var(--glass-border)",
                boxShadow: "0 4px 24px 0 var(--glass-shadow), inset 0 1px 0 0 rgba(255,255,255,0.08)",
              }}
            >
              {/* Numbered gold badge */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-base text-slate-950"
                style={{
                  background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                  boxShadow: "0 2px 8px rgba(251,191,36,0.35)",
                }}
                aria-hidden="true"
              >
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-base font-bold leading-snug" style={{ color: "var(--pwa-text-primary)" }}>
                  {item.title}
                </p>
                {item.createdAt && (
                  <time className="text-sm mt-1.5 block" style={{ color: "var(--pwa-text-muted)" }}>
                    {item.createdAt}
                  </time>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
