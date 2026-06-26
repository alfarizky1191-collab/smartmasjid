"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";

const fetchPrayerTimes = async (city: string) => {
  const res = await fetch(
    `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=11`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error();
  return (await res.json())?.data?.timings || null;
};

export default function MosqueLandingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [mosque, setMosque] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [officers, setOfficers] = useState<{ role: string; name: string }[]>([]);
  const [qrisUrl, setQrisUrl] = useState("");
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);

  const [time, setTime] = useState("");
  const [isFriday, setIsFriday] = useState(false);
  const [nextPrayer, setNextPrayer] = useState("");
  const [countdown, setCountdown] = useState("");
  const [iqomahCountdown, setIqomahCountdown] = useState(300);
  const [showAdzan, setShowAdzan] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState("");
  const [showPrayerMode, setShowPrayerMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triggeredRef = useRef<string | null>(null);

  const refreshPrayerTimes = useCallback(async (city: string) => {
    if (!city?.trim()) return;
    try { setPrayerTimes(await fetchPrayerTimes(city.trim())); }
    catch { setPrayerTimes(null); }
  }, []);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const { data: mosqueData, error } = await supabase
        .from("mosques").select("*").eq("slug", slug).single();
      if (error || !mosqueData) { setNotFound(true); return; }
      setMosque(mosqueData);
      if (mosqueData.iqomah_duration) setIqomahCountdown(mosqueData.iqomah_duration);
      const id = mosqueData.id;
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

      const [annRes, evRes, offRes, qrisRes, slidesRes] = await Promise.all([
        supabase.from("announcements").select("*").eq("mosque_id", id).order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("*").eq("mosque_id", id).gte("event_date", today).order("event_date", { ascending: true }).limit(3),
        supabase.from("officer_schedules").select("role, officers(name)").eq("mosque_id", id).eq("schedule_date", today),
        supabase.from("qris_settings").select("image_url").eq("mosque_id", id).single(),
        supabase.from("slides").select("*").eq("mosque_id", id).order("created_at", { ascending: false }),
      ]);

      if (annRes.data) setAnnouncements(annRes.data);
      if (evRes.data) setEvents(evRes.data);
      if (offRes.data) setOfficers(offRes.data.map((d: any) => ({ role: d.role, name: d.officers?.name || "-" })));
      if (qrisRes.data?.image_url) setQrisUrl(qrisRes.data.image_url);
      if (slidesRes.data) setSlides(slidesRes.data);
      if (mosqueData.city) await refreshPrayerTimes(mosqueData.city);
    };
    load();
  }, [slug, refreshPrayerTimes]);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setIsFriday(now.getDay() === 5);
      setTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto slide
  useEffect(() => {
    if (slides.length === 0) return;
    const id = setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const isRamadhan = new Date().toLocaleDateString("en-TN-u-ca-islamic").includes("Ramadan");
  const prayers = [
    ...(isRamadhan ? [{ name: "Imsak", time: prayerTimes?.Imsak }] : []),
    { name: "Subuh", time: prayerTimes?.Fajr },
    { name: "Dzuhur", time: prayerTimes?.Dhuhr },
    { name: "Ashar", time: prayerTimes?.Asr },
    { name: "Maghrib", time: prayerTimes?.Maghrib },
    { name: "Isya", time: prayerTimes?.Isha },
  ];

  // Countdown
  useEffect(() => {
    if (!prayerTimes) return;
    const update = () => {
      const now = new Date();
      let upcoming: { name: string; date: Date } | null = null;
      for (const p of prayers) {
        if (!p.time) continue;
        const [h, m] = p.time.split(":").map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0);
        if (d > now) { upcoming = { name: p.name, date: d }; break; }
      }
      if (!upcoming && prayers[0]?.time) {
        const [h, m] = prayers[0].time.split(":").map(Number);
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(h, m, 0, 0);
        upcoming = { name: prayers[0].name, date: tomorrow };
      }
      if (!upcoming) return;
      const total = Math.floor((upcoming.date.getTime() - now.getTime()) / 1000);
      const hrs = Math.floor(total / 3600);
      const mins = Math.floor((total % 3600) / 60);
      const secs = total % 60;
      setNextPrayer(upcoming.name);
      setCountdown(`${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [prayerTimes]);

  // Auto adzan
  useEffect(() => {
    if (!prayerTimes) return;
    const adzanList = [
      { name: "Subuh", time: prayerTimes.Fajr, audio: "/audio/adzan-subuh.mp3" },
      { name: "Dzuhur", time: prayerTimes.Dhuhr, audio: "/audio/adzan.mp3" },
      { name: "Ashar", time: prayerTimes.Asr, audio: "/audio/adzan.mp3" },
      { name: "Maghrib", time: prayerTimes.Maghrib, audio: "/audio/adzan.mp3" },
      { name: "Isya", time: prayerTimes.Isha, audio: "/audio/adzan.mp3" },
    ];
    const id = setInterval(() => {
      const cur = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
      for (const p of adzanList) {
        const key = `${p.name}-${cur}`;
        if (cur === p.time && triggeredRef.current !== key) {
          triggeredRef.current = key;
          setShowAdzan(true);
          setCurrentPrayer(p.name);
          setIqomahCountdown(mosque?.iqomah_duration || 300);
          const audio = new Audio(p.audio);
          audioRef.current = audio;
          audio.play();
          setTimeout(() => setShowAdzan(false), 300000);
          break;
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [prayerTimes, mosque]);

  // Iqomah countdown
  useEffect(() => {
    if (!showAdzan) return;
    const id = setInterval(() => {
      setIqomahCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setShowPrayerMode(true);
          setTimeout(() => setShowPrayerMode(false), 600000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showAdzan]);

  const formatIqomah = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

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

  return (
    <main className={`min-h-screen p-4 flex flex-col gap-4 transition-all duration-500 ${showAdzan ? "bg-yellow-950" : "bg-black"} text-white`}>

      {/* HEADER */}
      <div className="flex items-center gap-3">
        {mosque.logo_url && (
          <img src={mosque.logo_url} alt="Logo" className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 bg-white flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-emerald-400 truncate">{mosque.name}</h1>
          {(mosque.city || mosque.province) && (
            <p className="text-sm text-slate-300">{[mosque.city, mosque.province].filter(Boolean).join(", ")}</p>
          )}
        </div>
        <div className="text-2xl font-bold tabular-nums flex-shrink-0">{time}</div>
      </div>

      {/* JUMAT BANNER */}
      {isFriday && (
        <div className="bg-yellow-400 text-black rounded-2xl p-3 text-center">
          <p className="text-lg font-bold">🕌 JUMAT MUBARAK</p>
          <p className="text-sm mt-1">Perbanyak Sholawat & Datang Lebih Awal</p>
        </div>
      )}

      {/* COUNTDOWN / ADZAN */}
      <div className={`rounded-2xl p-5 text-center transition-all duration-500 ${showAdzan ? "bg-yellow-400 text-black animate-pulse" : "bg-emerald-500 text-black"}`}>
        {showPrayerMode ? (
          <div className="py-3">
            <p className="text-xl font-bold">🕌 SHOLAT SEDANG BERLANGSUNG</p>
            <p className="text-base mt-2">Mohon Tenang & Matikan HP</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold">
              {showAdzan ? `🕌 ADZAN ${currentPrayer}` : `Adzan ${nextPrayer} dalam`}
            </p>
            <p className="text-5xl font-bold mt-1 tabular-nums">{countdown}</p>
            {showAdzan && (
              <p className="text-base font-bold mt-2 animate-bounce">Hayya &apos;alash Shalah — 📵 Matikan HP</p>
            )}
            <div className="mt-2">
              <p className="text-xs font-bold">IQOMAH</p>
              <p className="text-2xl font-bold">{formatIqomah(iqomahCountdown)}</p>
            </div>
          </>
        )}
      </div>

      {/* JADWAL SHOLAT */}
      {prayerTimes && (
        <div className="grid grid-cols-3 gap-2">
          {prayers.map((p) => (
            <div key={p.name} className="bg-slate-900 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-400 font-bold">{p.name}</p>
              <p className="text-lg font-bold mt-1 tabular-nums">{p.time || "-"}</p>
            </div>
          ))}
        </div>
      )}

      {/* SLIDER */}
      {slides.length > 0 && (
        <div className="rounded-2xl overflow-hidden h-48 relative">
          <img src={slides[currentSlide]?.image_url} alt="Slide" className="w-full h-full object-cover" />
          {slides.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {slides.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === currentSlide ? "bg-emerald-400" : "bg-white/40"}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* QRIS */}
      {qrisUrl && (
        <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center gap-3">
          <h2 className="text-lg font-bold text-emerald-400">Donasi Masjid</h2>
          <img src={qrisUrl} alt="QRIS" className="w-48 rounded-2xl border-2 border-emerald-400" />
          <p className="text-sm text-slate-300 text-center">Scan QRIS untuk infaq & donasi masjid</p>
        </div>
      )}

      {/* PETUGAS HARI INI */}
      {officers.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <h2 className="text-base font-bold text-emerald-400 mb-3">Petugas Hari Ini</h2>
          <div className="flex flex-col gap-2">
            {officers.map((o, i) => (
              <div key={i} className="flex justify-between bg-slate-800 rounded-xl px-4 py-2">
                <span className="text-sm font-semibold text-yellow-400 capitalize">{o.role}</span>
                <span className="text-sm">{o.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JADWAL KEGIATAN */}
      {events.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <h2 className="text-base font-bold text-emerald-400 mb-3">Jadwal Kegiatan</h2>
          <div className="flex flex-col gap-2">
            {events.map((item) => (
              <div key={item.id} className="bg-slate-800 rounded-xl p-3">
                <p className="text-base font-bold">{item.title}</p>
                {item.speaker && <p className="text-sm text-slate-300 mt-1">{item.speaker}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  {formatIndonesianDateWithDay(item.event_date)} • {item.event_time}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENGUMUMAN */}
      {announcements.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <h2 className="text-base font-bold text-emerald-400 mb-3">Pengumuman</h2>
          <div className="flex flex-col gap-2">
            {announcements.map((item) => (
              <div key={item.id} className="bg-slate-800 rounded-xl p-3">
                <p className="text-sm font-bold text-center">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RUNNING TEXT */}
      {mosque.running_text && (
        <div className="overflow-hidden bg-slate-900 rounded-2xl py-3">
          <div
            className="text-base font-bold text-emerald-400 whitespace-nowrap inline-block"
            style={{
              paddingLeft: "100%",
              animation: `marquee ${mosque.running_text_speed || 20}s linear infinite`,
            }}
          >
            {mosque.running_text}
          </div>
        </div>
      )}

      <audio ref={audioRef} src="/audio/adzan.mp3" />

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </main>
  );
}
