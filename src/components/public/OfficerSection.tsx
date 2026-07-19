import type { OfficerSchedule } from "./types";
import SectionTitle from "./SectionTitle";
import Container from "./Container";

export default function OfficerSection({ schedules }: { schedules: OfficerSchedule[] }) {
  return (
    <section id="petugas" aria-labelledby="petugas-title" className="py-8 bg-white">
      <Container>
        <SectionTitle>👤 Petugas Hari Ini</SectionTitle>
        {schedules.length === 0 ? (
          <p className="text-slate-400 text-sm">Belum ada jadwal petugas hari ini.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {schedules.map((s) => (
              <div key={s.id} className="flex items-center gap-4 rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl shrink-0" aria-hidden="true">
                  👤
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide capitalize">{s.role}</p>
                  <p className="font-bold text-slate-800">{s.officers?.name ?? "-"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
