"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Role =
  | "super_admin"
  | "bendahara"
  | "operator_tv"
  | "sekretaris";

type MenuItem = {
  name: string;
  href: string;
};

const menuItems: Record<string, MenuItem> = {
  tvDisplay: {
    name: "TV Display",
    href: "/dashboard",
  },
  finance: {
    name: "Finance",
    href: "/dashboard/finance",
  },
  donasi: {
    name: "Donasi",
    href: "/dashboard/donasi",
  },
  events: {
    name: "Events",
    href: "/dashboard/events",
  },
  petugas: {
    name: "Petugas",
    href: "/dashboard/petugas",
  },
  settings: {
    name: "Settings",
    href: "/dashboard/settings",
  },
};

const menusByRole: Record<Role, MenuItem[]> = {
  super_admin: [
    menuItems.tvDisplay,
    menuItems.finance,
    menuItems.donasi,
    menuItems.events,
    menuItems.petugas,
    menuItems.settings,
  ],
  bendahara: [
    menuItems.finance,
    menuItems.donasi,
  ],
  operator_tv: [
    menuItems.tvDisplay,
  ],
  sekretaris: [
    menuItems.events,
    menuItems.petugas,
  ],
};

const fallbackRole: Role =
  "super_admin";

const isKnownRole = (
  value: string | null | undefined
): value is Role =>
  value === "super_admin" ||
  value === "bendahara" ||
  value === "operator_tv" ||
  value === "sekretaris";

export default function AdminSidebar() {
  const pathname =
    usePathname();

  const [role, setRole] =
    useState<Role | "">("");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("AUTH USER:", user);
        console.log("AUTH USER ID:", user?.id);

        if (!user) {
          console.warn("AUTH USER NOT FOUND");
          return;
        }

        const {
          data: profile,
          error,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        console.log("PROFILE:", profile);
        console.log("PROFILE ERROR:", error);

        if (
          error ||
          !profile
        ) {
          console.warn(
            "PROFILE NOT FOUND, USING TEMPORARY SUPER_ADMIN FALLBACK",
            {
              userId: user.id,
              error,
            }
          );

          setRole(fallbackRole);
          return;
        }

        if (
          isKnownRole(
            profile.role
          )
        ) {
          setRole(profile.role);
          return;
        }

        console.warn(
          "UNKNOWN PROFILE ROLE, USING TEMPORARY SUPER_ADMIN FALLBACK",
          {
            userId: user.id,
            role: profile.role,
          }
        );

        setRole(fallbackRole);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, []);

  if (loading) {
    return (
      <aside className="w-[300px] bg-slate-900 border-r border-slate-800 min-h-screen p-6">
        <div className="bg-slate-800 p-4 rounded-2xl text-white">
          Memuat menu...
        </div>
      </aside>
    );
  }

  const menus =
    isKnownRole(role)
      ? menusByRole[role]
      : [];

  return (
    <aside className="w-[300px] bg-slate-900 border-r border-slate-800 min-h-screen p-6 flex flex-col gap-4">
      <h1 className="text-4xl font-bold text-emerald-400 mb-8">
        Masjid Admin
      </h1>

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
