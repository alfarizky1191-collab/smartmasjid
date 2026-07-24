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
import Image from "next/image";
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

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const triggeredRef = useRef<string | null>(null);

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
          const audio = new Audio(p.audio);
          audioRef.current = audio;
          audio.play().catch(() => {});
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
    <div className={`min-h-screen transition-colors duration-500 ${showAdzan ? "bg-yellow-950" : ""}`}
      style={!showAdzan ? { background: "var(--pwa-bg)" } : undefined}
    >

      {/* ── 1. Header ─────────────────────────────────────────────── */}
      <MobileHeader
        mosqueName={mosque?.name}
        logoUrl={mosque?.logo_url ?? undefined}
        location={locationText || undefined}
      />

      {/* ── 2. Hero — mosque identity + clock island ──────────────── */}
      <section className="relative overflow-hidden px-5 pt-6 pb-5" aria-label="Informasi Masjid">
        {/* Ambient orbs — decorative only */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-emerald-500/5 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full bg-yellow-500/5 blur-2xl" />
        </div>

        {/* Mosque identity */}
        <div className="relative z-10 flex items-center gap-4 mb-5">
          {mosque?.logo_url ? (
            <Image
              src={mosque.logo_url}
              alt={`Logo ${mosque.name}`}
              width={56}
              height={56}
              className="rounded-2xl object-cover border-2 border-emerald-400 shrink-0"
              priority
              unoptimized={mosque.logo_url.startsWith("http")}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 border-2 border-emerald-400/60 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="text-2xl">🕌</span>
            </div>
          )}

          <div>
            <h1 className="text-xl font-extrabold leading-tight" style={{ color: "var(--pwa-text-primary)" }}>{mosque?.name}</h1>
            {mosque?.tagline && (
              <p className="text-xs mt-0.5 italic leading-snug" style={{ color: "var(--pwa-text-muted)" }}>{mosque.tagline}</p>
            )}
            {locationText && (
              <p className="text-xs text-emerald-400 font-medium mt-0.5">{locationText}</p>
            )}
          </div>
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
      <div className="mt-1 mb-4">
        <CountdownBar
          prayers={prayers}
          iqomahSecs={iqomahSecs}
          showAdzan={showAdzan}
          currentPrayer={currentPrayer}
        />
      </div>

      {/* ── Push Notification Card ───────────────────────────────── */}
      {canShowNotifCard && (
        <div className="mx-4 sm:mx-5 mb-5 bg-gradient-to-r from-emerald-900/40 via-slate-900/60 to-emerald-900/40 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-xl shrink-0">
              🔔
            </div>
            <div>
              <p className="text-sm font-bold leading-snug" style={{ color: "var(--pwa-text-primary)" }}>Notifikasi Waktu Sholat</p>
              <p className="text-xs" style={{ color: "var(--pwa-text-secondary)" }}>
                {push.isSubscribed ? "Notifikasi adzan & kegiatan aktif" : "Dapatkan info adzan & kegiatan masjid"}
              </p>
            </div>
          </div>

          {push.isSupported ? (
            <button
              onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
              disabled={push.isLoading || push.isDenied}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shrink-0 shadow-md ${
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
            <span className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
              Install PWA
            </span>
          )}
        </div>
      )}

      {/* ── 4. Quick actions ──────────────────────────────────────── */}
      <QuickAction actions={quickActions} />

      {/* ── 5. Prayer grid ────────────────────────────────────────── */}
      {prayers.length > 0 && (
        <div className="mt-5">
          <PrayerCard prayers={decoratedPrayers} syuruqTime={syuruqTime} />
        </div>
      )}

      {/* ── 6. Slide show ─────────────────────────────────────────── */}
      {slides.length > 0 && <SlideShow slides={slides} />}

      {/* ── 7. Officers ───────────────────────────────────────────── */}
      <OfficerStrip officers={officers} />

      {/* ── 8. Announcements ──────────────────────────────────────── */}
      <div className="mt-5">
        <AnnouncementCard announcements={announcementItems} />
      </div>

      {/* ── 9. Events ─────────────────────────────────────────────── */}
      <div className="mt-5">
        <EventCard events={eventItems} />
      </div>

      {/* ── 10. Running text ──────────────────────────────────────── */}
      {mosque?.running_text && (
        <RunningText text={mosque.running_text} speed={mosque.running_text_speed ?? 20} />
      )}

      {/* ── 11. QRIS ──────────────────────────────────────────────── */}
      {qrisUrl && (
        <div id="section-qris">
          <QrisCard imageUrl={qrisUrl} mosqueName={mosque?.name} />
        </div>
      )}

      {/* ── 12. Location ──────────────────────────────────────────── */}
      <div id="section-location">
        <LocationCard
          address={mosque?.address ?? null}
          city={mosque?.city ?? null}
          province={mosque?.province ?? null}
          mosqueName={mosque?.name}
        />
      </div>

      {/* ── 13. Contact ───────────────────────────────────────────── */}
      <div id="section-contact">
        <ContactCard
          phone={mosque?.phone ?? null}
          whatsapp={mosque?.whatsapp ?? null}
          website={mosque?.website ?? null}
          email={mosque?.email ?? null}
        />
      </div>

      {/* ── 14. Live TV button ────────────────────────────────────── */}
      {mosque?.slug && <LiveTVButton slug={mosque.slug} />}

      {/* Hidden audio */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/audio/adzan.mp3" aria-hidden="true" />

      <div className="h-8" aria-hidden="true" />
    </div>
      </PullToRefresh>
    </PageTransition>
  );
}
