"use client";

/**
 * SmartMasjid Mobile — Home Screen
 *
 * Performance architecture:
 * - Clock/countdown runs in an isolated client island (ClockWidget)
 *   so the 1-second tick does NOT re-render the whole page.
 * - All display components are direct imports (no dynamic() splitting)
 *   so Tailwind styles are available immediately — no FOUC.
 * - next/image used for mosque logo and QRIS for lazy loading + CLS prevention.
 * - All data fetched in parallel via Promise.all.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFavoriteMosque } from "@/hooks/useFavoriteMosque";
import { usePushNotification } from "@/hooks/usePushNotification";

// ── Services ─────────────────────────────────────────────────────────────
import { getMosqueBySlug }            from "@/lib/mobile/mosque";
import { getAnnouncements }           from "@/lib/mobile/announcement";
import { getUpcomingEvents }          from "@/lib/mobile/event";
import { getTodayOfficers }           from "@/lib/mobile/officer";
import { getSlides, getQrisImageUrl } from "@/lib/mobile/slides";
import {
  fetchPrayerTimesForCity,
  buildSholatList,
  getNextPrayerCountdown,
  decoratePrayerList,
  formatIqomah,
} from "@/lib/mobile/prayer";

// ── Types ─────────────────────────────────────────────────────────────────
import type {
  MosqueRow,
  AnnouncementRow,
  EventRow,
  OfficerEntry,
  SlideRow,
  PrayerEntry,
} from "@/lib/mobile/types";

// ── Components — ALL direct imports so CSS is never delayed ──────────────
import MobileHeader     from "./components/mobile/MobileHeader";
import ClockWidget, { CountdownBar } from "./components/mobile/ClockWidget";
import PrayerCard       from "./components/mobile/PrayerCard";
import AnnouncementCard from "./components/mobile/AnnouncementCard";
import EventCard        from "./components/mobile/EventCard";
import QuickAction, { QuickActionItem } from "./components/mobile/QuickAction";
import SkeletonHome     from "./components/mobile/SkeletonHome";
import SlideShow        from "./components/mobile/SlideShow";
import RunningText      from "./components/mobile/RunningText";
import QrisCard         from "./components/mobile/QrisCard";
import OfficerStrip     from "./components/mobile/OfficerStrip";
import LocationCard     from "./components/mobile/LocationCard";
import ContactCard      from "./components/mobile/ContactCard";
import LiveTVButton     from "./components/mobile/LiveTVButton";
import PageTransition   from "./components/mobile/PageTransition";
import PullToRefresh    from "./components/mobile/PullToRefresh";

import { QrCode, MapPin, Clock, Tv2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type LoadState = "idle" | "loading" | "ready" | "error" | "not_found";

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AppHomePage() {
  const router = useRouter();
  const { state: favState, favorite, clearMosque } = useFavoriteMosque();

  // Redirect to select-mosque if no favorite mosque is set
  useEffect(() => {
    if (favState === "not_found") {
      router.replace("/app/select-mosque");
    }
  }, [favState, router]);

  const slug = favorite?.slug ?? "";

  const [loadState, setLoadState]         = useState<LoadState>("idle");
  const [mosque, setMosque]               = useState<MosqueRow | null>(null);
  const [prayers, setPrayers]             = useState<PrayerEntry[]>([]);
  const [syuruqTime, setSyuruqTime]       = useState("");
  const [prayerTimings, setPrayerTimings] = useState<Record<string, string> | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [events, setEvents]               = useState<EventRow[]>([]);
  const [officers, setOfficers]           = useState<OfficerEntry[]>([]);
  const [slides, setSlides]               = useState<SlideRow[]>([]);
  const [qrisUrl, setQrisUrl]             = useState<string | null>(null);

  const push = usePushNotification(mosque?.id);

  const [iqomahSecs, setIqomahSecs]           = useState(300);
  const [showAdzan, setShowAdzan]             = useState(false);
  const [currentPrayer, setCurrentPrayer]     = useState("");
  const [canShowNotifCard, setCanShowNotifCard] = useState(false);

  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const triggeredRef   = useRef<string | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);

  // audioUnlocked: true setelah user pernah tap halaman ini.
  // Di HP (iOS/Android), autoplay audio hanya diizinkan setelah interaksi user.
  // Persist di sessionStorage agar tidak reset saat user navigasi balik ke halaman ini.
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("sm_audio_unlocked") === "1";
  });
  const audioUnlockedRef = useRef(audioUnlocked);

  // Unlock audio context saat user pertama kali tap/klik halaman
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    sessionStorage.setItem("sm_audio_unlocked", "1");
    setAudioUnlocked(true);
    // Coba resume / buat AudioContext agar browser tahu ada interaksi
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch {
      // AudioContext tidak tersedia — tidak masalah
    }
    // Mainkan audio silent untuk "warm up" elemen audio di iOS Safari
    const el = audioRef.current;
    if (el) {
      el.muted = true;
      el.volume = 0;
      el.play().then(() => {
        el.pause();
        el.currentTime = 0;
        el.muted = false;
        el.volume = 1;
      }).catch(() => {
        el.muted = false;
        el.volume = 1;
      });
    }
  }, []);

  // Deteksi Notification API setelah mount — lebih lax daripada push.isSupported
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setCanShowNotifCard(true);
    }
  }, []);

  // Load prayer times helper
  const loadPrayerTimes = useCallback(async (city: string) => {
    const timings = await fetchPrayerTimesForCity(city);
    if (!timings) return;
    setPrayerTimings(timings);
    setPrayers(buildSholatList(timings));
    setSyuruqTime(timings.Sunrise ?? "");
  }, []);

  // Main data load — re-runs whenever the favorite mosque slug changes
  useEffect(() => {
    if (favState === "loading" || !slug) return;

    setLoadState("loading");

    // Reset state when switching mosques
    setMosque(null);
    setPrayers([]);
    setSyuruqTime("");
    setPrayerTimings(null);
    setAnnouncements([]);
    setEvents([]);
    setOfficers([]);
    setSlides([]);
    setQrisUrl(null);
    setShowAdzan(false);

    (async () => {
      try {
        const mosqueData = await getMosqueBySlug(slug);
        if (!mosqueData) { setLoadState("not_found"); return; }

        setMosque(mosqueData);
        if (mosqueData.iqomah_duration) setIqomahSecs(mosqueData.iqomah_duration as number);

        const id = mosqueData.id;

        const [ann, ev, off, sli, qris] = await Promise.all([
          getAnnouncements(id),
          getUpcomingEvents(id),
          getTodayOfficers(id),
          getSlides(id),
          getQrisImageUrl(id),
        ]);

        setAnnouncements(ann);
        setEvents(ev);
        setOfficers(off);
        setSlides(sli);
        setQrisUrl(qris);

        if (mosqueData.city) await loadPrayerTimes(mosqueData.city as string);

        setLoadState("ready");
      } catch {
        setLoadState("error");
      }
    })();
  }, [slug, favState, loadPrayerTimes]);

  // Auto adzan (same logic as TV Display)
  useEffect(() => {
    if (!prayerTimings) return;
    const list = [
      { name: "Subuh",   time: prayerTimings.Fajr,    audio: "/audio/adzan-subuh.mp3" },
      { name: "Dzuhur",  time: prayerTimings.Dhuhr,   audio: "/audio/adzan.mp3" },
      { name: "Ashar",   time: prayerTimings.Asr,     audio: "/audio/adzan.mp3" },
      { name: "Maghrib", time: prayerTimings.Maghrib, audio: "/audio/adzan.mp3" },
      { name: "Isya",    time: prayerTimings.Isha,    audio: "/audio/adzan.mp3" },
    ];
    const id = setInterval(() => {
      const cur = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
      for (const p of list) {
        const key = `${p.name}-${cur}`;
        if (cur === p.time && triggeredRef.current !== key) {
          triggeredRef.current = key;
          setShowAdzan(true);
          setCurrentPrayer(p.name);
          setIqomahSecs(mosque?.iqomah_duration ?? 300);

          // Gunakan audioRef yang sudah ada (bukan new Audio) agar
          // autoplay bekerja di HP setelah user pernah interaksi.
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.src = p.audio;
            audioRef.current.muted = false;
            audioRef.current.volume = 1;
            audioRef.current.play().catch(() => {});
          }

          setTimeout(() => setShowAdzan(false), 300_000);
          break;
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [prayerTimings, mosque]);

  // Iqomah countdown
  useEffect(() => {
    if (!showAdzan) return;
    const id = setInterval(() => setIqomahSecs((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(id);
  }, [showAdzan]);

  // Derived values
  const decoratedPrayers = decoratePrayerList(
    prayers,
    prayers.length > 0 ? getNextPrayerCountdown(prayers).name : ""
  );
  const locationText = [mosque?.city, mosque?.province].filter(Boolean).join(", ");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const announcementItems = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    createdAt: new Date(a.created_at).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    }),
  }));

  const eventItems = events.map((e) => ({
    id: e.id,
    title: e.title,
    speaker: e.speaker ?? undefined,
    eventDate: e.event_date,
    eventTime: e.event_time ?? undefined,
    isToday: e.event_date === today,
  }));

  const quickActions: QuickActionItem[] = [
    {
      id: "sholat",
      label: "Jadwal Sholat",
      sublabel: "Waktu sholat",
      icon: Clock,
      variant: "emerald",
      href: "/app/sholat",
    },
    {
      id: "donasi",
      label: "Donasi",
      sublabel: "Infaq & QRIS",
      icon: QrCode,
      variant: "yellow",
      href: "/app/donasi",
    },
    {
      id: "info",
      label: "Informasi",
      sublabel: "Pengumuman",
      icon: MapPin,
      variant: "purple",
      href: "/app/info",
    },
    {
      id: "tv",
      label: "TV Display",
      sublabel: "Layar masjid",
      icon: Tv2,
      variant: "blue",
      href: slug ? `/tv/${slug}` : "/app",
    },
  ];

  // ─── Render states ────────────────────────────────────────────────

  // Still reading localStorage or waiting for redirect
  if (favState === "loading" || favState === "not_found" || !slug) {
    return <SkeletonHome />;
  }

  if (loadState === "loading" || loadState === "idle") {
    return <SkeletonHome />;
  }

  if (loadState === "not_found") {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 text-center"
        style={{ background: "var(--pwa-bg)" }}
        role="alert"
      >
        <div className="text-5xl" role="img" aria-label="Sedih">😔</div>
        <h1 className="text-xl font-bold" style={{ color: "var(--pwa-text-primary)" }}>Masjid Tidak Ditemukan</h1>
        <p className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>
          Masjid dengan slug <span className="text-amber-400 font-mono">{slug}</span> tidak ditemukan di database.
        </p>
        <div className="rounded-xl px-4 py-3 mt-2 max-w-sm" style={{ background: "var(--pwa-bg-card)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "var(--pwa-text-secondary)" }}>
            Kemungkinan penyebab:
          </p>
          <ul className="text-xs text-left mt-2 space-y-1" style={{ color: "var(--pwa-text-muted)" }}>
            <li>• Masjid belum terdaftar atau dihapus</li>
            <li>• Slug berubah setelah update</li>
            <li>• Data lama tersimpan di perangkat</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={() => {
            clearMosque();
            router.replace("/app/select-mosque");
          }}
          className="mt-4 bg-emerald-500 text-black font-bold px-6 py-3 rounded-2xl active:bg-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label="Pilih masjid lain"
        >
          Pilih Masjid Lain
        </button>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-8 text-center"
        style={{ background: "var(--pwa-bg)" }}
        role="alert"
      >
        <div className="text-5xl" role="img" aria-label="Peringatan">⚠️</div>
        <h1 className="text-xl font-bold" style={{ color: "var(--pwa-text-primary)" }}>Gagal Memuat Data</h1>
        <p className="text-sm" style={{ color: "var(--pwa-text-muted)" }}>Periksa koneksi internet dan coba lagi.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 bg-emerald-500 text-black font-bold px-6 py-3 rounded-2xl active:bg-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          Coba Lagi
        </button>
      </main>
    );
  }

  // ─── Full home screen ─────────────────────────────────────────────

  return (
    <PageTransition variant="slide-up">
      <PullToRefresh onRefresh={async () => { window.location.reload(); }}>
    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
    <div
      className={`min-h-screen transition-colors duration-500 ${showAdzan ? "bg-yellow-950" : ""}`}
      style={!showAdzan ? { background: "var(--pwa-bg)" } : undefined}
      onClick={unlockAudio}
      onTouchStart={unlockAudio}
    >

      {/* ── Banner Aktifkan Suara Adzan (hilang setelah tap) ──────── */}
      {!audioUnlocked && (
        <div
          className="mx-4 mt-3 mb-1 flex items-center gap-3 bg-amber-500/15 border border-amber-400/40 rounded-2xl px-4 py-3 cursor-pointer"
          role="button"
          aria-label="Ketuk untuk aktifkan suara adzan"
          onClick={unlockAudio}
        >
          <span className="text-amber-300 text-xl shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-xs font-bold leading-snug">Ketuk di mana saja untuk aktifkan suara adzan</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Diperlukan sekali agar adzan otomatis berbunyi di HP</p>
          </div>
          <span className="text-amber-300 text-lg shrink-0">👆</span>
        </div>
      )}

      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <MobileHeader
        mosqueName={mosque?.name}
        logoUrl={mosque?.logo_url ?? undefined}
        location={locationText || undefined}
      />

      {/* ── 2. Hero — mosque identity + clock island ──────────────── */}
      <section
        className="relative overflow-hidden px-5 pt-7 pb-5 islamic-pattern-bg"
        aria-label="Informasi Masjid"
      >
        {/* Ambient gradient orbs */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-8 blur-3xl"
            style={{ background: "radial-gradient(circle, #d4af37, transparent)" }} />
        </div>

        {/* Clock island — only this re-renders every second */}
        <div className="relative z-10">
          <ClockWidget
            prayers={prayers}
            iqomahSecs={iqomahSecs}
            showAdzan={showAdzan}
            currentPrayer={currentPrayer}
          />
        </div>
      </section>

      {/* ── 3. Countdown bar ──────────────────────────────────────── */}
      <div className="mt-4 mb-5">
        <CountdownBar
          prayers={prayers}
          iqomahSecs={iqomahSecs}
          showAdzan={showAdzan}
          currentPrayer={currentPrayer}
        />
      </div>

      {/* ── Push Notification Card ───────────────────────────────── */}
      {canShowNotifCard && (
        <div
          className="mx-5 mb-5 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-premium"
          style={{
            background: "rgba(16,185,129,0.06)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-amber-300 text-2xl shrink-0"
              style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}
            >
              🔔
            </div>
            <div>
              <p className="text-base font-bold leading-snug" style={{ color: "var(--pwa-text-primary)" }}>
                Notifikasi Waktu Sholat
              </p>
              <p className="text-sm mt-0.5" style={{ color: "var(--pwa-text-secondary)" }}>
                {push.isSubscribed ? "Notifikasi adzan & kegiatan aktif" : "Dapatkan info adzan & kegiatan masjid"}
              </p>
            </div>
          </div>

          {push.isSupported ? (
            <button
              onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
              disabled={push.isLoading || push.isDenied}
              className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 shrink-0 active:scale-95 ${
                push.isSubscribed
                  ? "bg-slate-800 text-emerald-300 border border-emerald-500/40"
                  : push.isDenied
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "text-slate-950 active:scale-95"
              }`}
              style={!push.isSubscribed && !push.isDenied ? {
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
              } : undefined}
            >
              {push.isLoading ? "Proses..." : push.isSubscribed ? "Aktif ✓" : push.isDenied ? "Ditolak" : "Aktifkan"}
            </button>
          ) : (
            <span
              className="px-4 py-3 rounded-2xl text-xs font-bold shrink-0"
              style={{
                background: "rgba(148,163,184,0.1)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "var(--pwa-text-muted)",
              }}
            >
              Install PWA
            </span>
          )}
        </div>
      )}

      {/* ── 4. Quick actions ──────────────────────────────────────── */}
      <div className="mb-6">
        <QuickAction actions={quickActions} />
      </div>

      {/* ── 5. Prayer grid ────────────────────────────────────────── */}
      {prayers.length > 0 && (
        <div className="mb-6">
          <PrayerCard prayers={decoratedPrayers} syuruqTime={syuruqTime} />
        </div>
      )}

      {/* ── 6. Slide show ─────────────────────────────────────────── */}
      {slides.length > 0 && (
        <div className="mb-6">
          <SlideShow slides={slides} />
        </div>
      )}

      {/* ── 7. Officers ───────────────────────────────────────────── */}
      <div className="mb-6">
        <OfficerStrip officers={officers} />
      </div>

      {/* ── 8. Announcements ──────────────────────────────────────── */}
      <div className="mb-6">
        <AnnouncementCard announcements={announcementItems} />
      </div>

      {/* ── 9. Events ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <EventCard events={eventItems} />
      </div>

      {/* ── 10. Running text ──────────────────────────────────────── */}
      {mosque?.running_text && (
        <RunningText text={mosque.running_text} speed={mosque.running_text_speed ?? 20} />
      )}

      {/* ── 11. QRIS ──────────────────────────────────────────────── */}
      {qrisUrl && (
        <div id="section-qris" className="mb-6">
          <QrisCard imageUrl={qrisUrl} mosqueName={mosque?.name} />
        </div>
      )}

      {/* ── 12. Location ──────────────────────────────────────────── */}
      <div id="section-location" className="mb-6">
        <LocationCard
          address={mosque?.address ?? null}
          city={mosque?.city ?? null}
          province={mosque?.province ?? null}
          mosqueName={mosque?.name}
        />
      </div>

      {/* ── 13. Contact ───────────────────────────────────────────── */}
      <div id="section-contact" className="mb-6">
        <ContactCard
          phone={mosque?.phone ?? null}
          whatsapp={mosque?.whatsapp ?? null}
          website={mosque?.website ?? null}
          email={mosque?.email ?? null}
        />
      </div>

      {/* ── 14. Live TV button ────────────────────────────────────── */}
      {mosque?.slug && (
        <div className="mb-6">
          <LiveTVButton slug={mosque.slug} />
        </div>
      )}

      {/* Hidden audio — muted attr diperlukan agar iOS mengizinkan warm-up play() sebelum interaksi */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/audio/adzan.mp3" aria-hidden="true" muted playsInline />

      <div className="h-24" aria-hidden="true" />
    </div>
      </PullToRefresh>
    </PageTransition>
  );
}
