import type { CSSProperties } from "react";
import { Phone, MessageCircle, Globe, Mail } from "lucide-react";

interface ContactCardProps {
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  email?: string | null;
}

type ContactItem = {
  href: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: CSSProperties }>;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  external?: boolean;
};

export default function ContactCard({ phone, whatsapp, website, email }: ContactCardProps) {
  const hasContact = phone || whatsapp || website || email;
  if (!hasContact) return null;

  const items: ContactItem[] = [
    phone && {
      href: `tel:${phone}`,
      label: "Telepon",
      value: phone,
      icon: Phone,
      colorBg: "rgba(16,185,129,0.12)",
      colorBorder: "rgba(16,185,129,0.3)",
      colorText: "#34d399",
    },
    whatsapp && {
      href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
      label: "WhatsApp",
      value: whatsapp,
      icon: MessageCircle,
      colorBg: "rgba(34,197,94,0.12)",
      colorBorder: "rgba(34,197,94,0.3)",
      colorText: "#4ade80",
      external: true,
    },
    website && {
      href: website.startsWith("http") ? website : `https://${website}`,
      label: "Website",
      value: website,
      icon: Globe,
      colorBg: "rgba(59,130,246,0.12)",
      colorBorder: "rgba(59,130,246,0.3)",
      colorText: "#60a5fa",
      external: true,
    },
    email && {
      href: `mailto:${email}`,
      label: "Email",
      value: email,
      icon: Mail,
      colorBg: "rgba(251,191,36,0.12)",
      colorBorder: "rgba(251,191,36,0.3)",
      colorText: "#fbbf24",
    },
  ].filter(Boolean) as ContactItem[];

  return (
    <section className="mx-5" aria-label="Kontak Masjid">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-purple-400 text-lg leading-none" aria-hidden="true">✦</span>
        <h2 className="text-lg font-bold tracking-wide" style={{ color: "var(--pwa-text-primary)" }}>
          Kontak
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "linear-gradient(to right, rgba(168,85,247,0.35), transparent)" }}
          aria-hidden="true"
        />
      </div>

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
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-4 px-5 py-4 transition-all active:opacity-70"
              style={i < items.length - 1 ? { borderBottom: "1px solid var(--glass-border)" } : undefined}
              aria-label={`${item.label}: ${item.value}`}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: item.colorBg, border: `1px solid ${item.colorBorder}` }}
                aria-hidden="true"
              >
                <Icon size={22} strokeWidth={2} style={{ color: item.colorText }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: item.colorText }}>
                  {item.label}
                </p>
                <p className="text-base font-semibold mt-0.5 truncate" style={{ color: "var(--pwa-text-primary)" }}>
                  {item.value}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
