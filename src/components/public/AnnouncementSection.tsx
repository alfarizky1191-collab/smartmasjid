import type { Announcement } from "./types";
import SectionTitle from "./SectionTitle";
import Container from "./Container";

export default function AnnouncementSection({ announcements }: { announcements: Announcement[] }) {
  return (
    <section id="pengumuman" aria-labelledby="pengumuman-title" className="py-8 bg-white">
      <Container>
        <SectionTitle>📢 Pengumuman</SectionTitle>
        {announcements.length === 0 ? (
          <p className="text-slate-400 text-sm">Tidak ada pengumuman aktif.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 shadow-sm">
                <p className="text-slate-800 font-medium">{a.title}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(a.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
