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
        <h2 className="text-sm font-bold" style={{ color: "var(--pwa-text-primary)" }}>Petugas Hari Ini</h2>
      </div>

      {officers.length === 0 ? (
        <div
          className="rounded-3xl border p-5 flex flex-col items-center justify-center gap-2 py-8"
          style={{
            background: "var(--pwa-bg-card)",
            borderColor: "var(--pwa-border-subtle)",
          }}
        >
          <Users size={28} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>Belum ada jadwal petugas</p>
        </div>
      ) : (
        <dl
          className="rounded-3xl border overflow-hidden"
          style={{
            background: "var(--pwa-bg-card)",
            borderColor: "var(--pwa-border-subtle)",
          }}
        >
          {officers.map((officer, i) => (
            <div
              key={`${officer.role}-${i}`}
              className={`flex items-center justify-between px-4 py-3 ${
                i < officers.length - 1 ? "border-b" : ""
              }`}
              style={i < officers.length - 1 ? { borderColor: "var(--pwa-border-subtle)" } : undefined}
            >
              <dt className="text-xs font-semibold text-yellow-400 capitalize w-24 shrink-0">
                {officer.role}
              </dt>
              <dd className="text-sm font-medium text-right" style={{ color: "var(--pwa-text-primary)" }}>
                {officer.name}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
