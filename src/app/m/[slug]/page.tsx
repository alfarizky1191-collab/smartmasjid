"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";
import { usePushNotification } from "@/hooks/usePushNotification";

const fetchPrayerTimes = async (city: string) => {
  const res = await fetch(
    `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=11`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error();
  return (await res.json())?.data?.timings || null;
};

// Islamic Geometric Pattern SVG Component for subtle background texture
function IslamicPatternBG() {
  return (
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic-star-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M30 0 L36 18 L54 18 L39 29 L45 47 L30 36 L15 47 L21 29 L6 18 L24 18 Z"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.2"
            />
            <circle cx="30" cy="30" r="4" fill="none" stroke="#fbbf24" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-star-pattern)" />
      </svg>
    </div>
  );
}

// Decorative Islamic Crescent & Star Icon
function CrescentIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 10 10 1.5 1.5 0 0 0-1.464-1.494A8.003 8.003 0 1 1 10.506 3.464 1.5 1.5 0 0 0 12 2Z" />
      <polygon points="18,5 19.3,8.4 23,8.4 20,10.6 21.2,14 18,11.8 14.8,14 16,10.6 13,8.4 16.7,8.4" />
    </svg>
  );
}

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

  const push = usePushNotification(mosque?.id);

  const [canShowNotifCard, setCanShowNotifCard] = useState(false);

  // SW registration and permission request
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("SW PWA registered on scope:", reg.scope);
          })
          .catch((err) => {
            console.error("SW PWA registration failed:", err);
          });
      }
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
      // Tampilkan banner jika Notification API tersedia (lebih lax dari PushManager)
      if ("Notification" in window) {
        setCanShowNotifCard(true);
      }
    }
  }, []);

  const showLocalNotification = (title: string, body: string) => {
    console.log("Attempting to show notification:", title, body);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration
            .showNotification(title, {
              body: body,
              icon: mosque?.logo_url || "/icons/icon-192.svg",
              badge: "/icons/icon-192.svg",
              vibrate: [100, 50, 100],
              tag: "smartmasjid-pwa-notification",
              renotify: true,
              data: { url: window.location.href },
            } as any)
            .catch((err) => {
              console.error("ServiceWorker showNotification failed:", err);
              new Notification(title, {
                body: body,
                icon: mosque?.logo_url || "/icons/icon-192.svg",
                tag: "smartmasjid-pwa-notification",
                data: { url: window.location.href },
              } as NotificationOptions);
            });
        })
        .catch((err) => {
          console.error("ServiceWorker ready failed:", err);
          new Notification(title, {
            body: body,
            icon: mosque?.logo_url || "/icons/icon-192.svg",
            tag: "smartmasjid-pwa-notification",
            data: { url: window.location.href },
          } as NotificationOptions);
        });
    } else {
      console.warn("Notification permission not granted or unsupported.");
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const triggeredRef = useRef<string | null>(null);

  const refreshPrayerTimes = useCallback(async (city: string) => {
    if (!city?.trim()) return;
    try {
      setPrayerTimes(await fetchPrayerTimes(city.trim()));
    } catch {
      setPrayerTimes(null);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
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
      if (mosqueData.iqomah_duration) setIqomahCountdown(mosqueData.iqomah_duration);
      const id = mosqueData.id;
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

      const [annRes, evRes, offRes, qrisRes, slidesRes] = await Promise.all([
        supabase
          .from("announcements")
          .select("*")
          .eq("mosque_id", id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("events")
          .select("*")
          .eq("mosque_id", id)
          .gte("event_date", today)
          .order("event_date", { ascending: true })
          .limit(3),
        supabase
          .from("officer_schedules")
          .select("role, officers(name)")
          .eq("mosque_id", id)
          .eq("schedule_date", today),
        supabase.from("qris_settings").select("image_url").eq("mosque_id", id).single(),
        supabase.from("slides").select("*").eq("mosque_id", id).order("created_at", { ascending: false }),
      ]);

      if (annRes.data) setAnnouncements(annRes.data);
      if (evRes.data) setEvents(evRes.data);
      if (offRes.data)
        setOfficers(offRes.data.map((d: any) => ({ role: d.role, name: d.officers?.name || "-" })));
      if (qrisRes.data?.image_url) setQrisUrl(qrisRes.data.image_url);
      if (slidesRes.data) setSlides(slidesRes.data);
      if (mosqueData.city) await refreshPrayerTimes(mosqueData.city);
    };
    load();
  }, [slug, refreshPrayerTimes]);

  // Realtime subscriptions for announcements and events
  useEffect(() => {
    if (!mosque?.id) return;
    const id = mosque.id;
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

    const annChannel = supabase
      .channel(`mobile-ann-realtime-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
          filter: `mosque_id=eq.${id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("announcements")
            .select("*")
            .eq("mosque_id", id)
            .order("created_at", { ascending: false })
            .limit(5);
          if (data) setAnnouncements(data);
          showLocalNotification("📢 Pengumuman Baru", payload.new.title);
        }
      )
      .subscribe();

    const evChannel = supabase
      .channel(`mobile-ev-realtime-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
          filter: `mosque_id=eq.${id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("events")
            .select("*")
            .eq("mosque_id", id)
            .gte("event_date", today)
            .order("event_date", { ascending: true })
            .limit(3);
          if (data) setEvents(data);
          showLocalNotification(
            "🗓️ Agenda Kegiatan Baru",
            `${payload.new.title}${payload.new.speaker ? " bersama " + payload.new.speaker : ""}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(annChannel);
      supabase.removeChannel(evChannel);
    };
  }, [mosque?.id]);

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setIsFriday(now.getDay() === 5);
      setTime(
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
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
        const d = new Date();
        d.setHours(h, m, 0, 0);
        if (d > now) {
          upcoming = { name: p.name, date: d };
          break;
        }
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
      setCountdown(
        `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(
          2,
          "0"
        )}`
      );
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
      const cur = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      let isAnyPrayerNow = false;
      for (const p of adzanList) {
        const key = `${p.name}-${cur}`;
        if (cur === p.time) {
          isAnyPrayerNow = true;
          if (triggeredRef.current !== key) {
            triggeredRef.current = key;
            setShowAdzan(true);
            setCurrentPrayer(p.name);
            setIqomahCountdown(mosque?.iqomah_duration || 300);

            // Trigger push notification for adzan
            showLocalNotification(
              `🕌 Waktu Shalat ${p.name} Tiba`,
              `Adzan berkumandang. Mari menunaikan shalat ${p.name} berjamaah di ${
                mosque?.name || "Masjid"
              }.`
            );

            if (audioRef.current) {
              audioRef.current.src = p.audio;
              audioRef.current.volume = 1;
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch((err) => {
                console.error("Gagal memutar adzan mobile:", err);
              });
            }
            setTimeout(() => setShowAdzan(false), 300000);
            break;
          }
        }
      }
      if (!isAnyPrayerNow) {
        triggeredRef.current = null;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [prayerTimes, mosque]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

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
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-6 text-center">
        <div className="bg-slate-900/80 border border-emerald-500/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
          <h1 className="text-6xl font-black text-amber-400 mb-4">404</h1>
          <p className="text-2xl font-bold text-slate-200 mb-2">Masjid Tidak Ditemukan</p>
          <p className="text-sm text-slate-400">Pastikan URL atau slug masjid yang Anda buka sudah benar.</p>
        </div>
      </main>
    );
  }

  if (!mosque) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-bold text-emerald-400 tracking-wide">Memuat SmartMasjid...</p>
        </div>
      </main>
    );
  }

  if (showPrayerMode) {
    return (
      <main className="min-h-screen w-full bg-black flex items-center justify-center text-center p-8">
        <p className="text-4xl sm:text-5xl font-black text-amber-300 tracking-wide leading-relaxed max-w-lg drop-shadow-lg">
          {mosque?.shaf_message || "Harap rapatkan dan luruskan barisan shaf sholat"}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Background Texture & Glow */}
      <IslamicPatternBG />
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md mx-auto min-h-screen p-4 sm:p-6 flex flex-col gap-5 pb-12">
        {/* HEADER SECTION */}
        <header className="bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-emerald-950/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-emerald-950/60 relative overflow-hidden">
          {/* Top Gold Ornament Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0" />

          {/* Bismillah Header */}
          <div className="text-center mb-3">
            <span className="text-amber-300 text-lg font-serif tracking-widest opacity-90">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </span>
          </div>

          <div className="flex items-center gap-4">
            {mosque.logo_url ? (
              <img
                src={mosque.logo_url}
                alt="Logo"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-amber-400/80 bg-slate-900 shadow-lg shadow-amber-500/20 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-amber-400/80 bg-emerald-900/60 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-lg shadow-amber-500/20">
                <CrescentIcon className="w-9 h-9" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-amber-300 leading-tight truncate drop-shadow-sm">
                {mosque.name}
              </h1>
              {(mosque.city || mosque.province) && (
                <p className="text-sm font-medium text-slate-300 mt-1 flex items-center gap-1">
                  <span>📍</span>
                  <span className="truncate">
                    {[mosque.city, mosque.province].filter(Boolean).join(", ")}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Clock & Date Banner */}
          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
            <div className="text-xs sm:text-sm font-semibold text-slate-300">
              {formatIndonesianDateWithDay(new Date())}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-wider tabular-nums drop-shadow-md">
              {time}
            </div>
          </div>
        </header>

        {/* PUSH NOTIFICATION PROMPT BUTTON */}
        {canShowNotifCard && (
          <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900/60 to-emerald-900/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xl flex-shrink-0">
                🔔
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-snug">Notifikasi Waktu Sholat</p>
                <p className="text-xs text-slate-300">
                  {push.isSubscribed ? "Notifikasi adzan & kegiatan aktif" : "Dapatkan info adzan & kegiatan masjid"}
                </p>
              </div>
            </div>

            {push.isSupported ? (
              <button
                onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
                disabled={push.isLoading || push.isDenied}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex-shrink-0 shadow-md ${
                  push.isSubscribed
                    ? "bg-slate-800 text-emerald-300 border border-emerald-500/40 hover:bg-slate-700"
                    : push.isDenied
                    ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/30 active:scale-95"
                }`}
              >
                {push.isLoading ? "Proses..." : push.isSubscribed ? "Aktif ✓" : push.isDenied ? "Ditolak" : "Aktifkan"}
              </button>
            ) : (
              <span className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex-shrink-0">
                Install PWA
              </span>
            )}
          </div>
        )}

        {/* JUMAT MUBARAK BANNER */}
        {isFriday && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 rounded-2xl p-4 text-center shadow-xl shadow-amber-500/20 border border-amber-300 relative overflow-hidden">
            <p className="text-lg font-black tracking-wide flex items-center justify-center gap-2">
              <span>🕌</span> JUMAT MUBARAK <span>✨</span>
            </p>
            <p className="text-xs sm:text-sm font-bold mt-1 opacity-90">
              Perbanyak Sholawat, Baca Surah Al-Kahfi & Datang Lebih Awal
            </p>
          </div>
        )}

        {/* MAIN COUNTDOWN / ADZAN DISPLAY CARD */}
        <div
          className={`rounded-3xl p-6 text-center transition-all duration-500 relative overflow-hidden shadow-2xl border ${
            showAdzan
              ? "bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 text-slate-950 border-amber-300 animate-pulse shadow-amber-500/40"
              : "bg-gradient-to-b from-emerald-900/90 via-slate-900/95 to-emerald-950/90 text-white border-emerald-500/40 backdrop-blur-xl shadow-emerald-950/80"
          }`}
        >
          {/* Subtle Arch Background */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-300 flex items-center justify-center gap-2">
            <span>✨</span>
            {showAdzan ? `WAKTU ADZAN ${currentPrayer}` : `MENUJUKAN ADZAN ${nextPrayer}`}
            <span>✨</span>
          </p>

          {/* Large Countdown Font for Mobile Readability */}
          <div className="my-3">
            <p className="text-5xl sm:text-6xl font-black tracking-wider font-mono text-amber-300 drop-shadow-lg tabular-nums">
              {countdown}
            </p>
          </div>

          {showAdzan && (
            <div className="mt-3 bg-slate-950/30 rounded-2xl p-3 border border-slate-950/40">
              <p className="text-base font-extrabold text-slate-950 animate-bounce">
                Hayya &apos;alash Shalah — 📵 Harap Matikan / Eningkan HP
              </p>
            </div>
          )}

          {/* Iqomah Counter */}
          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-center gap-3">
            <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
              Jeda Iqomah:
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-wide">
              {formatIqomah(iqomahCountdown)}
            </span>
          </div>
        </div>

        {/* JADWAL SHOLAT GRID (PROMINENT & LARGE FONT) */}
        {prayerTimes && (
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <CrescentIcon className="w-5 h-5 text-amber-400" />
              Jadwal Sholat Hari Ini
            </h2>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {prayers.map((p) => {
                const isNext = p.name === nextPrayer;
                return (
                  <div
                    key={p.name}
                    className={`rounded-2xl p-3.5 sm:p-4 text-center transition-all duration-300 border ${
                      isNext
                        ? "bg-gradient-to-b from-amber-500/20 via-slate-900 to-amber-950/30 border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]"
                        : "bg-slate-900/80 border-emerald-500/20 hover:border-emerald-500/40"
                    }`}
                  >
                    <p
                      className={`text-xs sm:text-sm font-extrabold uppercase tracking-wide ${
                        isNext ? "text-amber-300" : "text-emerald-400"
                      }`}
                    >
                      {p.name}
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-white mt-1 font-mono tracking-tight tabular-nums">
                      {p.time || "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SLIDER BANNER */}
        {slides.length > 0 && (
          <div className="rounded-3xl overflow-hidden h-52 sm:h-60 relative border border-emerald-500/30 shadow-xl">
            <img
              src={slides[currentSlide]?.image_url}
              alt="Slide"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            {slides.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentSlide ? "w-6 bg-amber-400" : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* DONASI QRIS SECTION */}
        {qrisUrl && (
          <div className="bg-gradient-to-b from-slate-900/90 to-emerald-950/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-5 flex flex-col items-center gap-4 text-center shadow-xl">
            <h2 className="text-lg font-extrabold text-amber-300 flex items-center gap-2">
              <span>💳</span> Infaq & Donasi Masjid
            </h2>
            <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-amber-400/60">
              <img src={qrisUrl} alt="QRIS Donasi" className="w-52 h-52 object-contain" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300 max-w-xs leading-relaxed">
              Scan kode QRIS di atas melalui mobile banking atau e-wallet (Gopay, OVO, Dana, ShopeePay) Anda.
            </p>
          </div>
        )}

        {/* PETUGAS HARI INI */}
        {officers.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-5 shadow-xl">
            <h2 className="text-base sm:text-lg font-extrabold text-amber-300 mb-3.5 flex items-center gap-2">
              <span>🕌</span> Petugas Sholat Hari Ini
            </h2>
            <div className="grid gap-2.5">
              {officers.map((o, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-950/70 border border-emerald-500/10 rounded-2xl px-4 py-3"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wide">
                    {o.role}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-100">{o.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JADWAL KEGIATAN */}
        {events.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-5 shadow-xl">
            <h2 className="text-base sm:text-lg font-extrabold text-amber-300 mb-3.5 flex items-center gap-2">
              <span>🗓️</span> Agenda & Kegiatan Masjid
            </h2>
            <div className="grid gap-3">
              {events.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
                  <p className="text-base sm:text-lg font-bold text-white">{item.title}</p>
                  {item.speaker && (
                    <p className="text-sm font-semibold text-emerald-300 mt-1">
                      🗣️ penceramah: {item.speaker}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm font-medium text-slate-400 mt-2 flex items-center gap-2">
                    <span>📅 {formatIndonesianDateWithDay(item.event_date)}</span>
                    <span>•</span>
                    <span>⏰ {item.event_time}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PENGUMUMAN */}
        {announcements.length > 0 && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-5 shadow-xl">
            <h2 className="text-base sm:text-lg font-extrabold text-amber-300 mb-3.5 flex items-center gap-2">
              <span>📢</span> Pengumuman Masjid
            </h2>
            <div className="grid gap-3">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-emerald-500/20 rounded-2xl p-4"
                >
                  <p className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                    {item.title}
                  </p>
                  {item.content && (
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-normal">
                      {item.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RUNNING TEXT */}
        {mosque.running_text && (
          <div className="overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/30 rounded-2xl py-3 shadow-lg">
            <div
              className="text-sm sm:text-base font-bold text-amber-300 whitespace-nowrap inline-block tracking-wide"
              style={{
                paddingLeft: "100%",
                animation: `marquee ${mosque.running_text_speed || 20}s linear infinite`,
              }}
            >
              {mosque.running_text}
            </div>
          </div>
        )}

        {/* FOOTER BRANDING */}
        <footer className="text-center pt-4 text-xs font-semibold text-slate-300 space-y-1">
          <p>SmartMasjid Mobile Portal</p>
          <p className="text-[11px] text-emerald-400/90 font-mono">
            {mosque.name} • {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      <audio ref={audioRef} src="/audio/adzan.mp3" />

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </main>
  );
}
