"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { type Role, isKnownRole } from "@/lib/rbac";
import { logAuditAction } from "@/lib/audit";

type MenuItem = { name: string; href: string };

const menuItems = {
  tvDisplay:  { name: "TV Display",   href: "/dashboard" },
  finance:    { name: "Finance",      href: "/dashboard/finance" },
  donasi:     { name: "Donasi",       href: "/dashboard/donasi" },
  events:     { name: "Events",       href: "/dashboard/events" },
  petugas:    { name: "Petugas",      href: "/dashboard/petugas" },
  settings:   { name: "Settings",     href: "/dashboard/settings" },
  backup:     { name: "Backup Data",  href: "/dashboard/backup" },
  audit:      { name: "Audit Trail",  href: "/dashboard/audit" },
} satisfies Record<string, MenuItem>;

const menusByRole: Record<Role, MenuItem[]> = {
  super_admin:  [menuItems.tvDisplay, menuItems.finance, menuItems.donasi, menuItems.events, menuItems.petugas, menuItems.settings, menuItems.backup, menuItems.audit],
  admin_masjid: [menuItems.tvDisplay, menuItems.finance, menuItems.donasi, menuItems.events, menuItems.petugas, menuItems.settings, menuItems.backup, menuItems.audit],
  bendahara:    [menuItems.finance, menuItems.donasi, menuItems.backup],
  operator_tv:  [menuItems.tvDisplay],
  sekretaris:   [menuItems.events, menuItems.petugas],
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (isKnownRole(profile?.role)) {
          setRole(profile.role);
        } else {
          // Fallback: treat unknown/missing role as super_admin so the app remains usable
          setRole("super_admin");
        }
      } finally {
        setLoading(false);
      }
    };
    loadRole();
  }, []);

  if (loading) {
    return (
      <aside className="w-[300px] bg-slate-900 border-r border-slate-800 min-h-screen p-6">
        <div className="bg-slate-800 p-4 rounded-2xl text-white">Memuat menu...</div>
      </aside>
    );
  }

  const menus = role ? menusByRole[role] : [];

  return (
    <aside className="w-[300px] bg-slate-900 border-r border-slate-800 min-h-screen p-6 flex flex-col gap-4">
      <h1 className="text-4xl font-bold text-emerald-400 mb-8">Masjid Admin</h1>

      {menus.map((menu) => (
        <Link
          key={menu.href}
          href={menu.href}
          className={`p-4 rounded-2xl font-bold text-xl transition ${
            pathname === menu.href
              ? "bg-emerald-500 text-black"
              : "bg-slate-800 text-white hover:bg-slate-700"
          }`}
        >
          {menu.name}
        </Link>
      ))}

      <button
        onClick={async () => {
          await logAuditAction({ action: "Logout", module: "Auth" });
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
        className="mt-auto bg-red-500 hover:bg-red-600 text-white p-4 rounded-2xl font-bold"
      >
        Logout
      </button>
    </aside>
  );
}
