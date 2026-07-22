"use client";

/**
 * SmartMasjid Mobile — Profile Page (/app/profil)
 *
 * Displays:
 * - Mosque logo, name, tagline, address, contact, website
 * - "Masjid Saya" with Ganti Masjid button
 *
 * Ganti Masjid flow:
 *   Click "Ganti Masjid" → sets sessionStorage intent → router.push("/app/select-mosque")
 *   After user picks in select-mosque page → router.replace("/app")
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter }     from "next/navigation";
import Image             from "next/image";
import {
  MapPin, Phone, MessageCircle, Globe, Mail,
  RefreshCw, Tv2, Building2, Info, Clock,
  ExternalLink, ChevronRight, Bell, BellOff,
  Sun, Moon, Monitor, Timer,
} from "lucide-react";

import { useTheme } from "@/lib/themes/ThemeProvider";
import type { ThemeMode } from "@/lib/themes/ThemeProvider";

import { usePushNotification } from "@/hooks/usePushNotification";

import { useFavoriteMosque }  from "@/hooks/useFavoriteMosque";
import { getMosqueBySlug }    from "@/lib/mobile/mosque";
import type { MosqueRow }     from "@/lib/mobile/types";

import { SkeletonProfile }   from "../components/mobile/Skeleton";
import ErrorState            from "../components/mobile/ErrorState";
import PullToRefresh         from "../components/mobile/PullToRefresh";
import PageTransition        from "../components/mobile/PageTransition";

// ─── Types ─────────────────────────────────────────────────────────────────

type LoadState = "idle" | "loading" | "ready" | "error";

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const router = useRouter();
  const { state: favState, favorite, recent, selectMosque } = useFavoriteMosque();

  const { theme: activeTheme, setTheme } = useTheme();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [mosque,    setMosque]    = useState<MosqueRow | null>(null);
  const [switching, setSwitching] = useState(false);

  // Push notification subscription
  const {
    isSupported: pushSupported,
    isSubscribed,
    isLoading: pushLoading,
    isDenied: pushDenied,
    status: pushStatus,
    errorMsg: pushErrorMsg,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotification(favorite?.mosque_id ?? null);

  // Redirect if no mosque set
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
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [slug, favState]);

  useEffect(() => { loadData(); }, [loadData]);

  /** Ganti Masjid — open the fullscreen select-mosque page */
  const handleGantiMasjid = useCallback(() => {
    // Set intent flag so select-mosque knows not to auto-redirect back to /app
    sessionStorage.setItem("select_mosque_intent", "ganti");
    router.push("/app/select-mosque");
  }, [router]);

  /** Switch directly to a mosque from the recent list */
  const handleChangeMosque = useCallback(async (picked: MosqueRow) => {
    if (switching) return;
    setSwitching(true);
    selectMosque(picked);
    router.replace("/app");
  }, [switching, selectMosque, router]);

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const locationText = [mosque?.city, mosque?.province].filter(Boolean).join(", ");
  const mapsQuery    = encodeURIComponent(
    [mosque?.name, mosque?.address, mosque?.city].filter(Boolean).join(", ")
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // ─── Render states ──────────────────────────────────────────────────

  if (favState === "loading" || loadState === "idle" || loadState === "loading") {
    return <SkeletonProfile />;
  }

  if (loadState === "error") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
        <ErrorState onRetry={loadData} />
      </div>
    );
  }

  return (
    <>
      <PageTransition variant="slide-up">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="min-h-screen bg-slate-950">

            {/* ── Header ──────────────────────────────────────────── */}
            <header
              className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              <div className="px-5 py-4 flex items-center justify-between">
                <h1 className="text-base font-bold text-white">Profil</h1>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                    SmartMasjid
                  </span>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" aria-hidden="true" />
            </header>

            <div className="px-5 pt-5 pb-32 space-y-5">

              {/* ── Mosque Identity Card ───────────────────────────── */}
              {mosque && (
                <section aria-label="Identitas masjid">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/40">
                    {/* Ambient orb */}
                    <div
                      className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-emerald-500/8 blur-2xl pointer-events-none"
                      aria-hidden="true"
                    />

                    <div className="relative z-10 px-5 pt-5 pb-4">
                      {/* Logo + name */}
                      <div className="flex items-center gap-4 mb-4">
                        {mosque.logo_url ? (
                          <Image
                            src={mosque.logo_url}
                            alt={`Logo ${mosque.name}`}
                            width={72}
                            height={72}
                            className="w-18 h-18 rounded-2xl object-cover border-2 border-emerald-400/60 shrink-0"
                            priority
                            unoptimized={mosque.logo_url.startsWith("http")}
                          />
                        ) : (
                          <div
                            className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 border-2 border-emerald-400/60 flex items-center justify-center shrink-0"
                            aria-hidden="true"
                          >
                            <span className="text-3xl">🕌</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h2 className="text-white font-extrabold text-lg leading-tight">
                            {mosque.name}
                          </h2>
                          {mosque.tagline && (
                            <p className="text-slate-400 text-xs mt-1 italic leading-snug">
                              {mosque.tagline}
                            </p>
                          )}
                          {locationText && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <MapPin size={11} className="text-emerald-400 shrink-0" strokeWidth={2} aria-hidden="true" />
                              <span className="text-emerald-400 text-xs font-medium truncate">
                                {locationText}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Address */}
                      {mosque.address && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 bg-slate-950/40 rounded-2xl p-3 mb-3 active:bg-slate-950/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                          aria-label={`Buka di Google Maps: ${mosque.address}`}
                        >
                          <MapPin size={15} className="text-yellow-400 mt-0.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-300 text-xs leading-snug">
                              {mosque.address}
                            </p>
                            {locationText && (
                              <p className="text-slate-500 text-[11px] mt-0.5">{locationText}</p>
                            )}
                          </div>
                          <ExternalLink size={12} className="text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                        </a>
                      )}

                      {/* Google Maps button */}
                      {(mosque.address || mosque.city) && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-semibold text-xs py-2.5 rounded-2xl active:bg-yellow-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                          aria-label="Buka lokasi di Google Maps"
                        >
                          <MapPin size={13} strokeWidth={2} aria-hidden="true" />
                          Lihat di Google Maps
                          <ExternalLink size={11} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Contact & Links ────────────────────────────────── */}
              {(mosque?.phone || mosque?.whatsapp || mosque?.website || mosque?.email) && (
                <section aria-label="Kontak masjid">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Kontak &amp; Tautan
                  </p>
                  <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden divide-y divide-slate-700/40">

                    {mosque?.whatsapp && (
                      <a
                        href={`https://wa.me/${mosque.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        aria-label={`WhatsApp pengurus: ${mosque.whatsapp}`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                          <MessageCircle size={16} className="text-green-400" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">WhatsApp</p>
                          <p className="text-slate-500 text-xs truncate">{mosque.whatsapp}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 shrink-0" aria-hidden="true" />
                      </a>
                    )}

                    {mosque?.phone && (
                      <a
                        href={`tel:${mosque.phone}`}
                        className="flex items-center gap-3 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        aria-label={`Telepon: ${mosque.phone}`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                          <Phone size={16} className="text-blue-400" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">Telepon</p>
                          <p className="text-slate-500 text-xs truncate">{mosque.phone}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 shrink-0" aria-hidden="true" />
                      </a>
                    )}

                    {mosque?.email && (
                      <a
                        href={`mailto:${mosque.email}`}
                        className="flex items-center gap-3 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        aria-label={`Email: ${mosque.email}`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                          <Mail size={16} className="text-yellow-400" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">Email</p>
                          <p className="text-slate-500 text-xs truncate">{mosque.email}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-600 shrink-0" aria-hidden="true" />
                      </a>
                    )}

                    {mosque?.website && (
                      <a
                        href={mosque.website.startsWith("http") ? mosque.website : `https://${mosque.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        aria-label={`Website: ${mosque.website}`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                          <Globe size={16} className="text-purple-400" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">Website</p>
                          <p className="text-slate-500 text-xs truncate">{mosque.website}</p>
                        </div>
                        <ExternalLink size={13} className="text-slate-600 shrink-0" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* ── TV Display ────────────────────────────────────── */}
              {mosque?.slug && (
                <section aria-label="TV Display">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Layar Masjid
                  </p>
                  <a
                    href={`/tv/${mosque.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-slate-900/70 rounded-3xl border border-slate-700/40 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    aria-label="Buka TV Display masjid di tab baru"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                      <Tv2 size={16} className="text-emerald-400" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">TV Display</p>
                      <p className="text-slate-500 text-xs">Layar informasi masjid</p>
                    </div>
                    <ExternalLink size={13} className="text-slate-600 shrink-0" aria-hidden="true" />
                  </a>
                </section>
              )}

              {/* ── Masjid Saya (Ganti Masjid) ────────────────────── */}
              <section aria-label="Ganti masjid">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Masjid Saya
                </p>
                <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden divide-y divide-slate-700/40">

                  {/* Current mosque indicator */}
                  {favorite && (
                    <div className="flex items-center gap-3 px-5 py-3.5">
                      {favorite.logo_url ? (
                        <Image
                          src={favorite.logo_url}
                          alt={`Logo ${favorite.name}`}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-lg object-cover border border-emerald-400/40 shrink-0"
                          unoptimized={favorite.logo_url.startsWith("http")}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                          <span className="text-sm">🕌</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{favorite.name}</p>
                        {(favorite.city || favorite.province) && (
                          <p className="text-slate-500 text-[11px] truncate">
                            {[favorite.city, favorite.province].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        Aktif
                      </span>
                    </div>
                  )}

                  {/* Ganti Masjid button */}
                  <button
                    type="button"
                    onClick={handleGantiMasjid}
                    className="w-full flex items-center gap-3 px-5 py-3.5 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                    aria-label="Ganti masjid favorit"
                  >
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                      <RefreshCw size={14} className="text-yellow-400" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-white flex-1 text-left">Ganti Masjid</span>
                    <ChevronRight size={14} className="text-yellow-400 shrink-0" aria-hidden="true" />
                  </button>
                </div>
              </section>

              {/* ── Recent Mosques ────────────────────────────────── */}
              {recent.length > 1 && (
                <section aria-label="Riwayat masjid">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Terakhir Dikunjungi
                  </p>
                  <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden divide-y divide-slate-700/40">
                    {recent.slice(0, 5).map((m) => (
                      <button
                        key={m.mosque_id}
                        type="button"
                        onClick={() => handleChangeMosque(m as unknown as MosqueRow)}
                        disabled={m.slug === favorite?.slug || switching}
                        className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-slate-800/70 transition-colors disabled:opacity-50 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        aria-label={`Pilih ${m.name}`}
                        aria-pressed={m.slug === favorite?.slug}
                      >
                        {m.logo_url ? (
                          <Image
                            src={m.logo_url}
                            alt={`Logo ${m.name}`}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                            unoptimized={m.logo_url.startsWith("http")}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0" aria-hidden="true">
                            <span className="text-sm">🕌</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                          {(m.city || m.province) && (
                            <p className="text-[11px] text-slate-500 truncate">
                              {[m.city, m.province].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                        {m.slug === favorite?.slug ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full shrink-0">Aktif</span>
                        ) : (
                          <span className="text-xs text-slate-500 shrink-0">Pilih</span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Pengaturan Notifikasi ─────────────────────────── */}
              {pushSupported && (
                <section aria-label="Pengaturan notifikasi">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Notifikasi
                  </p>
                  <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSubscribed
                            ? "bg-emerald-500/10 border-emerald-500/20"
                            : "bg-slate-800 border-slate-700"
                        }`}
                        aria-hidden="true"
                      >
                        {isSubscribed ? (
                          <Bell size={16} className="text-emerald-400" strokeWidth={2} />
                        ) : (
                          <BellOff size={16} className="text-slate-400" strokeWidth={2} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">
                          {isSubscribed ? "Notifikasi Aktif" : "Aktifkan Notifikasi"}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {pushDenied
                            ? "Izin notifikasi ditolak di pengaturan browser"
                            : isSubscribed
                            ? "Anda akan menerima pengumuman dari masjid ini"
                            : "Terima pengumuman dari masjid ini"}
                        </p>

                      </div>

                      {!pushDenied && (
                        <button
                          type="button"
                          onClick={isSubscribed ? unsubscribePush : subscribePush}
                          disabled={pushLoading || !favorite?.mosque_id}
                          aria-label={isSubscribed ? "Matikan notifikasi" : "Aktifkan notifikasi"}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSubscribed ? "bg-emerald-500" : "bg-slate-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                              isSubscribed ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Error state */}
                    {pushStatus === "error" && pushErrorMsg && (
                      <div className="px-5 pb-4">
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 leading-relaxed">
                          <strong className="block mb-1">⚠️ Gagal Mengaktifkan Notifikasi</strong>
                          {pushErrorMsg}
                        </p>
                      </div>
                    )}

                    {/* Idle with error message — e.g. user dismissed permission prompt */}
                    {pushStatus === "idle" && pushErrorMsg && (
                      <div className="px-5 pb-4">
                        <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 leading-relaxed">
                          {pushErrorMsg}
                        </p>
                      </div>
                    )}

                    {pushDenied && (
                      <div className="px-5 pb-4">
                        <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
                          Buka pengaturan browser → izinkan notifikasi untuk situs ini, lalu muat ulang halaman.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Tampilan (Theme) ──────────────────────────────── */}
              <section aria-label="Pengaturan tampilan">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Tampilan
                </p>
                <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden">
                  <div className="px-5 py-4">
                    <p className="text-xs text-slate-500 mb-3">Pilih mode tampilan aplikasi</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            id: "light" as ThemeMode,
                            label: "Terang",
                            desc: "Tampilan cerah",
                            icon: Sun,
                            iconColor: "text-yellow-400",
                            bgActive: "bg-yellow-500/15 border-yellow-400/50",
                            bgIdle: "bg-slate-800/60 border-slate-700/40",
                          },
                          {
                            id: "dark" as ThemeMode,
                            label: "Gelap",
                            desc: "Tampilan gelap",
                            icon: Moon,
                            iconColor: "text-blue-400",
                            bgActive: "bg-blue-500/15 border-blue-400/50",
                            bgIdle: "bg-slate-800/60 border-slate-700/40",
                          },
                          {
                            id: "system" as ThemeMode,
                            label: "Sistem",
                            desc: "Ikut pengaturan HP",
                            icon: Monitor,
                            iconColor: "text-purple-400",
                            bgActive: "bg-purple-500/15 border-purple-400/50",
                            bgIdle: "bg-slate-800/60 border-slate-700/40",
                          },
                          {
                            id: "auto" as ThemeMode,
                            label: "Otomatis",
                            desc: "Siang terang, malam gelap",
                            icon: Timer,
                            iconColor: "text-emerald-400",
                            bgActive: "bg-emerald-500/15 border-emerald-400/50",
                            bgIdle: "bg-slate-800/60 border-slate-700/40",
                          },
                        ] as const
                      ).map(({ id, label, desc, icon: Icon, iconColor, bgActive, bgIdle }) => {
                        const isActive = activeTheme === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setTheme(id)}
                            aria-pressed={isActive}
                            aria-label={`Mode tampilan: ${label} — ${desc}`}
                            className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                              isActive ? bgActive : bgIdle
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isActive ? "bg-white/10" : "bg-slate-700/60"
                              }`}
                              aria-hidden="true"
                            >
                              <Icon size={14} className={iconColor} strokeWidth={2} />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-bold leading-tight ${
                                  isActive ? "text-white" : "text-slate-400"
                                }`}
                              >
                                {label}
                                {isActive && (
                                  <span className="ml-1.5 text-[9px] font-semibold text-emerald-400">✓</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {activeTheme === "auto" && (
                      <p className="mt-3 text-[11px] text-emerald-400/80 text-center">
                        🕐 Mode otomatis aktif — terang pukul 06:00–18:00, gelap pukul 18:00–06:00
                      </p>
                    )}
                    {activeTheme === "system" && (
                      <p className="mt-3 text-[11px] text-purple-400/80 text-center">
                        📱 Mengikuti pengaturan dark/light mode di perangkat
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* ── App Info ──────────────────────────────────────────── */}
              <section aria-label="Informasi aplikasi">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Informasi Aplikasi
                </p>
                <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden divide-y divide-slate-700/40">
                  <div className="flex items-center gap-3 px-5 py-3.5" aria-label="Versi aplikasi">
                    <Info size={15} className="text-slate-500 shrink-0" strokeWidth={2} aria-hidden="true" />
                    <span className="text-sm text-slate-300 flex-1">Versi Aplikasi</span>
                    <span className="text-xs text-slate-500">Sprint 4.5</span>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-3.5" aria-label="Terakhir diperbarui">
                    <Clock size={15} className="text-slate-500 shrink-0" strokeWidth={2} aria-hidden="true" />
                    <span className="text-sm text-slate-300 flex-1">Terakhir Diperbarui</span>
                    <span className="text-xs text-slate-500">
                      {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <Building2 size={15} className="text-slate-500 shrink-0" strokeWidth={2} aria-hidden="true" />
                    <span className="text-sm text-slate-300 flex-1">Dikembangkan oleh</span>
                    <span className="text-xs text-emerald-400 font-semibold">SmartMasjid</span>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </PullToRefresh>
      </PageTransition>

    </>
  );
}
