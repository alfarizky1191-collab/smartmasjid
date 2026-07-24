// Server Component — purely presentational.
import type { OfficerEntry } from "@/lib/mobile/types";
import { Users } from "lucide-react";

interface OfficerStripProps {
  officers: OfficerEntry[];
}

export default function OfficerStrip({ officers }: OfficerStripProps) {
  return (
    <section className="mx-5 mt-5" aria-label="Petugas Hari Ini">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-yellow-400 text-base leading-none" aria-hidden="true">☽</span>
        <h2 className="text-base font-bold" style={{ color: "var(--pwa-text-primary)" }}>Petugas Hari Ini</h2>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, var(--pwa-border-subtle), transparent)" }} aria-hidden="true" />
      </div>

      {officers.length === 0 ? (
        <div
          className="rounded-3xl border flex flex-col items-center justify-center gap-3 py-12"
          style={{
            background: "var(--pwa-bg-card)",
            borderColor: "var(--pwa-border-subtle)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Users size={36} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>Belum ada jadwal petugas</p>
        </div>
      ) : (
        <dl
          className="rounded-3xl border overflow-hidden"
          style={{
            background: "var(--pwa-bg-card)",
            borderColor: "var(--pwa-border-subtle)",
            backdropFilter: "blur(12px)",
          }}
        >
          {officers.map((officer, i) => (
            <div
              key={`${officer.role}-${i}`}
              className={`flex items-center gap-4 px-5 py-4 ${
                i < officers.length - 1 ? "border-b" : ""
              }`}
              style={i < officers.length - 1 ? { borderColor: "var(--pwa-border-subtle)" } : undefined}
            >
              <dt className="text-sm font-bold text-amber-400 capitalize w-28 shrink-0">
                {officer.role}
              </dt>
              <dd className="text-base font-semibold" style={{ color: "var(--pwa-text-primary)" }}>
                {officer.name}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
