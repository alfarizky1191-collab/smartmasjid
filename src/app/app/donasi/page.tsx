"use client";

/**
 * SmartMasjid Mobile — Donation Page (/app/donasi)
 *
 * Displays:
 * - QRIS scan-to-donate
 * - Bank account info (from mosque contact fields)
 * - Donation programs (from recent donations as proof of activity)
 * - Contact info for coordination
 *
 * NOTE: No finance data exposed here — purely public donation info.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  QrCode, Phone, MessageCircle, Globe, Mail,
  Heart, HandCoins, RefreshCw, Copy, Check,
  Building2,
} from "lucide-react";

import { useFavoriteMosque }              from "@/hooks/useFavoriteMosque";
import { getMosqueBySlug }                from "@/lib/mobile/mosque";
import { getQrisImageUrl }                from "@/lib/mobile/slides";
import type { MosqueRow }                 from "@/lib/mobile/types";

import { SkeletonDonation }  from "../components/mobile/Skeleton";
import EmptyState            from "../components/mobile/EmptyState";
import ErrorState            from "../components/mobile/ErrorState";
import PullToRefresh         from "../components/mobile/PullToRefresh";
import PageTransition        from "../components/mobile/PageTransition";

// ─── Types ─────────────────────────────────────────────────────────────────

type LoadState = "idle" | "loading" | "ready" | "error";

// ─── Donation programs — defined locally (no DB table) ─────────────────────

const DONATION_PROGRAMS = [
  { id: "infaq",    emoji: "🕌", label: "Infaq Masjid",       desc: "Operasional & perawatan masjid"    },
  { id: "dakwah",   emoji: "📖", label: "Dana Dakwah",         desc: "Kegiatan dakwah & kajian"          },
  { id: "sosial",   emoji: "🤝", label: "Sosial & Kemanusiaan", desc: "Bantuan fakir miskin & yatim piatu" },
  { id: "pembangunan", emoji: "🏗️", label: "Pembangunan",     desc: "Renovasi & pengembangan masjid"    },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function DonasiPage() {
  const router = useRouter();
  const { state: favState, favorite } = useFavoriteMosque();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [mosque,    setMosque]    = useState<MosqueRow | null>(null);
  const [qrisUrl,   setQrisUrl]   = useState<string | null>(null);
  const [copied,    setCopied]    = useState<string | null>(null);

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
      const qris = await getQrisImageUrl(mosqueData.id);
      setQrisUrl(qris);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [slug, favState]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {
      // clipboard not available — noop
    });
  };

  // ─── Render states ──────────────────────────────────────────────────

  if (favState === "loading" || loadState === "idle" || loadState === "loading") {
    return <SkeletonDonation />;
  }

  if (loadState === "error") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5">
        <ErrorState onRetry={loadData} />
      </div>
    );
  }

  const hasContact = mosque?.phone || mosque?.whatsapp || mosque?.website || mosque?.email;

  return (
    <PageTransition variant="slide-up">
      <PullToRefresh onRefresh={async () => { await loadData(); }}>
        <div className="min-h-screen bg-slate-950">

          {/* ── Header ──────────────────────────────────────────── */}
          <header
            className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-white">Donasi</h1>
                {mosque?.name && (
                  <p className="text-xs text-emerald-400 font-medium truncate max-w-[220px]">
                    {mosque.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={loadData}
                className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center active:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Perbarui info donasi"
              >
                <RefreshCw size={16} strokeWidth={2} className="text-slate-400" aria-hidden="true" />
              </button>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" aria-hidden="true" />
          </header>

          <div className="px-5 pt-5 pb-32 space-y-6">

            {/* ── QRIS Section ─────────────────────────────────── */}
            <section aria-label="Donasi QRIS">
              <div className="flex items-center gap-2 mb-3">
                <QrCode size={15} className="text-emerald-400" strokeWidth={2} aria-hidden="true" />
                <h2 className="text-sm font-bold text-white">Donasi via QRIS</h2>
              </div>

              {qrisUrl ? (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 p-6">
                  {/* Decorative crescent */}
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[100px] opacity-5 select-none pointer-events-none leading-none"
                    aria-hidden="true"
                  >
                    ☽
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">
                        <Heart size={13} className="inline mr-1 text-red-400" aria-hidden="true" />
                        Scan QRIS untuk berdonasi
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Semua bank &amp; e-wallet didukung
                      </p>
                    </div>

                    <Image
                      src={qrisUrl}
                      alt={`QR Code donasi ${mosque?.name ?? "masjid"} — scan untuk berdonasi`}
                      width={220}
                      height={220}
                      className="rounded-2xl border-2 border-emerald-400 shadow-xl shadow-emerald-900/40"
                      unoptimized={qrisUrl.startsWith("http")}
                      priority
                    />

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2 text-center">
                      <p className="text-emerald-300 text-xs font-semibold">
                        🤲 Jazakumullahu Khairan
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Semoga menjadi amal jariyah
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  emoji="📱"
                  title="QRIS belum tersedia"
                  subtitle="Masjid belum mengatur QRIS donasi. Hubungi pengurus untuk informasi donasi."
                />
              )}
            </section>

            {/* ── Bank Transfer Section ─────────────────────────── */}
            <section aria-label="Transfer bank">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={15} className="text-yellow-400" strokeWidth={2} aria-hidden="true" />
                <h2 className="text-sm font-bold text-white">Transfer Bank</h2>
              </div>

              <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 p-5 space-y-3">
                <p className="text-slate-400 text-xs leading-relaxed">
                  Untuk informasi rekening bank, silakan hubungi pengurus masjid secara langsung
                  atau melalui kontak di bawah. Pengurus akan memberikan nomor rekening resmi.
                </p>

                {/* Mosque name as "account holder" display */}
                <div className="bg-slate-950/60 rounded-2xl border border-slate-700/30 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Atas Nama</p>
                    <p className="text-white text-sm font-bold">{mosque?.name ?? "Masjid"}</p>
                    {(mosque?.city || mosque?.province) && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        {[mosque?.city, mosque?.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {mosque?.name && (
                    <button
                      type="button"
                      onClick={() => handleCopy(mosque.name, "mosque-name")}
                      className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center active:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      aria-label={`Salin nama ${mosque.name}`}
                    >
                      {copied === "mosque-name" ? (
                        <Check size={14} className="text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Copy size={14} className="text-slate-400" aria-hidden="true" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* ── Donation Programs ─────────────────────────────── */}
            <section aria-label="Program donasi">
              <div className="flex items-center gap-2 mb-3">
                <HandCoins size={15} className="text-purple-400" strokeWidth={2} aria-hidden="true" />
                <h2 className="text-sm font-bold text-white">Program Donasi</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DONATION_PROGRAMS.map((prog) => (
                  <div
                    key={prog.id}
                    className="bg-slate-900/70 rounded-2xl border border-slate-700/40 p-4"
                  >
                    <span className="text-2xl mb-2 block" aria-hidden="true">{prog.emoji}</span>
                    <p className="text-white text-xs font-bold leading-snug">{prog.label}</p>
                    <p className="text-slate-500 text-[11px] mt-1 leading-snug">{prog.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Contact Section ───────────────────────────────── */}
            {hasContact && (
              <section aria-label="Kontak donasi">
                <div className="flex items-center gap-2 mb-3">
                  <Phone size={15} className="text-blue-400" strokeWidth={2} aria-hidden="true" />
                  <h2 className="text-sm font-bold text-white">Konfirmasi Donasi</h2>
                </div>

                <div className="bg-slate-900/70 rounded-3xl border border-slate-700/40 overflow-hidden divide-y divide-slate-700/40">

                  {mosque?.whatsapp && (
                    <a
                      href={`https://wa.me/${mosque.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      aria-label={`WhatsApp ${mosque.whatsapp}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                        <MessageCircle size={16} className="text-green-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">WhatsApp</p>
                        <p className="text-slate-500 text-xs truncate">{mosque.whatsapp}</p>
                      </div>
                      <span className="text-xs text-green-400 font-semibold shrink-0">Chat</span>
                    </a>
                  )}

                  {mosque?.phone && (
                    <a
                      href={`tel:${mosque.phone}`}
                      className="flex items-center gap-3 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      aria-label={`Telepon ${mosque.phone}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                        <Phone size={16} className="text-blue-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">Telepon</p>
                        <p className="text-slate-500 text-xs truncate">{mosque.phone}</p>
                      </div>
                      <span className="text-xs text-blue-400 font-semibold shrink-0">Hubungi</span>
                    </a>
                  )}

                  {mosque?.email && (
                    <a
                      href={`mailto:${mosque.email}`}
                      className="flex items-center gap-3 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      aria-label={`Email ${mosque.email}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                        <Mail size={16} className="text-yellow-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">Email</p>
                        <p className="text-slate-500 text-xs truncate">{mosque.email}</p>
                      </div>
                      <span className="text-xs text-yellow-400 font-semibold shrink-0">Kirim</span>
                    </a>
                  )}

                  {mosque?.website && (
                    <a
                      href={mosque.website.startsWith("http") ? mosque.website : `https://${mosque.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-4 active:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      aria-label={`Website ${mosque.website}`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0" aria-hidden="true">
                        <Globe size={16} className="text-purple-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">Website</p>
                        <p className="text-slate-500 text-xs truncate">{mosque.website}</p>
                      </div>
                      <span className="text-xs text-purple-400 font-semibold shrink-0">Buka</span>
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* ── Closing dua ───────────────────────────────────── */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-5 text-center">
              <p className="text-emerald-300 font-bold text-sm mb-1">
                🤲 Jazakumullahu Khairan
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Setiap sedekah yang diberikan InsyaAllah akan menjadi amal jariyah
                yang terus mengalir pahalanya.
              </p>
            </div>

          </div>
        </div>
      </PullToRefresh>
    </PageTransition>
  );
}
