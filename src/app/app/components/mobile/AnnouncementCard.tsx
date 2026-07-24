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
      <div className="flex items-center gap-2 mb-3">
        <span className="text-yellow-400 text-base leading-none" aria-hidden="true">☽</span>
        <h2 className="text-base font-bold" style={{ color: "var(--pwa-text-primary)" }}>Pengumuman</h2>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, var(--pwa-border-subtle), transparent)" }} aria-hidden="true" />
      </div>

      {announcements.length === 0 ? (
        <div
          className="rounded-3xl border flex flex-col items-center justify-center gap-3 py-12"
          style={{
            background: "var(--pwa-bg-card)",
            borderColor: "var(--pwa-border-subtle)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Megaphone size={36} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>Belum ada pengumuman</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" role="list">
          {announcements.slice(0, 5).map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border px-5 py-4 flex items-start gap-4"
              style={{
                background: "var(--pwa-bg-card)",
                borderColor: "var(--pwa-border-subtle)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Gold accent bar */}
              <div className="w-1.5 h-6 bg-yellow-400 rounded-full shrink-0 mt-0.5" aria-hidden="true" />

              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold leading-snug" style={{ color: "var(--pwa-text-primary)" }}>
                  {item.title}
                </p>
                {item.createdAt && (
                  <time className="text-sm mt-1 block" style={{ color: "var(--pwa-text-muted)" }}>
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
