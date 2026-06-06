"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/Adminsidebar";
import { type Role, isKnownRole, canAccess, defaultRoute, BACKUP_MODULES_BY_ROLE } from "@/lib/rbac";

type ModuleKey =
  | "mosque_profile"
  | "officers"
  | "officer_schedules"
  | "events"
  | "donations"
  | "finance"
  | "announcements";

const ALL_MODULES: ModuleKey[] = [
  "mosque_profile",
  "officers",
  "officer_schedules",
  "events",
  "donations",
  "finance",
  "announcements",
];

const MODULE_LABELS: Record<ModuleKey, string> = {
  mosque_profile:    "Profil Masjid",
  officers:          "Petugas",
  officer_schedules: "Jadwal Petugas",
  events:            "Events",
  donations:         "Donasi",
  finance:           "Keuangan",
  announcements:     "Pengumuman",
};

// Map rbac key names → ModuleKey (rbac uses "finance"/"donations", module uses same)
const RBAC_TO_MODULE: Record<string, ModuleKey> = {
  finance:   "finance",
  donations: "donations",
};

function allowedModules(role: Role): ModuleKey[] {
  const allowed = BACKUP_MODULES_BY_ROLE[role];
  if (allowed === null) return ALL_MODULES;
  return allowed.map((k) => RBAC_TO_MODULE[k]).filter(Boolean) as ModuleKey[];
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) { alert("Tidak ada data untuk diekspor."); return; }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function fetchModuleData(mod: ModuleKey, mosqueId: string): Promise<Record<string, unknown>[]> {
  switch (mod) {
    case "mosque_profile":    { const { data } = await supabase.from("mosques").select("*").eq("id", mosqueId); return data ?? []; }
    case "officers":          { const { data } = await supabase.from("officers").select("*").eq("mosque_id", mosqueId); return data ?? []; }
    case "officer_schedules": { const { data } = await supabase.from("officer_schedules").select("*").eq("mosque_id", mosqueId); return data ?? []; }
    case "events":            { const { data } = await supabase.from("events").select("*").eq("mosque_id", mosqueId); return data ?? []; }
    case "donations":         { const { data } = await supabase.from("donations").select("*").eq("mosque_id", mosqueId); return data ?? []; }
    case "finance":           { const { data } = await supabase.from("transactions").select("*").eq("mosque_id", mosqueId); return data ?? []; }
    case "announcements":     { const { data } = await supabase.from("announcements").select("*").eq("mosque_id", mosqueId); return data ?? []; }
  }
}

export default function BackupPage() {
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("super_admin");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data } = await supabase
        .from("profiles")
        .select("mosque_id, role")
        .eq("id", user.id)
        .single();
      const userRole = isKnownRole(data?.role) ? data.role : "super_admin";
      if (!canAccess(userRole, "/dashboard/backup")) {
        window.location.href = defaultRoute(userRole);
        return;
      }
      setRole(userRole);
      if (data?.mosque_id) setMosqueId(data.mosque_id);
    };
    init().finally(() => setLoading(false));
  }, []);

  const modules = allowedModules(role);

  const handleExport = async (mod: ModuleKey, format: "json" | "csv") => {
    if (!mosqueId) return;
    setExporting(`${mod}-${format}`);
    try {
      const data = await fetchModuleData(mod, mosqueId);
      const filename = `${mod}-${new Date().toISOString().slice(0, 10)}`;
      format === "json" ? downloadJSON(`${filename}.json`, data) : downloadCSV(`${filename}.csv`, data);
    } finally { setExporting(null); }
  };

  const handleExportAll = async (format: "json" | "csv") => {
    if (!mosqueId) return;
    setExporting(`all-${format}`);
    try {
      const allData: Record<string, unknown[]> = {};
      for (const mod of modules) allData[mod] = await fetchModuleData(mod, mosqueId);
      const filename = `backup-masjid-${new Date().toISOString().slice(0, 10)}`;
      if (format === "json") {
        downloadJSON(`${filename}.json`, allData);
      } else {
        const lines: string[] = [];
        for (const mod of modules) {
          const rows = allData[mod] as Record<string, unknown>[];
          lines.push(`# ${MODULE_LABELS[mod]}`);
          if (rows.length > 0) {
            const headers = Object.keys(rows[0]);
            lines.push(headers.join(","));
            for (const row of rows)
              lines.push(headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(","));
          } else { lines.push("(tidak ada data)"); }
          lines.push("");
        }
        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${filename}.csv`; a.click();
        URL.revokeObjectURL(url);
      }
    } finally { setExporting(null); }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="h-10 w-56 bg-slate-800 rounded animate-pulse" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-bold text-emerald-400">Backup &amp; Export Data</h1>
            <p className="text-slate-400 mt-1">Export data masjid per modul dalam format JSON atau CSV.</p>
          </div>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Export Semua Modul</h2>
            <div className="flex gap-3">
              <button onClick={() => handleExportAll("json")} disabled={!!exporting}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-2 rounded font-semibold text-sm">
                {exporting === "all-json" ? "Mengekspor..." : "Export JSON"}
              </button>
              <button onClick={() => handleExportAll("csv")} disabled={!!exporting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded font-semibold text-sm">
                {exporting === "all-csv" ? "Mengekspor..." : "Export CSV"}
              </button>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Export per Modul</h2>
            <div className="flex flex-col gap-3">
              {modules.map((mod) => (
                <div key={mod} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3">
                  <span className="font-medium">{MODULE_LABELS[mod]}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleExport(mod, "json")} disabled={!!exporting}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-semibold">
                      {exporting === `${mod}-json` ? "..." : "JSON"}
                    </button>
                    <button onClick={() => handleExport(mod, "csv")} disabled={!!exporting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-semibold">
                      {exporting === `${mod}-csv` ? "..." : "CSV"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
