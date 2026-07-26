"use client";

import type { CSSProperties } from "react";
import Link from "next/link";

export interface QuickActionItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: CSSProperties }>;
  variant: "emerald" | "yellow" | "blue" | "purple";
  href?: string;
  onClick?: () => void;
}

const VARIANT_STYLES: Record<
  QuickActionItem["variant"],
  { bg: string; border: string; iconBg: string; iconColor: string; glow: string }
> = {
  emerald: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    iconBg: "rgba(16,185,129,0.15)",
    iconColor: "#34d399",
    glow: "rgba(16,185,129,0.25)",
  },
  yellow: {
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.2)",
    iconBg: "rgba(251,191,36,0.15)",
    iconColor: "#fbbf24",
    glow: "rgba(251,191,36,0.25)",
  },
  blue: {
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    iconBg: "rgba(59,130,246,0.15)",
    iconColor: "#60a5fa",
    glow: "rgba(59,130,246,0.25)",
  },
  purple: {
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.2)",
    iconBg: "rgba(168,85,247,0.15)",
    iconColor: "#c084fc",
    glow: "rgba(168,85,247,0.25)",
  },
};

interface QuickActionProps {
  actions: QuickActionItem[];
}

export default function QuickAction({ actions }: QuickActionProps) {
  return (
    <section className="mx-5" aria-label="Akses Cepat">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-amber-300 text-lg leading-none" aria-hidden="true">☽</span>
        <h2 className="text-lg font-bold tracking-wide" style={{ color: "var(--pwa-text-primary)" }}>
          Akses Cepat
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "linear-gradient(to right, rgba(212,175,55,0.35), transparent)" }}
          aria-hidden="true"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => {
          const s = VARIANT_STYLES[action.variant];
          const Icon = action.icon;

          const inner = (
            <>
              {/* Icon container */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: s.iconBg,
                  border: `1px solid ${s.border}`,
                  boxShadow: `0 4px 16px ${s.glow}`,
                }}
                aria-hidden="true"
              >
                <Icon size={30} strokeWidth={1.8} style={{ color: s.iconColor }} />
              </div>

              {/* Label */}
              <span
                className="text-sm font-bold text-center leading-tight block"
                style={{ color: "var(--pwa-text-primary)" }}
              >
                {action.label}
              </span>
              {action.sublabel && (
                <span
                  className="text-xs text-center leading-tight block mt-0.5"
                  style={{ color: "var(--pwa-text-muted)" }}
                >
                  {action.sublabel}
                </span>
              )}
            </>
          );

          const baseClass = `
            flex flex-col items-center justify-center
            rounded-3xl py-6 px-2
            transition-all duration-150 active:scale-95
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
          `;

          const baseStyle = {
            background: s.bg,
            border: `1px solid ${s.border}`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          };

          // External TV link: open in new tab. Internal: use Next.js Link.
          const isExternal = action.href?.startsWith("http") || action.href?.startsWith("/tv");

          if (action.href && !action.onClick) {
            return (
              <Link
                key={action.id}
                href={action.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={baseClass}
                style={baseStyle}
                aria-label={action.label}
              >
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={baseClass}
              style={baseStyle}
              aria-label={action.label}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
