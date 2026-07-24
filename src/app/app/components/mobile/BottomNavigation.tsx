"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, Info, Heart, User } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Beranda",
    href: "/app",
    icon: Home,
  },
  {
    label: "Sholat",
    href: "/app/sholat",
    icon: Clock,
  },
  {
    label: "Info",
    href: "/app/info",
    icon: Info,
  },
  {
    label: "Donasi",
    href: "/app/donasi",
    icon: Heart,
  },
  {
    label: "Profil",
    href: "/app/profil",
    icon: User,
  },
] as const;

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Glass blur bar — stronger blur, gold/emerald gradient border */}
      <div
        className="backdrop-blur-2xl border-t"
        style={{
          background: "var(--pwa-nav-bg)",
          borderImageSlice: 1,
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderColor: "transparent",
          backgroundClip: "padding-box",
          boxShadow: "inset 0 1px 0 0 rgba(52,211,153,0.15), inset 0 0 0 0.5px rgba(251,191,36,0.10)",
        }}
      >
        <div className="flex items-stretch justify-around px-2 h-20">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex flex-1 flex-col items-center justify-center gap-1
                  transition-all duration-200 relative
                  ${isActive ? "text-emerald-400" : "text-slate-500"}
                `}
              >
                {/* Active indicator bar — emerald glow */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-emerald-400"
                    style={{
                      boxShadow: "0 0 8px 2px rgba(52,211,153,0.55)",
                    }}
                  />
                )}

                {/* Icon container */}
                <span
                  className={`
                    flex items-center justify-center w-12 h-9 rounded-2xl transition-all duration-200
                    ${isActive ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500"}
                  `}
                >
                  <Icon
                    size={isActive ? 24 : 22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </span>

                <span
                  className={`text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
