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

const VARIANT_STYLES: Record<
  QuickActionItem["variant"],
  { bg: string; icon: string; ring: string }
> = {
  emerald: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: "text-emerald-400",
    ring: "active:bg-emerald-500/20",
  },
  yellow: {
    bg: "bg-yellow-500/10 border-yellow-500/20",
    icon: "text-yellow-400",
    ring: "active:bg-yellow-500/20",
  },
  blue: {
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: "text-blue-400",
    ring: "active:bg-blue-500/20",
  },
  purple: {
    bg: "bg-purple-500/10 border-purple-500/20",
    icon: "text-purple-400",
    ring: "active:bg-purple-500/20",
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
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-emerald-400 rounded-full" />
        <h3 className="text-sm font-bold text-white">Akses Cepat</h3>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => {
          const styles = VARIANT_STYLES[action.variant];
          const Icon = action.icon;

          const commonClass = `
            flex flex-col items-center justify-center gap-1.5
            rounded-2xl border py-3.5 px-2
            transition-all duration-150 active:scale-95
            ${styles.bg} ${styles.ring}
          `;

          const content = (
            <>
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center">
                <Icon size={20} strokeWidth={1.8} className={styles.icon} />
              </div>
              <span className="text-[11px] font-semibold text-white text-center leading-tight">
                {action.label}
              </span>
              {action.sublabel && (
                <span className="text-[9px] text-slate-500 text-center leading-tight">
                  {action.sublabel}
                </span>
              )}
            </>
          );

          // Render as anchor when href is provided, otherwise button
          if (action.href) {
            return (
              <a
                key={action.id}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={commonClass}
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
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
