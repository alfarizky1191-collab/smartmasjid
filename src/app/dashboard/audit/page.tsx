"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/Adminsidebar";
import { supabase } from "@/lib/supabase/client";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { canAccess, defaultRoute, isKnownRole, type Role } from "@/lib/rbac";

type AuditLog = {
  id: string;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
  role: string;
  action: string;
  module: string;
  ip_address: string | null;
  mosques?: { name: string | null } | { name: string | null }[] | null;
};

type Profile = {
  mosque_id: string;
  role: Role;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function nextDate(date: string) {
  const start = new Date(`${date}T00:00:00+07:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function mosqueName(log: AuditLog) {
  if (Array.isArray(log.mosques)) return log.mosques[0]?.name || "-";
  return log.mosques?.name || "-";
}

export default function AuditTrailPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  const loadLogs = async (activeProfile: Profile) => {
    setLoading(true);

    let query = supabase
      .from("audit_logs")
      .select("id, created_at, user_email, user_name, role, action, module, ip_address, mosques(name)")
      .eq("mosque_id", activeProfile.mosque_id)
      .order("created_at", { ascending: false })
      .limit(250);

    if (dateFilter) {
      const { start, end } = nextDate(dateFilter);
      query = query.gte("created_at", start).lt("created_at", end);
    }

    if (moduleFilter) query = query.eq("module", moduleFilter);
    if (actionFilter) query = query.eq("action", actionFilter);

    const { data, error } = await query;

    if (!error && data) {
      setLogs(data as AuditLog[]);
    } else if (error) {
      console.warn("Audit logs fetch failed", error.message);
      setLogs([]);
    }

    setLoading(false);
  };

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
      if (!canAccess(userRole, "/dashboard/audit") || !["super_admin", "admin_masjid"].includes(userRole)) {
        window.location.href = defaultRoute(userRole);
        return;
      }

      if (!data?.mosque_id) {
        setLoading(false);
        return;
      }

      const activeProfile = { mosque_id: data.mosque_id, role: userRole };
      setProfile(activeProfile);
      await loadLogs(activeProfile);
    };

    init();
  }, []);

  useEffect(() => {
    if (profile) loadLogs(profile);
  }, [dateFilter, moduleFilter, actionFilter]);

  const filteredLogs = useMemo(() => {
    const search = userFilter.trim().toLowerCase();
    if (!search) return logs;

    return logs.filter((log) =>
      (log.user_name || "").toLowerCase().includes(search) ||
      (log.user_email || "").toLowerCase().includes(search)
    );
  }, [logs, userFilter]);

  const resetFilters = () => {
    setDateFilter("");
    setModuleFilter("");
    setActionFilter("");
    setUserFilter("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      <AdminSidebar />

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-bold text-emerald-400">Audit Trail</h1>
            <p className="text-slate-400 mt-1">
              Riwayat aktivitas penting pengguna terautentikasi.
            </p>
          </div>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Tanggal</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Module</span>
                <select
                  value={moduleFilter}
                  onChange={(event) => setModuleFilter(event.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                >
                  <option value="">Semua module</option>
                  {AUDIT_MODULES.map((module) => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Action</span>
                <select
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                >
                  <option value="">Semua action</option>
                  {AUDIT_ACTIONS.map((action) => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">User</span>
                <input
                  value={userFilter}
                  onChange={(event) => setUserFilter(event.target.value)}
                  placeholder="Nama atau email"
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                />
              </label>
            </div>

            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-slate-400">
                {loading ? "Memuat audit..." : `${filteredLogs.length} aktivitas ditampilkan`}
              </p>
              <button
                onClick={resetFilters}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Reset Filter
              </button>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Timestamp</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                    <th className="px-4 py-3 font-semibold">Module</th>
                    <th className="px-4 py-3 font-semibold">Mosque</th>
                    <th className="px-4 py-3 font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Memuat data audit...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Belum ada aktivitas yang cocok dengan filter.
                      </td>
                    </tr>
                  )}

                  {!loading && filteredLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-800 hover:bg-slate-800/60">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="px-4 py-3 min-w-56">
                        <div className="font-medium">{log.user_name || "-"}</div>
                        <div className="text-xs text-slate-400">{log.user_email || "-"}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">{log.role}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">{log.module}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">{mosqueName(log)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">{log.ip_address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
