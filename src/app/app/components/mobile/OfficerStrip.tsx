// Server Component — purely presentational.
import type { OfficerEntry } from "@/lib/mobile/types";
import { Users } from "lucide-react";

interface OfficerStripProps {
  officers: OfficerEntry[];
}

export default function OfficerStrip({ officers }: OfficerStripProps) {
  return (
    <section className="mx-5 mt-5" aria-label="Petugas Hari Ini">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-yellow-400 rounded-full" aria-hidden="true" />
        <h2 className="text-sm font-bold text-white">Petugas Hari Ini</h2>
      </div>

      {officers.length === 0 ? (
        <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 p-5 flex flex-col items-center justify-center gap-2 py-8">
          <Users size={28} className="text-slate-600" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-slate-500 text-sm">Belum ada jadwal petugas</p>
        </div>
      ) : (
        <dl className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden">
          {officers.map((officer, i) => (
            <div
              key={`${officer.role}-${i}`}
              className={`flex items-center justify-between px-4 py-3 ${
                i < officers.length - 1 ? "border-b border-slate-700/40" : ""
              }`}
            >
              <dt className="text-xs font-semibold text-yellow-400 capitalize w-24 shrink-0">
                {officer.role}
              </dt>
              <dd className="text-sm font-medium text-white text-right">
                {officer.name}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
