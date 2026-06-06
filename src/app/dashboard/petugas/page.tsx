"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/Adminsidebar";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";

interface Officer {
  id: string;
  name: string;
  phone: string;
  default_role: string;
  is_active: boolean;
}

interface Schedule {
  id: string;
  schedule_date: string;
  role: string;
  officer_id: string;
  officers?: { name: string };
}

export default function PetugasPage() {
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultRole, setDefaultRole] = useState("");

  // schedule form
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleRole, setScheduleRole] = useState("");
  const [scheduleOfficerId, setScheduleOfficerId] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data } = await supabase
        .from("profiles")
        .select("mosque_id")
        .eq("id", user.id)
        .single();
      if (data?.mosque_id) {
        setMosqueId(data.mosque_id);
        await loadOfficers(data.mosque_id);
        await loadSchedules(data.mosque_id);
      }
    };
    init().finally(() => setLoading(false));
  }, []);

  const loadOfficers = async (mid: string) => {
    const { data } = await supabase
      .from("officers")
      .select("*")
      .eq("mosque_id", mid)
      .order("created_at", { ascending: false });
    if (data) setOfficers(data);
  };

  const loadSchedules = async (mid: string) => {
    const { data } = await supabase
      .from("officer_schedules")
      .select("*, officers(name)")
      .eq("mosque_id", mid)
      .order("schedule_date", { ascending: true });
    if (data) setSchedules(data);
  };

  const addOfficer = async () => {
    if (!name.trim() || !mosqueId) { alert("Nama petugas wajib diisi"); return; }
    await supabase.from("officers").insert([{
      name, phone, default_role: defaultRole, mosque_id: mosqueId,
    }]);
    setName(""); setPhone(""); setDefaultRole("");
    await loadOfficers(mosqueId);
    alert("Petugas berhasil ditambah");
  };

  const deleteOfficer = async (id: string) => {
    if (!confirm("Hapus petugas ini?") || !mosqueId) return;
    await supabase.from("officers").delete().eq("id", id).eq("mosque_id", mosqueId);
    await loadOfficers(mosqueId);
    await loadSchedules(mosqueId);
  };

  const addSchedule = async () => {
    if (!scheduleDate || !scheduleRole || !scheduleOfficerId || !mosqueId) {
      alert("Lengkapi data jadwal"); return;
    }
    await supabase.from("officer_schedules").insert([{
      schedule_date: scheduleDate,
      role: scheduleRole,
      officer_id: scheduleOfficerId,
      mosque_id: mosqueId,
    }]);
    setScheduleDate(""); setScheduleRole(""); setScheduleOfficerId("");
    await loadSchedules(mosqueId);
    alert("Jadwal berhasil ditambah");
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Hapus jadwal ini?") || !mosqueId) return;
    await supabase.from("officer_schedules").delete().eq("id", id).eq("mosque_id", mosqueId);
    await loadSchedules(mosqueId);
  };

  const activeOfficers = officers.filter((o) => o.is_active);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="h-10 w-56 bg-slate-800 rounded animate-pulse" />
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-900 rounded-xl animate-pulse" />)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <h1 className="text-4xl font-bold text-emerald-400">Manajemen Petugas</h1>

          {/* ADD OFFICER */}
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Tambah Petugas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                placeholder="Nama"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                placeholder="No. HP"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                placeholder="Role default (imam/muadzin/khatib)"
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
              />
            </div>
            <button
              onClick={addOfficer}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded font-semibold"
            >
              Tambah
            </button>
          </section>

          {/* OFFICER LIST */}
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Daftar Petugas</h2>
            {officers.length === 0 ? (
              <p className="text-slate-400">Belum ada petugas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Nama</th>
                      <th className="py-2 px-3">HP</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.map((o) => (
                      <tr key={o.id} className="border-b border-slate-800">
                        <td className="py-2 px-3">{o.name}</td>
                        <td className="py-2 px-3">{o.phone || "-"}</td>
                        <td className="py-2 px-3">{o.default_role || "-"}</td>
                        <td className="py-2 px-3">
                          <span className={o.is_active ? "text-emerald-400" : "text-red-400"}>
                            {o.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => deleteOfficer(o.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ADD SCHEDULE */}
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Tambah Jadwal</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="date"
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
              <input
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                placeholder="Role (imam/muadzin/khatib)"
                value={scheduleRole}
                onChange={(e) => setScheduleRole(e.target.value)}
              />
              <select
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2"
                value={scheduleOfficerId}
                onChange={(e) => setScheduleOfficerId(e.target.value)}
              >
                <option value="">Pilih Petugas</option>
                {activeOfficers.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addSchedule}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded font-semibold"
            >
              Tambah Jadwal
            </button>
          </section>

          {/* SCHEDULE LIST */}
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Jadwal Petugas</h2>
            {schedules.length === 0 ? (
              <p className="text-slate-400">Belum ada jadwal.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Tanggal</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Petugas</th>
                      <th className="py-2 px-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((s) => (
                      <tr key={s.id} className="border-b border-slate-800">
                        <td className="py-2 px-3">{formatIndonesianDateWithDay(s.schedule_date)}</td>
                        <td className="py-2 px-3">{s.role}</td>
                        <td className="py-2 px-3">
                          {(s.officers as unknown as { name: string })?.name || "-"}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => deleteSchedule(s.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
