import type { Event } from "./types";
import SectionTitle from "./SectionTitle";
import Container from "./Container";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";

export default function EventSection({ events }: { events: Event[] }) {
  return (
    <section id="kegiatan" aria-labelledby="kegiatan-title" className="py-8 bg-slate-50">
      <Container>
        <SectionTitle>📅 Kegiatan</SectionTitle>
        {events.length === 0 ? (
          <p className="text-slate-400 text-sm">Tidak ada kegiatan mendatang.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {events.map((e) => (
              <div key={e.id} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-lg">{e.title}</h3>
                  <span className="shrink-0 text-xs bg-emerald-100 text-emerald-700 rounded-xl px-3 py-1 font-semibold">
                    {e.event_time ?? ""}
                  </span>
                </div>
                {e.speaker && <p className="text-sm text-slate-500 mt-1">🎤 {e.speaker}</p>}
                <p className="text-sm text-emerald-600 font-medium mt-2">
                  {formatIndonesianDateWithDay(e.event_date)}
                </p>
                {e.location && <p className="text-sm text-slate-500 mt-1">📍 {e.location}</p>}
                {e.description && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{e.description}</p>}
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
