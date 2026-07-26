// Server Component — purely presentational.
import type { OfficerEntry } from "@/lib/mobile/types";
import { Users } from "lucide-react";

interface OfficerStripProps {
  officers: OfficerEntry[];
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  imam:    { bg: "rgba(16,185,129,0.12)",  text: "#34d399", border: "rgba(16,185,129,0.3)" },
  khatib:  { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", border: "rgba(251,191,36,0.3)" },
  muadzin: { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa", border: "rgba(139,92,246,0.3)" },
  bilal:   { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.3)" },
};

function getRoleStyle(role: string) {
  const key = role.toLowerCase();
  return ROLE_COLORS[key] ?? {
    bg: "rgba(212,175,55,0.10)",
    text: "#fbbf24",
    border: "rgba(212,175,55,0.25)",
  };
}

export default function OfficerStrip({ officers }: OfficerStripProps) {
  return (
    <section className="mx-5" aria-label="Petugas Hari Ini">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-amber-300 text-lg leading-none" aria-hidden="true">☽</span>
        <h2 className="text-lg font-bold tracking-wide" style={{ color: "var(--pwa-text-primary)" }}>
          Petugas Hari Ini
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "linear-gradient(to right, rgba(212,175,55,0.35), transparent)" }}
          aria-hidden="true"
        />
      </div>

      {officers.length === 0 ? (
        <div
          className="rounded-3xl flex flex-col items-center justify-center gap-4 py-14"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <Users size={40} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--pwa-text-muted)" }} />
          <p className="text-base" style={{ color: "var(--pwa-text-muted)" }}>Belum ada jadwal petugas</p>
        </div>
      ) : (
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--glass-border)",
            boxShadow: "0 4px 24px 0 var(--glass-shadow), inset 0 1px 0 0 rgba(255,255,255,0.08)",
          }}
        >
          {officers.map((officer, i) => {
            const style = getRoleStyle(officer.role);
            return (
              <div
                key={`${officer.role}-${i}`}
                className="flex items-center gap-4 px-5 py-4"
                style={i < officers.length - 1 ? { borderBottom: "1px solid var(--glass-border)" } : undefined}
              >
                {/* Role badge */}
                <div
                  className="px-3 py-1.5 rounded-xl shrink-0"
                  style={{ background: style.bg, border: `1px solid ${style.border}` }}
                >
                  <span className="text-sm font-black capitalize tracking-wide" style={{ color: style.text }}>
                    {officer.role}
                  </span>
                </div>

                {/* Dotted separator */}
                <div
                  className="flex-1 border-b border-dashed"
                  style={{ borderColor: "var(--glass-border)" }}
                  aria-hidden="true"
                />

                {/* Name */}
                <p className="text-base font-bold shrink-0" style={{ color: "var(--pwa-text-primary)" }}>
                  {officer.name}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
