"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";

export default function MosqueLandingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [mosque, setMosque] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [officers, setOfficers] = useState<{ role: string; name: string }[]>([]);
  const [qrisUrl, setQrisUrl] = useState("");
  const [prayerTimes, setPrayerTimes] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      // Load mosque by slug
      const { data: mosqueData, error } = await supabase
        .from("mosques")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !mosqueData) {
        setNotFound(true);
        return;
      }

      setMosque(mosqueData);
      const mosqueId = mosqueData.id;

      // Announcements
      const { data: annData } = await supabase
        .from("announcements")
        .select("*")
        .eq("mosque_id", mosqueId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (annData) setAnnouncements(annData);

      // Events (upcoming)
      const today = new Date().toISOString().split("T")[0];
      const { data: evData } = await supabase
        .from("events")
        .select("*")
        .eq("mosque_id", mosqueId)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(3);
      if (evData) setEvents(evData);

      // Petugas hari ini
      const { data: offData } = await supabase
        .from("officer_schedules")
        .select("role, officers(name)")
        .eq("mosque_id", mosqueId)
        .eq("schedule_date", today);
      if (offData) {
        setOfficers(offData.map((d: any) => ({ role: d.role, name: d.officers?.name || "-" })));
      }

      // QRIS
      const { data: qrisData } = await supabase
        .from("qris_settings")
        .select("image_url")
        .eq("mosque_id", mosqueId)
        .single();
      if (qrisData?.image_url) setQrisUrl(qrisData.image_url);

      // Prayer times from Aladhan
      try {
        const city = typeof mosqueData.city === "string" ? mosqueData.city.trim() : "";
        if (city) {
          const res = await fetch(
            `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=11`,
            { cache: "no-store" }
          );
          const result = await res.json();
          setPrayerTimes(result.data.timings);
        } else {
          setPrayerTimes(null);
        }
      } catch { /* offline fallback: no prayer times */ }
    };

    load();
  }, [slug]);

  if (notFound) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-400 mb-4">404</h1>
          <p className="text-xl text-slate-400">Masjid tidak ditemukan</p>
        </div>
      </main>
    );
  }

  if (!mosque) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p className="text-xl text-slate-400">Memuat...</p>
      </main>
    );
  }

  const prayerList = prayerTimes
    ? [
        { name: "Subuh", time: prayerTimes.Fajr },
        { name: "Dzuhur", time: prayerTimes.Dhuhr },
        { name: "Ashar", time: prayerTimes.Asr },
        { name: "Maghrib", time: prayerTimes.Maghrib },
        { name: "Isya", time: prayerTimes.Isha },
      ]
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 py-10 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {mosque.logo_url && (
            <img src={mosque.logo_url} alt="Logo" className="w-20 h-20 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">{mosque.name}</h1>
            <div className="mt-2 text-slate-400">
              {mosque.address && <p>{mosque.address}</p>}
              {(mosque.city || mosque.province) && (
                <p>{[mosque.city, mosque.province].filter(Boolean).join(", ")}</p>
              )}
            </div>
            {mosque.tagline && (
              <p className="mt-3 text-slate-300 italic">&ldquo;{mosque.tagline}&rdquo;</p>
            )}
          </div>
        </div>
      </header>

      {/* STATS STRIP */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-400">{announcements.length}</p>
            <p className="text-xs text-slate-400">Pengumuman</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{events.length}</p>
            <p className="text-xs text-slate-400">Event Mendatang</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{officers.length}</p>
            <p className="text-xs text-slate-400">Petugas Hari Ini</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* JADWAL SHOLAT */}
        {prayerList.length > 0 && (
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-bold text-emerald-400 mb-4">Jadwal Sholat</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {prayerList.map((p) => (
                <div key={p.name} className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-sm text-slate-400">{p.name}</p>
                  <p className="text-lg font-bold">{p.time}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PETUGAS HARI INI */}
        {officers.length > 0 && (
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-bold text-emerald-400 mb-4">Petugas Hari Ini</h2>
            <div className="flex flex-col gap-2">
              {officers.map((o, i) => (
                <div key={i} className="flex justify-between bg-slate-800 rounded-lg px-4 py-3">
                  <span className="text-yellow-400 capitalize font-medium">{o.role}</span>
                  <span>{o.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PENGUMUMAN */}
        {announcements.length > 0 && (
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-bold text-emerald-400 mb-4">Pengumuman</h2>
            <ul className="flex flex-col gap-3">
              {announcements.map((a) => (
                <li key={a.id} className="bg-slate-800 rounded-lg px-4 py-3">
                  {a.title}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* KEGIATAN */}
        {events.length > 0 && (
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-bold text-emerald-400 mb-4">Kegiatan Mendatang</h2>
            <div className="flex flex-col gap-3">
              {events.map((e) => (
                <div key={e.id} className="bg-slate-800 rounded-lg px-4 py-3">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-sm text-slate-400 mt-1">
                      {formatIndonesianDateWithDay(e.event_date)} • {e.event_time}
                    {e.speaker && ` • ${e.speaker}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* QRIS DONASI */}
        {qrisUrl && (
          <section className="bg-gradient-to-b from-emerald-900/30 to-slate-900 border border-emerald-800/50 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Donasi via QRIS</h2>
            <p className="text-slate-400 text-sm mb-4">Scan QR code di bawah untuk berdonasi</p>
            <img src={qrisUrl} alt="QRIS" className="mx-auto max-w-[280px] rounded-lg border border-slate-700" />
            <p className="mt-4 text-xs text-slate-500">Semoga menjadi amal jariyah</p>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <footer className="text-center py-6 text-slate-600 text-sm">
        SmartMasjid
      </footer>
    </main>
  );
}
