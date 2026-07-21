"use client";

/**
 * SmartMasjid Mobile — Info Page (/app/info)
 *
 * Tabs:
 *  1. Pengumuman (Announcements)
 *  2. Kegiatan   (Events)
 *  3. Galeri     (Slides)
 *  4. Teks Berjalan (Running Text)
 *
 * Features: pull-to-refresh, skeleton loading, empty states, error states,
 *            page transition, safe area, accessibility.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Megaphone, CalendarDays, Image as ImageIcon,
  ScrollText, RefreshCw, Clock, User, MapPin
} from "lucide-react";

import { useFavoriteMosque }  from "@/hooks/useFavoriteMosque";
import { getMosqueBySlug }    from "@/lib/mobile/mosque";
import { getAnnouncements }   from "@/lib/mobile/announcement";
import { getUpcomingEvents }  from "@/lib/mobile/event";
import { getSlides }          from "@/lib/mobile/slides";
import type {
  MosqueRow, AnnouncementRow, EventRow, SlideRow,
} from "@/lib/mobile/types";

import { SkeletonInfo }  from "../components/mobile/Skeleton";
import EmptyState        from "../components/mobile/EmptyState";
import ErrorState        from "../components/mobile/ErrorState";
import PullToRefresh     from "../components/mobile/PullToRefresh";
import PageTransition    from "../components/mobile/PageTransition";

// ─── Types ─────────────────────────────────────────────────────────────────

type Tab       = "pengumuman" | "kegiatan" | "galeri" | "running";
type LoadState = "idle" | "loading" | "ready" | "error";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "pengumuman", label: "Pengumuman",   icon: <Megaphone     size={14} strokeWidth={2} /> },
  { id: "kegiatan",   label: "Kegiatan",     icon: <CalendarDays  size={14} strokeWidth={2} /> },
  { id: "galeri",     label: "Galeri",       icon: <ImageIcon     size={14} strokeWidth={2} /> },
  { id: "running",    label: "Running Text", icon: <ScrollText    size={14} strokeWidth={2} /> },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function InfoPage() {
  const router = useRouter();
  const { state: favState, favorite } = useFavoriteMosque();

  const [loadState,      setLoadState]      = useState<LoadState>("idle");
  const [mosque,         setMosque]         = useState<MosqueRow | null>(null);
  const [announcements,  setAnnouncements]  = useState<AnnouncementRow[]>([]);
  const [events,         setEvents]         = useState<EventRow[]>([]);
  const [slides,         setSlides]         = useState<SlideRow[]>([]);
  const [activeTab,      setActiveTab]      = useState<Tab>("pengumuman");
  const [lightboxSrc,    setLightboxSrc]    = useState<string | null>(null);

  // Redirect if no mosque
  useEffect(() => {
    if (favState === "not_found") router.replace("/app/select-mosque");
  }, [favState, router]);

  const slug = favorite?.slug ?? "";

  const loadData = useCallback(async () => {
    if (!slug || favState === "loading") return;
    setLoadState("loading");
    try {
      const mosqueData = await getMosqueBySlug(slug);
      if (!mosqueData) { setLoadState("error"); return; }
      setMosque(mosqueData);

      const id = mosqueData.id;
      const [ann, ev, sli] = await Promise.all([
        getAnnouncements(id),
        getUpcomingEvents(id),
        getSlides(id),
      ]);

      setAnnouncements(ann);
      setEvents(ev);
      setSlides(sli);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [slug, favState]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  // ─── Render states ──────────────────────────────────────────────────

  if (favState === "loading" || loadState === "idle" || loadState === "loading") {
    return <SkeletonInfo />;
  }

  if (loadState === "error") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: "var(--pwa-bg)" }}
      >
        <ErrorState onRetry={loadData} />
      </div>
    );
  }

  return (
    <PageTransition variant="slide-up">
      {/* Slide lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan gambar penuh"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Tutup gambar"
            onClick={() => setLightboxSrc(null)}
          >
            ✕
          </button>
          <Image
            src={lightboxSrc}
            alt="Slide masjid"
            width={800}
            height={600}
            className="max-w-full max-h-[80dvh] rounded-2xl object-contain"
            unoptimized={lightboxSrc.startsWith("http")}
          />
        </div>
      )}

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen" style={{ background: "var(--pwa-bg)" }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <header
            className="sticky top-0 z-40 backdrop-blur-xl border-b"
            style={{
              background: "var(--pwa-header-bg)",
              borderColor: "var(--pwa-border)",
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold" style={{ color: "var(--pwa-text-primary)" }}>Informasi</h1>
                {mosque?.name && (
                  <p className="text-xs text-emerald-400 font-medium truncate max-w-[220px]">
                    {mosque.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                style={{ background: "var(--pwa-bg-card)" }}
                aria-label="Perbarui informasi"
              >
                <RefreshCw size={16} strokeWidth={2} style={{ color: "var(--pwa-text-muted)" }} aria-hidden="true" />
              </button>
            </div>

            {/* Tab bar */}
            <nav
              className="flex gap-1 px-5 pb-3 overflow-x-auto scrollbar-none"
              aria-label="Kategori informasi"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  className={[
                    "flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold",
                    "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                    activeTab === tab.id
                      ? "bg-emerald-500 text-black"
                      : "active:opacity-70",
                  ].join(" ")}
                  style={activeTab !== tab.id ? {
                    background: "var(--pwa-bg-card)",
                    color: "var(--pwa-text-muted)",
                  } : undefined}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" aria-hidden="true" />
          </header>

          {/* ── Tab panels ────────────────────────────────────── */}
          <div className="px-5 pt-5 pb-32">

            {/* Pengumuman */}
            {activeTab === "pengumuman" && (
              <div
                id="tabpanel-pengumuman"
                role="tabpanel"
                aria-label="Pengumuman"
              >
                {announcements.length === 0 ? (
                  <EmptyState
                    emoji="📢"
                    title="Belum ada pengumuman"
                    subtitle="Pengumuman terbaru dari masjid akan muncul di sini."
                  />
                ) : (
                  <ul className="flex flex-col gap-3" role="list">
                    {announcements.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-2xl border px-4 py-4 flex gap-3"
                        style={{
                          background: "var(--pwa-bg-card)",
                          borderColor: "var(--pwa-border-subtle)",
                        }}
                      >
                        <div className="w-1 shrink-0 bg-yellow-400 rounded-full mt-0.5" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--pwa-text-primary)" }}>
                            {a.title}
                          </p>
                          <time
                            className="text-[11px] mt-1.5 block"
                            style={{ color: "var(--pwa-text-muted)" }}
                            dateTime={a.created_at}
                          >
                            {formatDate(a.created_at)}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Kegiatan */}
            {activeTab === "kegiatan" && (
              <div
                id="tabpanel-kegiatan"
                role="tabpanel"
                aria-label="Kegiatan masjid"
              >
                {events.length === 0 ? (
                  <EmptyState
                    emoji="🗓️"
                    title="Belum ada kegiatan"
                    subtitle="Jadwal kegiatan masjid akan tampil di sini."
                  />
                ) : (
                  <ul className="flex flex-col gap-3" role="list">
                    {events.map((e) => {
                      const isToday = e.event_date === today;
                      const [y, m, d] = e.event_date.split("-").map(Number);
                      const dayNum   = d;
                      const monthStr = new Date(y, m - 1, d).toLocaleString("id-ID", { month: "short" });

                      return (
                        <li
                          key={e.id}
                          className={[
                            "rounded-2xl border px-4 py-4 flex gap-3",
                            isToday
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : "",
                          ].join(" ")}
                          style={!isToday ? {
                            background: "var(--pwa-bg-card)",
                            borderColor: "var(--pwa-border-subtle)",
                          } : undefined}
                        >
                          {/* Date badge */}
                          <div
                            className={[
                              "shrink-0 flex flex-col items-center justify-center w-11 h-14 rounded-2xl",
                              isToday ? "bg-emerald-500" : "",
                            ].join(" ")}
                            style={!isToday ? { background: "var(--pwa-bg-card-hover)" } : undefined}
                            aria-hidden="true"
                          >
                            <span
                              className={`text-xl font-extrabold leading-none ${isToday ? "text-black" : ""}`}
                              style={!isToday ? { color: "var(--pwa-text-primary)" } : undefined}
                            >
                              {dayNum}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase ${isToday ? "text-black/70" : ""}`}
                              style={!isToday ? { color: "var(--pwa-text-muted)" } : undefined}
                            >
                              {monthStr}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm font-bold leading-snug flex-1 ${isToday ? "text-emerald-300" : ""}`}
                                style={!isToday ? { color: "var(--pwa-text-primary)" } : undefined}
                              >
                                {e.title}
                              </p>
                              {isToday && (
                                <span className="shrink-0 text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded-full">
                                  Hari Ini
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-3 mt-2">
                              {e.speaker && (
                                <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--pwa-text-muted)" }}>
                                  <User size={11} strokeWidth={2} aria-hidden="true" />
                                  {e.speaker}
                                </span>
                              )}
                              {e.event_time && (
                                <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--pwa-text-muted)" }}>
                                  <Clock size={11} strokeWidth={2} aria-hidden="true" />
                                  <time dateTime={`${e.event_date}T${e.event_time}`}>{e.event_time}</time>
                                </span>
                              )}
                              {e.location && (
                                <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--pwa-text-muted)" }}>
                                  <MapPin size={11} strokeWidth={2} aria-hidden="true" />
                                  {e.location}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] mt-1" style={{ color: "var(--pwa-text-muted)" }}>
                              {formatEventDate(e.event_date)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Galeri / Slides */}
            {activeTab === "galeri" && (
              <div
                id="tabpanel-galeri"
                role="tabpanel"
                aria-label="Galeri slide masjid"
              >
                {slides.length === 0 ? (
                  <EmptyState
                    emoji="🖼️"
                    title="Belum ada galeri"
                    subtitle="Slide dan gambar masjid akan tampil di sini."
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {slides.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setLightboxSrc(s.image_url)}
                        className="relative overflow-hidden rounded-2xl border border-slate-700/40 aspect-video active:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        aria-label={`Lihat slide ${idx + 1}`}
                      >
                        <Image
                          src={s.image_url}
                          alt={`Slide ${idx + 1}`}
                          fill
                          className="object-cover"
                          unoptimized={s.image_url.startsWith("http")}
                          sizes="(max-width: 640px) 50vw, 300px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Running Text */}
            {activeTab === "running" && (
              <div
                id="tabpanel-running"
                role="tabpanel"
                aria-label="Teks berjalan"
              >
                {mosque?.running_text ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <ScrollText size={15} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
                        <h2 className="text-sm font-bold text-white">Teks Berjalan</h2>
                      </div>

                      {/* Live preview */}
                      <div className="relative overflow-hidden bg-slate-950/60 rounded-2xl border border-slate-700/30 py-3 mb-4">
                        <div
                          className="whitespace-nowrap text-emerald-300 text-sm font-semibold px-4"
                          style={{
                            animation: `marquee ${(mosque.running_text_speed ?? 20) * 2}s linear infinite`,
                          }}
                          aria-label="Preview teks berjalan"
                        >
                          {mosque.running_text}
                          &nbsp;&nbsp;•&nbsp;&nbsp;
                          {mosque.running_text}
                        </div>
                      </div>

                      {/* Full text */}
                      <div className="bg-slate-950/60 rounded-2xl border border-slate-700/30 p-4">
                        <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">
                          Isi Pesan
                        </p>
                        <p className="text-slate-200 text-sm leading-relaxed">
                          {mosque.running_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    emoji="💬"
                    title="Belum ada teks berjalan"
                    subtitle="Pesan teks berjalan dari masjid akan tampil di sini."
                  />
                )}
              </div>
            )}

          </div>
        </div>
      </PullToRefresh>
    </PageTransition>
  );
}
