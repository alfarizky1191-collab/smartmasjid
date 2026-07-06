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
        <h2 className="text-sm font-bold text-white">Pengumuman</h2>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 p-5 flex flex-col items-center justify-center gap-2 py-8">
          <Megaphone size={28} className="text-slate-600" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-slate-500 text-sm">Belum ada pengumuman</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {announcements.slice(0, 5).map((item) => (
            <li
              key={item.id}
              className="bg-slate-900/70 rounded-2xl border border-slate-700/40 px-4 py-3.5 flex items-start gap-3"
            >
              {/* Yellow accent bar */}
              <div className="w-1 h-5 bg-yellow-400 rounded-full shrink-0 mt-0.5" aria-hidden="true" />

              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-snug">
                  {item.title}
                </p>
                {item.createdAt && (
                  <time className="text-slate-500 text-[11px] mt-1 block">
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
