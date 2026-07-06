"use client";

/**
 * SmartMasjid Mobile — Prayer Schedule Page (/app/sholat)
 *
 * Shows:
 * - Today's prayer schedule with live countdown
 * - Syuruq time
 * - Tomorrow's schedule
 * - 30-day calendar view
 * - Highlight for current/next prayer
 * - Pull-to-refresh
 * - Skeleton loading + error + empty states
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Sunrise, ChevronDown, RefreshCw, CalendarDays } from "lucide-react";

import { useFavoriteMosque }         from "@/hooks/useFavoriteMosque";
import { getMosqueBySlug }           from "@/lib/mobile/mosque";
import {
  fetchPrayerTimesForCity,
  buildSholatList,
  decoratePrayerList,
  getNextPrayerCountdown,
  buildPrayerList,
} from "@/lib/mobile/prayer";
import type { PrayerEntry, MosqueRow } from "@/lib/mobile/types";

import { SkeletonPrayer }  from "../components/mobile/Skeleton";
import ErrorState          from "../components/mobile/ErrorState";
import EmptyState          from "../components/mobile/EmptyState";
import PullToRefresh       from "../components/mobile/PullToRefresh";
import PageTransition      from "../components/mobile/PageTransition";
import { CountdownBar }    from "../components/mobile/ClockWidget";

// ─── Types ─────────────────────────────────────────────────────────────────

type LoadState = "idle" | "loading" | "ready" | "error";

interface DaySchedule {
  date: string;      // YYYY-MM-DD
  label: string;     // "Senin, 7 Jul"
  prayers: PrayerEntry[];
  syuruq: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const PRAYER_NAMES_ID: Record<string, string> = {
  Fajr:    "Subuh",
  Sunrise: "Syuruq",
  Dhuhr:   "Dzuhur",
  Asr:     "Ashar",
  Maghrib: "Maghrib",
  Isha:    "Isya",
  Imsak:   "Imsak",
};

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Fetch timings for a specific date via Aladhan */
async function fetchForDate(city: string, date: Date): Promise<Record<string, string> | null> {
  const d = date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${d}?city=${encodeURIComponent(city)}&country=Indonesia&method=11`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.timings ?? null;
  } catch {
    return null;
  }
}

/** Fetch 30 days of timings — batch but throttled */
async function fetch30Days(city: string): Promise<DaySchedule[]> {
  const results: DaySchedule[] = [];
  const today = new Date();

  // Fetch today + next 29 days, batched in groups of 5
  const dates: Date[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  for (let i = 0; i < dates.length; i += 5) {
    const batch = dates.slice(i, i + 5);
    const timingsArr = await Promise.all(batch.map((d) => fetchForDate(city, d)));
    for (let j = 0; j < batch.length; j++) {
      const dt = batch[j];
      const timings = timingsArr[j];
      if (!dt || !timings) continue;
      const iso = dt.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      results.push({
        date:    iso,
        label:   dateLabel(iso),
        prayers: buildSholatList(timings),
        syuruq:  timings.Sunrise ?? "",
      });
    }
  }
  return results;
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SholatPage() {
  const router = useRouter();
  const { state: favState, favorite } = useFavoriteMosque();

  const [loadState,  setLoadState]  = useState<LoadState>("idle");
  const [mosque,     setMosque]     = useState<MosqueRow | null>(null);
  const [todayPrayers, setTodayPrayers]     = useState<PrayerEntry[]>([]);
  const [tomorrowPrayers, setTomorrowPrayers] = useState<PrayerEntry[]>([]);
  const [syuruqToday,    setSyuruqToday]    = useState("");
  const [syuruqTomorrow, setSyuruqTomorrow] = useState("");
  const [schedule30, setSchedule30] = useState<DaySchedule[]>([]);
  const [show30,     setShow30]     = useState(false);
  const [loading30,  setLoading30]  = useState(false);
  const [offline,    setOffline]    = useState(false);

  // Redirect to select-mosque if no mosque
  useEffect(() => {
    if (favState === "not_found") router.replace("/app/select-mosque");
  }, [favState, router]);

  // Detect offline
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online",  update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online",  update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const slug = favorite?.slug ?? "";

  const loadData = useCallback(async () => {
    if (!slug || favState === "loading") return;
    setLoadState("loading");

    try {
      const mosqueData = await getMosqueBySlug(slug);
      if (!mosqueData?.city) { setLoadState("error"); return; }
      setMosque(mosqueData);

      const city = mosqueData.city as string;

      // Today & tomorrow in parallel
      const today    = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const [timingsToday, timingsTomorrow] = await Promise.all([
        fetchForDate(city, today),
        fetchForDate(city, tomorrow),
      ]);

      if (timingsToday) {
        setTodayPrayers(buildSholatList(timingsToday));
        setSyuruqToday(timingsToday.Sunrise ?? "");
      }
      if (timingsTomorrow) {
        setTomorrowPrayers(buildSholatList(timingsTomorrow));
        setSyuruqTomorrow(timingsTomorrow.Sunrise ?? "");
      }

      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [slug, favState]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLoad30 = async () => {
    if (!mosque?.city || loading30 || schedule30.length > 0) return;
    setLoading30(true);
    try {
      const data = await fetch30Days(mosque.city as string);
      setSchedule30(data);
    } finally {
      setLoading30(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setSchedule30([]);
    await loadData();
  }, [loadData]);

  // Derived
  const todayStr       = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const nextPrayerInfo = todayPrayers.length > 0 ? getNextPrayerCountdown(todayPrayers) : null;
  const decoratedToday = decoratePrayerList(
    todayPrayers,
    nextPrayerInfo?.name ?? ""
  );

  // ─── Render states ────────────────────────────────────────────────────

  if (favState === "loading" || loadState === "idle" || loadState === "loading") {
    return <SkeletonPrayer />;
  }

  if (loadState === "error") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
        <ErrorState
          offline={offline}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <PageTransition variant="slide-up">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-slate-950">

          {/* ── Header ────────────────────────────────────────────── */}
          <header
            className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-white">Jadwal Sholat</h1>
                {mosque?.name && (
                  <p className="text-xs text-emerald-400 font-medium truncate max-w-[220px]">
                    {mosque.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center active:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Perbarui jadwal sholat"
              >
                <RefreshCw size={16} strokeWidth={2} className="text-slate-400" aria-hidden="true" />
              </button>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" aria-hidden="true" />
          </header>

          <div className="px-5 pt-5 pb-32 space-y-6">

            {/* ── Live Countdown ────────────────────────────────── */}
            {todayPrayers.length > 0 && (
              <CountdownBar
                prayers={todayPrayers}
                iqomahSecs={mosque?.iqomah_duration ?? 300}
                showAdzan={false}
                currentPrayer=""
              />
            )}

            {/* ── Today's Schedule ──────────────────────────────── */}
            <section aria-label="Jadwal sholat hari ini">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={15} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
                <h2 className="text-sm font-bold text-white">Hari Ini</h2>
                <span className="text-[11px] text-slate-500">
                  {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </div>

              {decoratedToday.length === 0 ? (
                <EmptyState
                  emoji="🕌"
                  title="Jadwal belum tersedia"
                  subtitle="Tidak dapat mengambil jadwal sholat. Periksa koneksi."
                />
              ) : (
                <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden">
                  {/* Syuruq badge */}
                  {syuruqToday && (
                    <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2">
                      <Sunrise size={13} className="text-yellow-300" strokeWidth={2} aria-hidden="true" />
                      <span className="text-yellow-300 text-xs font-semibold">
                        Syuruq {syuruqToday}
                      </span>
                    </div>
                  )}
                  <ul className="divide-y divide-slate-700/40" role="list" aria-label="Jadwal sholat hari ini">
                    {decoratedToday.map((p) => (
                      <PrayerRow key={p.name} prayer={p} />
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* ── Tomorrow's Schedule ───────────────────────────── */}
            <section aria-label="Jadwal sholat besok">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={15} className="text-slate-400" strokeWidth={2} aria-hidden="true" />
                <h2 className="text-sm font-bold text-white">Besok</h2>
                <span className="text-[11px] text-slate-500">
                  {(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
                  })()}
                </span>
              </div>

              {tomorrowPrayers.length === 0 ? (
                <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 p-5 text-center">
                  <p className="text-slate-500 text-sm">Jadwal besok tidak tersedia</p>
                </div>
              ) : (
                <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden opacity-75">
                  {syuruqTomorrow && (
                    <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center gap-2">
                      <Sunrise size={13} className="text-yellow-300/60" strokeWidth={2} aria-hidden="true" />
                      <span className="text-yellow-300/60 text-xs font-semibold">
                        Syuruq {syuruqTomorrow}
                      </span>
                    </div>
                  )}
                  <ul className="divide-y divide-slate-700/40" role="list" aria-label="Jadwal sholat besok">
                    {tomorrowPrayers.map((p) => (
                      <PrayerRow key={p.name} prayer={p} dim />
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* ── 30-Day Calendar ───────────────────────────────── */}
            <section aria-label="Jadwal sholat 30 hari">
              <button
                type="button"
                onClick={() => {
                  setShow30((v) => !v);
                  if (!show30) handleLoad30();
                }}
                className="w-full flex items-center justify-between gap-2 mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-xl"
                aria-expanded={show30}
                aria-controls="schedule-30"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
                  <h2 className="text-sm font-bold text-white">Jadwal 30 Hari</h2>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition-transform duration-200 ${show30 ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {show30 && (
                <div id="schedule-30">
                  {loading30 ? (
                    <div className="space-y-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-14 bg-slate-800 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : schedule30.length === 0 ? (
                    <EmptyState
                      emoji="📅"
                      title="Gagal memuat"
                      subtitle="Jadwal 30 hari tidak dapat dimuat"
                      action={{ label: "Coba lagi", onClick: handleLoad30 }}
                    />
                  ) : (
                    <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden">
                      <ul className="divide-y divide-slate-700/40" role="list">
                        {schedule30.map((day) => {
                          const isToday = day.date === todayStr;
                          return (
                            <li
                              key={day.date}
                              className={[
                                "px-4 py-3",
                                isToday ? "bg-emerald-500/10" : "",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-xs font-bold ${isToday ? "text-emerald-400" : "text-slate-400"}`}>
                                  {day.label}
                                </span>
                                {isToday && (
                                  <span className="text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded-full">
                                    Hari Ini
                                  </span>
                                )}
                                {day.syuruq && (
                                  <span className="text-[10px] text-yellow-400/70 flex items-center gap-1">
                                    <Sunrise size={10} strokeWidth={2} aria-hidden="true" />
                                    {day.syuruq}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {day.prayers.map((p) => (
                                  <span key={p.name} className="text-[10px] text-slate-400">
                                    <span className="text-slate-600">{p.name} </span>
                                    <span className="font-semibold text-white tabular-nums">{p.time}</span>
                                  </span>
                                ))}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>
        </div>
      </PullToRefresh>
    </PageTransition>
  );
}

// ─── Sub-component: single prayer row ─────────────────────────────────────

function PrayerRow({ prayer, dim = false }: { prayer: PrayerEntry; dim?: boolean }) {
  return (
    <li
      className={[
        "flex items-center justify-between px-5 py-3.5",
        prayer.isNext ? "bg-emerald-500/10" : "",
        prayer.isDone || dim ? "opacity-50" : "",
      ].join(" ")}
      role="listitem"
    >
      <div className="flex items-center gap-3">
        {prayer.isNext && (
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" aria-hidden="true" />
        )}
        <span
          className={`text-sm font-semibold ${prayer.isNext ? "text-emerald-300" : "text-slate-300"}`}
          aria-label={`Waktu sholat ${prayer.name}`}
        >
          {prayer.name}
        </span>
        {prayer.isNext && (
          <span className="text-[9px] bg-emerald-500 text-black font-bold px-1.5 py-0.5 rounded-full uppercase">
            Berikutnya
          </span>
        )}
      </div>
      <time
        className={`text-base font-bold tabular-nums ${prayer.isNext ? "text-emerald-300" : "text-white"}`}
        dateTime={prayer.time}
      >
        {prayer.time}
      </time>
    </li>
  );
}
