// Server Component — all links are plain anchors, no interactivity needed.
import { Phone, MessageCircle, Globe, Mail } from "lucide-react";
import type { ComponentType } from "react";

interface ContactCardProps {
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  email: string | null;
}

interface ContactItem {
  key: string;
  label: string;
  value: string;
  href: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  external: boolean;
}

function buildItems(props: ContactCardProps): ContactItem[] {
  const items: ContactItem[] = [];

  if (props.phone) {
    items.push({
      key: "phone",
      label: "Telepon",
      value: props.phone,
      href: `tel:${props.phone.replace(/\s+/g, "")}`,
      icon: Phone,
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500/10",
      borderClass: "border-emerald-500/20",
      external: false,
    });
  }
  if (props.whatsapp) {
    const digits = props.whatsapp.replace(/\D/g, "");
    const wa = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
    items.push({
      key: "whatsapp",
      label: "WhatsApp",
      value: props.whatsapp,
      href: `https://wa.me/${wa}`,
      icon: MessageCircle,
      colorClass: "text-green-400",
      bgClass: "bg-green-500/10",
      borderClass: "border-green-500/20",
      external: true,
    });
  }
  if (props.website) {
    const href = props.website.startsWith("http") ? props.website : `https://${props.website}`;
    items.push({
      key: "website",
      label: "Website",
      value: props.website.replace(/^https?:\/\//, ""),
      href,
      icon: Globe,
      colorClass: "text-blue-400",
      bgClass: "bg-blue-500/10",
      borderClass: "border-blue-500/20",
      external: true,
    });
  }
  if (props.email) {
    items.push({
      key: "email",
      label: "Email",
      value: props.email,
      href: `mailto:${props.email}`,
      icon: Mail,
      colorClass: "text-purple-400",
      bgClass: "bg-purple-500/10",
      borderClass: "border-purple-500/20",
      external: false,
    });
  }

  return items;
}

export default function ContactCard(props: ContactCardProps) {
  const items = buildItems(props);
  if (items.length === 0) return null;

  return (
    <section className="mx-5 mt-5" aria-label="Kontak Masjid">
      <div className="flex items-center gap-2 mb-3">
        <Phone size={15} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
        <h2 className="text-sm font-bold text-white">Kontak</h2>
      </div>

      <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <a
              key={item.key}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              aria-label={`${item.label}: ${item.value}`}
              className={[
                "flex items-center gap-3 px-4 py-3.5",
                "active:bg-slate-800/70 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                i < items.length - 1 ? "border-b border-slate-700/40" : "",
              ].join(" ")}
            >
              <div className={`w-8 h-8 rounded-xl ${item.bgClass} border ${item.borderClass} flex items-center justify-center shrink-0`}>
                <Icon size={15} strokeWidth={2} className={item.colorClass} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-500 font-medium">{item.label}</p>
                <p className={`text-sm font-semibold truncate ${item.colorClass}`}>{item.value}</p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
