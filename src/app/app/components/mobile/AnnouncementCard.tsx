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
      <div className="flex items-center gap-2 mb-3">
        <Megaphone size={15} className="text-yellow-400" strokeWidth={2} aria-hidden="true" />
        <h2 className="text-sm font-bold" style={{ color: "var(--pwa-text-primary)" }}>Pengumuman</h2>
      </div>

      {announcements.length === 0 ? (
        <div
          className="rounded-3xl border p-5 flex flex-col items-center justify-center gap-2 py-8"
          style={{
            background: "var(--pwa-bg-card)",
            borderColor: "var(--pwa-border-subtle)",
          }}
        >
          <Megaphone size={28} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>Belum ada pengumuman</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {announcements.slice(0, 5).map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border px-4 py-3.5 flex items-start gap-3"
              style={{
                background: "var(--pwa-bg-card)",
                borderColor: "var(--pwa-border-subtle)",
              }}
            >
              {/* Yellow accent bar */}
              <div className="w-1 h-5 bg-yellow-400 rounded-full shrink-0 mt-0.5" aria-hidden="true" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug" style={{ color: "var(--pwa-text-primary)" }}>
                  {item.title}
                </p>
                {item.createdAt && (
                  <time className="text-[11px] mt-1 block" style={{ color: "var(--pwa-text-muted)" }}>
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
