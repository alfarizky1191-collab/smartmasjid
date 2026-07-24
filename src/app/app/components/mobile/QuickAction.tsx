"use client";

import { QrCode, MapPin, BookOpen, Phone } from "lucide-react";

export interface QuickActionItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  variant: "emerald" | "yellow" | "blue" | "purple";
  href?: string;
  onClick?: () => void;
}

const VARIANT_INLINE: Record<
  QuickActionItem["variant"],
  { bg: string; border: string; iconBg: string; iconColor: string }
> = {
  emerald: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    iconBg: "rgba(16,185,129,0.12)",
    iconColor: "text-emerald-400",
  },
  yellow: {
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.2)",
    iconBg: "rgba(251,191,36,0.12)",
    iconColor: "text-amber-400",
  },
  blue: {
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    iconBg: "rgba(59,130,246,0.12)",
    iconColor: "text-blue-400",
  },
  purple: {
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.2)",
    iconBg: "rgba(168,85,247,0.12)",
    iconColor: "text-purple-400",
  },
};

export const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: "qris",
    label: "Donasi QRIS",
    sublabel: "Scan & donasi",
    icon: QrCode,
    variant: "emerald",
  },
  {
    id: "lokasi",
    label: "Lokasi",
    sublabel: "Lihat peta",
    icon: MapPin,
    variant: "yellow",
  },
  {
    id: "kajian",
    label: "Kajian",
    sublabel: "Jadwal ilmu",
    icon: BookOpen,
    variant: "blue",
  },
  {
    id: "kontak",
    label: "Kontak",
    sublabel: "Hubungi kami",
    icon: Phone,
    variant: "purple",
  },
];

interface QuickActionProps {
  actions?: QuickActionItem[];
}

export default function QuickAction({
  actions = DEFAULT_QUICK_ACTIONS,
}: QuickActionProps) {
  return (
    <section className="mx-5">
      {/* Section header with Islamic divider */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-amber-300 text-base" aria-hidden="true">☽</span>
        <h3 className="text-base font-bold" style={{ color: "var(--pwa-text-primary)" }}>
          Akses Cepat
        </h3>
        <div
          className="flex-1 h-px"
          style={{
            background: "linear-gradient(to right, rgba(212,175,55,0.3), transparent)",
          }}
          aria-hidden="true"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {actions.map((action) => {
          const styles = VARIANT_INLINE[action.variant];
          const Icon = action.icon;

          const commonClass = `
            flex flex-col items-center justify-center gap-2.5
            rounded-2xl py-5 px-3
            transition-all duration-150 active:scale-95 active:shadow-inner
          `;

          const content = (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: styles.iconBg }}
              >
                <Icon size={26} strokeWidth={1.8} className={styles.iconColor} />
              </div>
              <span
                className="text-sm font-bold text-center leading-tight"
                style={{ color: "var(--pwa-text-primary)" }}
              >
                {action.label}
              </span>
              {action.sublabel && (
                <span
                  className="text-xs text-center leading-tight"
                  style={{ color: "var(--pwa-text-muted)" }}
                >
                  {action.sublabel}
                </span>
              )}
            </>
          );

          if (action.href) {
            return (
              <a
                key={action.id}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={commonClass}
                style={{
                  background: styles.bg,
                  border: `1px solid ${styles.border}`,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                }}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={commonClass}
              style={{
                background: styles.bg,
                border: `1px solid ${styles.border}`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
