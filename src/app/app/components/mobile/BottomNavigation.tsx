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
      {/* Glass blur bar */}
      <div
        className="backdrop-blur-xl border-t"
        style={{
          background: "var(--pwa-nav-bg)",
          borderColor: "var(--pwa-nav-border)",
        }}
      >
        <div className="flex items-stretch justify-around px-2 h-16">
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
                  flex flex-1 flex-col items-center justify-center gap-0.5
                  transition-all duration-200 relative
                  ${isActive ? "text-emerald-400" : ""}
                `}
                style={isActive ? undefined : { color: "var(--pwa-text-muted)" }}
              >
                {/* Active pill indicator */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
                )}

                <span
                  className={`
                    flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200
                    ${isActive ? "bg-emerald-500/15" : ""}
                  `}
                >
                  <Icon
                    size={isActive ? 22 : 20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </span>

                <span
                  className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                    isActive ? "text-emerald-400" : ""
                  }`}
                  style={isActive ? undefined : { color: "var(--pwa-text-muted)" }}
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
