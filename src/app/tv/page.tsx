"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";
import {
  Clock,
  MapPin,
  Maximize2,
  Volume2,
  VolumeX,
  Bell,
  CalendarDays,
  UsersRound,
  Megaphone,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MosqueLookup = {
  id: string | null;
  slug: string | null;
  isReady: boolean;
  error: string | null;
};

type MosqueData = {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  logo_url: string | null;
  running_text: string | null;
  running_text_speed: number | null;
  iqomah_duration: number | null;
  adzan_url: string | null;
  adzan_subuh_url: string | null;
  alarm_url: string | null;
  [key: string]: unknown;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCATION_FALLBACK = "Lokasi belum diatur";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const trimText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getLocationLabel = (mosque: MosqueData | null) => {
  const location = [mosque?.city, mosque?.province].filter(Boolean);
  return location.length > 0 ? location.join(", ") : LOCATION_FALLBACK;
};

const getTvSlugFromPath = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "tv" && parts[1] ? decodeURIComponent(parts[1]) : "";
};

const getParam = (params: URLSearchParams, key: string) =>
  params.get(key)?.trim() || "";

const fetchPrayerTimesForCity = async (city: string) => {
  const response = await fetch(
    `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=11`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error("Gagal memuat jadwal sholat");
  const result = await response.json();
  return result?.data?.timings || null;
};

const padTwo = (n: number) => String(n).padStart(2, "0");

const formatIqomah = (seconds: number) =>
  `${padTwo(Math.floor(seconds / 60))}:${padTwo(seconds % 60)}`;

// Geometric ornament SVG for Islamic aesthetic
function GeomOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true">
      <path d="M100 10 L190 55 L190 145 L100 190 L10 145 L10 55 Z" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      <path d="M100 35 L165 70 L165 130 L100 165 L35 130 L35 70 Z" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <path d="M100 60 L140 82 L140 118 L100 140 L60 118 L60 82 Z" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <circle cx="100" cy="100" r="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <circle cx="100" cy="100" r="3" fill="currentColor" opacity="0.3" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <circle key={deg} cx={100 + 55 * Math.cos(a)} cy={100 + 55 * Math.sin(a)} r="2.5" fill="currentColor" opacity="0.25" />
        );
      })}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TVPage() {

  // ── Mosque resolution ──────────────────────────────────────────────────────
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [mosqueLookup, setMosqueLookup] = useState<MosqueLookup>({
    id: null, slug: null, isReady: false, error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const resolve = async () => {
      try {
        localStorage.removeItem("mosque");
        localStorage.removeItem("prayerTimes");
        const params = new URLSearchParams(window.location.search);
        const mosqueParam = getParam(params, "mosque");
        const idParam = getParam(params, "mosque_id") || getParam(params, "id");
        const pathSlug = getTvSlugFromPath(window.location.pathname);
        const slugParam =
          pathSlug ||
          getParam(params, "slug") ||
          getParam(params, "mosque_slug") ||
          (!idParam && mosqueParam && !UUID_PATTERN.test(mosqueParam) ? mosqueParam : "");
        const idFromParam =
          idParam || (mosqueParam && UUID_PATTERN.test(mosqueParam) ? mosqueParam : "");

        if (slugParam) {
          const { data, error } = await supabase
            .from("mosques").select("id, slug").eq("slug", slugParam).maybeSingle();
          if (!isMounted) return;
          if (error || !data?.id) {
            setMosqueId(null);
            setMosqueLookup({ id: null, slug: slugParam, isReady: true, error: "Masjid dengan slug ini tidak ditemukan." });
            return;
          }
          setMosqueId(data.id);
          setMosqueLookup({ id: data.id, slug: data.slug || slugParam, isReady: true, error: null });
          return;
        }
        if (idFromParam) {
          setMosqueId(idFromParam);
          setMosqueLookup({ id: idFromParam, slug: null, isReady: true, error: null });
          return;
        }
        setMosqueId(null);
        setMosqueLookup({ id: null, slug: null, isReady: true, error: "Masjid tidak ditemukan. Gunakan /tv/[slug] atau /tv?slug=slug-masjid." });
      } catch (err) {
        console.error("Gagal membaca URL TV Display", err);
        if (!isMounted) return;
        setMosqueLookup({ id: null, slug: null, isReady: true, error: "Gagal memuat data masjid." });
      }
    };
    resolve();
    return () => { isMounted = false; };
  }, []);

  // ── Core state ────────────────────────────────────────────────────────────
  const [time, setTime] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [mosque, setMosque] = useState<MosqueData | null>(null);
  const [tvLoadError, setTvLoadError] = useState("");
  const [announcements, setAnnouncements] = useState<Record<string, unknown>[]>([]);
  const [currentAnnIdx, setCurrentAnnIdx] = useState(0);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string> | null>(null);
  const [nextPrayer, setNextPrayer] = useState("");
  const [countdown, setCountdown] = useState("");
  const [showAdzan, setShowAdzan] = useState(false);
  const [currentPrayer, setCurrentPrayer] = useState("");
  const [autoAdzanEnabled, setAutoAdzanEnabled] = useState(true);
  const [iqomahCountdown, setIqomahCountdown] = useState(300);
  const [showIqomahMode, setShowIqomahMode] = useState(false);
  const [showPrayerMode, setShowPrayerMode] = useState(false);
  const [isAdzanPlaying, setIsAdzanPlaying] = useState(false);
  const [isIqomah, setIsIqomah] = useState(false);
  const [qrisUrl, setQrisUrl] = useState("");
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [todayOfficers, setTodayOfficers] = useState<{ role: string; name: string }[]>([]);
  const [slides, setSlides] = useState<Record<string, unknown>[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideVisible, setSlideVisible] = useState(true);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const triggeredRef = useRef<string | null>(null);


  // ── refreshPrayerTimes ────────────────────────────────────────────────────
  const refreshPrayerTimes = useCallback(async (cityValue: unknown) => {
    const city = trimText(cityValue);
    if (!city) { setPrayerTimes(null); setNextPrayer(""); setCountdown(""); return; }
    try {
      const timings = await fetchPrayerTimesForCity(city);
      setPrayerTimes(timings);
    } catch (err) {
      console.error("Gagal memuat jadwal sholat", err);
      setPrayerTimes(null);
    }
  }, []);

  // ── Prayer list (Ramadhan-aware, includes Syuruq) ─────────────────────────
  const isRamadhan = new Date().toLocaleDateString("en-TN-u-ca-islamic").includes("Ramadan");

  const prayers = [
    ...(isRamadhan ? [{ name: "Imsak", time: prayerTimes?.Imsak ?? null }] : []),
    { name: "Subuh",   time: prayerTimes?.Fajr    ?? null },
    { name: "Syuruq",  time: prayerTimes?.Sunrise  ?? null },
    { name: "Dzuhur",  time: prayerTimes?.Dhuhr   ?? null },
    { name: "Ashar",   time: prayerTimes?.Asr     ?? null },
    { name: "Maghrib", time: prayerTimes?.Maghrib  ?? null },
    { name: "Isya",    time: prayerTimes?.Isha    ?? null },
  ];

  // Prayers that trigger adzan (Syuruq and Imsak do NOT)
  const adzanPrayers = [
    { name: "Subuh",   time: prayerTimes?.Fajr,    audio: (mosque?.adzan_subuh_url as string) || "/audio/adzan-subuh.mp3" },
    { name: "Dzuhur",  time: prayerTimes?.Dhuhr,   audio: (mosque?.adzan_url as string) || "/audio/adzan.mp3" },
    { name: "Ashar",   time: prayerTimes?.Asr,     audio: (mosque?.adzan_url as string) || "/audio/adzan.mp3" },
    { name: "Maghrib", time: prayerTimes?.Maghrib,  audio: (mosque?.adzan_url as string) || "/audio/adzan.mp3" },
    { name: "Isya",    time: prayerTimes?.Isha,    audio: (mosque?.adzan_url as string) || "/audio/adzan.mp3" },
  ];

  // ── Clock effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDateLabel(now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Data fetching + realtime ───────────────────────────────────────────────
  useEffect(() => {
    if (!mosqueId) return;

    const loadEvents = async () => {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      const { data } = await supabase
        .from("events").select("*").eq("mosque_id", mosqueId)
        .gte("event_date", today).order("event_date", { ascending: true }).limit(3);
      if (data) setEvents(data);
    };

    const loadTodayOfficers = async () => {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      const { data } = await supabase
        .from("officer_schedules").select("role, officers(name)")
        .eq("mosque_id", mosqueId).eq("schedule_date", today);
      if (data)
        setTodayOfficers(data.map((d: Record<string, unknown>) => ({
          role: d.role as string,
          name: (d.officers as Record<string, string> | null)?.name || "-",
        })));
    };

    const loadQris = async () => {
      const { data } = await supabase
        .from("qris_settings").select("*").eq("mosque_id", mosqueId).single();
      if (data?.image_url) setQrisUrl(data.image_url as string);
    };

    const fetchData = async () => {
      try {
        setMosque(null); setAnnouncements([]); setPrayerTimes(null);
        setNextPrayer(""); setCountdown(""); setQrisUrl("");
        setEvents([]); setTodayOfficers([]); setSlides([]); setTvLoadError("");

        await Promise.all([loadQris(), loadEvents(), loadTodayOfficers()]);

        const { data: mosqueData, error: mosqueError } = await supabase
          .from("mosques").select("*").eq("id", mosqueId).single();
        if (mosqueError || !mosqueData) { setTvLoadError("Data masjid tidak ditemukan."); return; }

        setMosque(mosqueData as MosqueData);
        if (mosqueData.iqomah_duration) setIqomahCountdown(mosqueData.iqomah_duration as number);
        await refreshPrayerTimes(mosqueData.city);

        const { data: slidesData } = await supabase
          .from("slides").select("*").eq("mosque_id", mosqueId).order("created_at", { ascending: false });
        if (slidesData) setSlides(slidesData);

        const { data: annData } = await supabase
          .from("announcements").select("*").eq("mosque_id", mosqueId).order("created_at", { ascending: false });
        if (annData) setAnnouncements(annData);
      } catch (err) {
        console.error("Gagal memuat data TV Display", err);
        setTvLoadError("Gagal memuat data TV Display.");
      }
    };

    fetchData();

    const mosqueChannel = supabase
      .channel(`mosque-realtime-${mosqueId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mosques", filter: `id=eq.${mosqueId}` },
        async () => {
          const { data } = await supabase.from("mosques").select("*").eq("id", mosqueId).single();
          if (data) {
            setMosque(data as MosqueData);
            setMosqueLookup((c) => ({ ...c, id: data.id, slug: (data.slug as string) || c.slug }));
            if (data.iqomah_duration) setIqomahCountdown(data.iqomah_duration as number);
            await refreshPrayerTimes(data.city);
          }
        })
      .subscribe();

    const announcementChannel = supabase
      .channel(`announcement-realtime-${mosqueId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements", filter: `mosque_id=eq.${mosqueId}` },
        async () => {
          const { data } = await supabase.from("announcements").select("*").eq("mosque_id", mosqueId).order("created_at", { ascending: false });
          if (data) setAnnouncements(data);
        })
      .subscribe();

    const eventChannel = supabase
      .channel(`event-realtime-${mosqueId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `mosque_id=eq.${mosqueId}` },
        () => loadEvents())
      .subscribe();

    const officerChannel = supabase
      .channel(`officer-realtime-${mosqueId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "officer_schedules", filter: `mosque_id=eq.${mosqueId}` },
        () => loadTodayOfficers())
      .on("postgres_changes", { event: "*", schema: "public", table: "officers", filter: `mosque_id=eq.${mosqueId}` },
        () => loadTodayOfficers())
      .subscribe();

    return () => {
      supabase.removeChannel(mosqueChannel);
      supabase.removeChannel(announcementChannel);
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(officerChannel);
    };
  }, [mosqueId, refreshPrayerTimes]);

  // ── Auto-refresh prayer times at midnight ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 1) {
        await refreshPrayerTimes(mosque?.city);
      }
    }, 60000);
    return () => clearInterval(id);
  }, [mosque, refreshPrayerTimes]);



  // ── Slide crossfade ───────────────────────────────────────────────────────
  useEffect(() => {
    if (slides.length === 0) return;
    const id = setInterval(() => {
      setSlideVisible(false);
      setTimeout(() => {
        setCurrentSlide((p) => (p + 1) % slides.length);
        setSlideVisible(true);
      }, 600);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  // ── Announcement rotation ─────────────────────────────────────────────────
  useEffect(() => {
    if (announcements.length <= 1) return;
    const id = setInterval(() => {
      setCurrentAnnIdx((p) => (p + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(id);
  }, [announcements.length]);

  // ── Prayer countdown ──────────────────────────────────────────────────────
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
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(h, m, 0, 0);
        upcoming = { name: prayers[0].name, date: tomorrow };
      }
      if (!upcoming) return;
      const total = Math.floor((upcoming.date.getTime() - now.getTime()) / 1000);
      const hrs = Math.floor(total / 3600);
      const mins = Math.floor((total % 3600) / 60);
      const secs = total % 60;
      setNextPrayer(upcoming.name);
      setCountdown(`${padTwo(hrs)}:${padTwo(mins)}:${padTwo(secs)}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [prayerTimes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto adzan ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!prayerTimes || !autoAdzanEnabled) return;
    const id = setInterval(() => {
      if (isAdzanPlaying || isIqomah) return;
      const now = new Date();
      const cur = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
      for (const p of adzanPrayers) {
        const key = `${p.name}-${cur}`;
        if (cur === p.time && triggeredRef.current !== key) {
          triggeredRef.current = key;
          setShowAdzan(true);
          setCurrentPrayer(p.name);
          setIsAdzanPlaying(true);
          setIqomahCountdown((mosque?.iqomah_duration as number) || 300);
          const audio = new Audio(p.audio);
          audioRef.current = audio;
          audio.play();
          audio.onended = () => {
            setShowAdzan(false);
            setIsAdzanPlaying(false);
            setIsIqomah(true);
            setShowIqomahMode(true);
            setIqomahCountdown((mosque?.iqomah_duration as number) || 300);
          };
          break;
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [prayerTimes, autoAdzanEnabled, mosque, isAdzanPlaying, isIqomah]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Iqomah countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!showIqomahMode) return;
    const id = setInterval(() => {
      setIqomahCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setShowIqomahMode(false);
          setIsIqomah(false);
          setShowPrayerMode(true);
          setTimeout(() => setShowPrayerMode(false), 600000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showIqomahMode]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const stopAdzan = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setShowAdzan(false);
    setIsAdzanPlaying(false);
    triggeredRef.current = null;
  };

  const goFullscreen = () => document.documentElement.requestFullscreen();



  // ── Loading / error guards ────────────────────────────────────────────────
  if (!mosqueLookup.isReady) {
    return (
      <main className="min-h-screen bg-emerald-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Memuat data masjid...</p>
        </div>
      </main>
    );
  }

  if (!mosqueId) {
    return (
      <main className="min-h-screen bg-emerald-900 flex items-center justify-center px-6 text-center">
        <div className="text-white">
          <p className="text-6xl mb-6">🕌</p>
          <p className="text-2xl font-bold">{mosqueLookup.error || "Masjid tidak ditemukan."}</p>
        </div>
      </main>
    );
  }

  if (tvLoadError) {
    return (
      <main className="min-h-screen bg-emerald-900 flex items-center justify-center px-6 text-center">
        <p className="text-white text-2xl">{tvLoadError}</p>
      </main>
    );
  }

  if (!mosque) {
    return (
      <main className="min-h-screen bg-emerald-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Memuat TV Display...</p>
        </div>
      </main>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const currentAnnouncement = announcements[currentAnnIdx] ?? null;

  return (
    <main className="w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 text-slate-900 select-none relative">

      {/* ══ GEOMETRIC ORNAMENTS ══════════════════════════════════════════════ */}
      <GeomOrnament className="absolute -top-20 -left-20 w-72 h-72 text-emerald-200/40 pointer-events-none" />
      <GeomOrnament className="absolute -bottom-20 -right-20 w-80 h-80 text-emerald-200/40 pointer-events-none" />

      {/* ══ ADZAN OVERLAY ════════════════════════════════════════════════════ */}
      {showAdzan && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 text-white"
          style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)" }}>
          <GeomOrnament className="absolute inset-0 w-full h-full text-white/5 pointer-events-none" />
          {/* Gold top bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="relative text-center">
            <div className="text-[#D4AF37] text-lg font-semibold uppercase tracking-[0.3em] mb-4">
              Allahu Akbar — Hayya &apos;alash Shalah
            </div>
            <h1 className="text-7xl font-black mb-2">ADZAN {currentPrayer.toUpperCase()}</h1>
            <p className="text-2xl text-emerald-200 mt-2">📵 Mohon tenang — matikan / silent-kan ponsel Anda</p>
          </div>

          <div className="mt-4 bg-white/10 backdrop-blur rounded-2xl px-10 py-4 text-center border border-white/20">
            <p className="text-sm text-emerald-200 font-medium mb-1">Iqomah dalam</p>
            <p className="text-5xl font-black tabular-nums text-[#D4AF37]">{formatIqomah(iqomahCountdown)}</p>
          </div>

          <button onClick={stopAdzan}
            className="mt-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors">
            Stop Adzan
          </button>

          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>
      )}

      {/* ══ IQOMAH MODE OVERLAY ══════════════════════════════════════════════ */}
      {showIqomahMode && !showAdzan && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 text-white"
          style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 60%, #1d4ed8 100%)" }}>
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <GeomOrnament className="absolute inset-0 w-full h-full text-white/5 pointer-events-none" />

          <div className="text-center">
            <p className="text-[#D4AF37] text-lg font-semibold uppercase tracking-widest mb-4">Bersiap untuk Sholat</p>
            <h1 className="text-6xl font-black mb-2">IQOMAH {currentPrayer.toUpperCase()}</h1>
            <p className="text-2xl text-blue-200 mt-2">Luruskan dan rapatkan shaf Anda</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-16 py-6 text-center border border-white/20">
            <p className="text-base text-blue-200 font-medium mb-2">Iqomah berlangsung dalam</p>
            <p className="text-8xl font-black tabular-nums text-white">{formatIqomah(iqomahCountdown)}</p>
          </div>

          <p className="text-xl text-blue-200">📵 Matikan / Silent-kan Ponsel Anda</p>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>
      )}

      {/* ══ SHOLAT MODE OVERLAY ══════════════════════════════════════════════ */}
      {showPrayerMode && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 text-white"
          style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }}>
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <GeomOrnament className="absolute inset-0 w-full h-full text-white/5 pointer-events-none" />
          <p className="text-[#D4AF37] text-lg font-semibold uppercase tracking-widest">Sholat Berjamaah</p>
          <h1 className="text-6xl font-black text-center">SHOLAT SEDANG BERLANGSUNG</h1>
          <div className="flex flex-col items-center gap-3 mt-4">
            <p className="text-3xl text-emerald-200">Luruskan dan Rapatkan Shaf</p>
            <p className="text-2xl text-emerald-300">Matikan / Silent-kan Ponsel Anda</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>
      )}



      {/* ══ MAIN LAYOUT ══════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full h-full flex flex-col">

        {/* ── GOLD TOP LINE ── */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shrink-0" />

        {/* ── HEADER BAR ── */}
        <div className="shrink-0 flex items-center justify-between px-8 py-3 bg-white/80 backdrop-blur-sm border-b border-emerald-100 shadow-sm">
          {/* Mosque identity */}
          <div className="flex items-center gap-4">
            {mosque.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={String(mosque.logo_url)}
                alt="Logo Masjid"
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-200 shadow-md shrink-0 bg-white"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center shrink-0">
                <span className="text-emerald-600 font-black text-xl">M</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                {String(mosque.name ?? "")}
              </h1>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-500" strokeWidth={2} />
                {String((mosque.address as string | null) || getLocationLabel(mosque))}
              </p>
            </div>
          </div>

          {/* Date + time */}
          <div className="text-right shrink-0">
            <p className="text-sm text-slate-500 font-medium">{dateLabel}</p>
            <p className="text-4xl font-black text-emerald-700 tabular-nums tracking-tight flex items-center gap-2 justify-end">
              <Clock className="w-7 h-7 text-emerald-400" strokeWidth={2} />
              {time}
            </p>
          </div>
        </div>

        {/* ── BODY: LEFT COLUMN + RIGHT CONTENT ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ═══ LEFT: PRAYER TIMES + CONTROLS ══════════════════════════════ */}
          <div className="shrink-0 flex flex-col bg-gradient-to-b from-emerald-700 to-emerald-800 text-white relative overflow-hidden"
            style={{ width: "23%" }}>

            {/* Ornament */}
            <GeomOrnament className="absolute -top-10 -right-10 w-48 h-48 text-white/10 pointer-events-none" />

            {/* Section label */}
            <div className="px-5 pt-4 pb-2 shrink-0">
              <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Jadwal Sholat</p>
            </div>

            {/* Prayer rows */}
            <div className="flex-1 flex flex-col justify-center px-4 gap-1 overflow-hidden">
              {prayers.map((p) => {
                const isNext = p.name === nextPrayer;
                const isSyuruq = p.name === "Syuruq";
                return (
                  <div
                    key={p.name}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 ${
                      isNext
                        ? "bg-[#D4AF37] text-slate-900 shadow-lg"
                        : isSyuruq
                        ? "bg-white/5 border border-white/10"
                        : "bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    <span className={`text-sm font-bold ${isNext ? "text-slate-900" : isSyuruq ? "text-yellow-200" : "text-white"}`}>
                      {p.name}
                    </span>
                    <span className={`text-xl font-black tabular-nums ${isNext ? "text-slate-900" : "text-white"}`}>
                      {p.time ?? "--:--"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="px-4 pb-4 pt-2 flex flex-col gap-2 shrink-0">
              <div className="h-px bg-white/20 mb-1" />
              <button onClick={goFullscreen}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs text-white px-3 py-2 rounded-lg transition-colors">
                <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
              </button>
              <button
                onClick={() => setAutoAdzanEnabled((v) => !v)}
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors ${
                  autoAdzanEnabled ? "bg-emerald-500/40 text-emerald-100 hover:bg-emerald-500/60" : "bg-white/10 text-white/50 hover:bg-white/20"
                }`}
              >
                {autoAdzanEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                Auto Adzan {autoAdzanEnabled ? "ON" : "OFF"}
              </button>
              <button onClick={() => audioRef.current?.play()}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs text-white px-3 py-2 rounded-lg transition-colors">
                <Bell className="w-3.5 h-3.5" /> Test Adzan
              </button>
              <button onClick={() => alarmRef.current?.play()}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-xs text-white px-3 py-2 rounded-lg transition-colors">
                <Bell className="w-3.5 h-3.5 text-yellow-300" /> Test Alarm
              </button>
            </div>
          </div>



          {/* ═══ RIGHT: MAIN CONTENT ═════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* ── COUNTDOWN BAR ── */}
            <div className="shrink-0 flex items-center justify-between px-6 py-2.5 bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-100">Menuju {String(nextPrayer)}</span>
                <span className="text-3xl font-black tabular-nums">{String(countdown)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-100">Iqomah</span>
                <span className={`text-2xl font-black tabular-nums ${showIqomahMode ? "text-[#D4AF37] animate-pulse" : "text-white"}`}>
                  {String(formatIqomah(iqomahCountdown))}
                </span>
              </div>
            </div>

            {/* ── MAIN CONTENT AREA ── */}
            <div className="flex-1 flex overflow-hidden min-h-0">

              {/* Slides panel */}
              {slides.length > 0 && (
                <div className="relative overflow-hidden flex-1 min-h-0 min-w-0">
                  {/* Crossfade slide */}
                  <img
                    src={String(slides[currentSlide]?.image_url ?? "")}
                    alt="Slide"
                    className="w-full h-full object-cover absolute inset-0 transition-opacity duration-700"
                    style={{ opacity: slideVisible ? 1 : 0 }}
                  />
                  {/* Slide dots */}
                  {slides.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {slides.map((_, i) => (
                        <div key={i} className={`rounded-full transition-all ${i === currentSlide ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
                      ))}
                    </div>
                  )}
                  {/* Announcement overlay on slide */}
                  {currentAnnouncement && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Megaphone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={2} />
                        <p className="text-white text-base font-semibold leading-snug line-clamp-2">
                          {String(currentAnnouncement.title ?? "")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info panels: events, officers, announcements (when no slides or alongside) */}
              <div className={`flex flex-col gap-0 overflow-hidden ${slides.length > 0 ? "w-64 shrink-0 border-l border-emerald-100 bg-white/70 backdrop-blur-sm" : "flex-1"}`}>

                {/* Announcements (no-slide mode: show list) */}
                {slides.length === 0 && announcements.length > 0 && (
                  <div className="px-5 py-4 border-b border-emerald-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Megaphone className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Pengumuman</p>
                    </div>
                    <div className="space-y-2">
                      {announcements.slice(0, 3).map((a) => (
                        <div key={String(a.id)} className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-2">{String(a.title ?? "")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Slide-mode: rotating announcement */}
                {slides.length > 0 && announcements.length > 1 && (
                  <div className="px-4 py-3 border-b border-emerald-100 shrink-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Pengumuman</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 line-clamp-3">{String(currentAnnouncement?.title ?? "")}</p>
                    {announcements.length > 1 && (
                      <p className="text-[10px] text-slate-400 mt-1">{currentAnnIdx + 1} / {announcements.length}</p>
                    )}
                  </div>
                )}

                {/* Upcoming events */}
                {events.length > 0 && (
                  <div className={`${slides.length > 0 ? "px-4 py-3" : "px-5 py-4"} border-b border-emerald-100`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Agenda</p>
                    </div>
                    <div className="space-y-2">
                      {events.slice(0, slides.length > 0 ? 2 : 3).map((e) => (
                        <div key={String(e.id)} className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                          <p className={`font-bold text-slate-900 line-clamp-1 ${slides.length > 0 ? "text-xs" : "text-sm"}`}>
                            {String(e.title ?? "")}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            {formatIndonesianDateWithDay(String(e.event_date ?? ""))} • {String(e.event_time ?? "")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Today's officers */}
                {todayOfficers.length > 0 && (
                  <div className={`${slides.length > 0 ? "px-4 py-3" : "px-5 py-4"}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <UsersRound className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Petugas Hari Ini</p>
                    </div>
                    <div className="space-y-1.5">
                      {todayOfficers.map((o, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                          <span className={`font-semibold text-emerald-700 capitalize ${slides.length > 0 ? "text-[10px]" : "text-xs"}`}>{o.role}</span>
                          <span className={`text-slate-700 font-medium ${slides.length > 0 ? "text-[10px]" : "text-xs"}`}>{o.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state when no content at all */}
                {slides.length === 0 && announcements.length === 0 && events.length === 0 && todayOfficers.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-400 text-sm">Tidak ada informasi untuk ditampilkan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── RUNNING TEXT ── */}
            {mosque.running_text && (
              <div className="shrink-0 bg-emerald-700 py-2 px-4 overflow-hidden border-t border-emerald-600">
                <div
                  className="text-sm font-semibold text-white whitespace-nowrap inline-block"
                  style={{
                    paddingLeft: "100%",
                    animation: `marquee ${(mosque.running_text_speed as number) || 20}s linear infinite`,
                  }}
                >
                  ✦ {String(mosque.running_text)} ✦
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── GOLD BOTTOM LINE ── */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shrink-0" />
      </div>

      {/* ── Hidden audio elements ── */}
      <audio ref={audioRef} src={String(mosque.adzan_url || "/audio/adzan.mp3")} />
      <audio ref={alarmRef} src={String(mosque.alarm_url || "/audio/alarm.wav")} />

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </main>
  );
}
