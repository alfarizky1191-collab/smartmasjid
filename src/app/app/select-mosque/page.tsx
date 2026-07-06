"use client";

/**
 * SmartMasjid Mobile — Select Mosque Page (/app/select-mosque)
 *
 * Renders FULLSCREEN — escapes the App Shell (no bottom nav, no padding).
 * This is the first-launch experience AND the "Ganti Masjid" experience.
 *
 * Features:
 * - Live search with debounce
 * - Recent mosques (from localStorage)
 * - Popular / registered mosques
 * - "Gunakan Lokasi Saya" placeholder button
 * - Beautiful empty & loading states
 * - Safe area support (iPhone notch / Dynamic Island)
 * - After confirm → saves favorite → router.replace("/app")
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter }       from "next/navigation";
import Image               from "next/image";
import {
  Search, X, Loader2, MapPin, Navigation,
  ChevronRight, CheckCircle2, Building2,
} from "lucide-react";

import { useFavoriteMosque }  from "@/hooks/useFavoriteMosque";
import { searchMosques, getPopularMosques } from "@/lib/mobile/mosque";
import type { MosqueRow, FavoriteMosque }  from "@/lib/mobile/types";

// ─── Types ─────────────────────────────────────────────────────────────────

type AnyMosque = MosqueRow | FavoriteMosque;

function isFavorite(m: AnyMosque): m is FavoriteMosque {
  return "mosque_id" in m;
}

function mosqueId(m: AnyMosque): string {
  return isFavorite(m) ? m.mosque_id : String(m.id ?? "");
}

function mosqueSlug(m: AnyMosque): string {
  return m.slug;
}

// ─── MosqueRow for display ──────────────────────────────────────────────────

function MosqueListItem({
  mosque,
  isSelected,
  onSelect,
}: {
  mosque: AnyMosque;
  isSelected: boolean;
  onSelect: (m: AnyMosque) => void;
}) {
  const logoUrl = isFavorite(mosque) ? mosque.logo_url : (mosque.logo_url as string | null | undefined);
  const city    = isFavorite(mosque) ? mosque.city     : (mosque.city     as string | null | undefined);
  const prov    = isFavorite(mosque) ? mosque.province : (mosque.province as string | null | undefined);
  const loc     = [city, prov].filter(Boolean).join(", ");

  return (
    <button
      type="button"
      onClick={() => onSelect(mosque)}
      className={[
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-150",
        "active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
        isSelected
          ? "bg-emerald-500/15 border-emerald-500/40"
          : "bg-slate-900/70 border-slate-700/40 active:bg-slate-800/80",
      ].join(" ")}
      aria-label={`Pilih ${mosque.name}`}
      aria-pressed={isSelected}
    >
      {/* Logo */}
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo ${mosque.name}`}
          width={44}
          height={44}
          className="w-11 h-11 rounded-xl object-cover border border-slate-700/60 shrink-0"
          unoptimized={logoUrl.startsWith("http")}
        />
      ) : (
        <div
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700/60 to-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <span className="text-xl">🕌</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-bold leading-tight truncate ${isSelected ? "text-emerald-300" : "text-white"}`}>
          {mosque.name}
        </p>
        {loc && (
          <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
            <MapPin size={10} strokeWidth={2} aria-hidden="true" />
            {loc}
          </p>
        )}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SelectMosquePage() {
  const router = useRouter();
  const { state, favorite, recent, selectMosque } = useFavoriteMosque();

  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState<MosqueRow[]>([]);
  const [popular,    setPopular]    = useState<MosqueRow[]>([]);
  const [searching,  setSearching]  = useState(false);
  const [selected,   setSelected]   = useState<AnyMosque | null>(null);
  const [confirming, setConfirming] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // If already has a favorite AND was not coming from "Ganti Masjid", go home
  useEffect(() => {
    if (state === "found" && !confirming) {
      // Only auto-redirect on first load, not after selecting
      const fromGantiMasjid = sessionStorage.getItem("select_mosque_intent") === "ganti";
      if (!fromGantiMasjid) {
        router.replace("/app");
      }
    }
  }, [state, router, confirming]);

  // Load popular mosques
  useEffect(() => {
    getPopularMosques(12).then(setPopular).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); setSearching(false); return; }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const data = await searchMosques(q, 20);
      setResults(data);
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = useCallback((mosque: AnyMosque) => {
    setSelected((prev) =>
      prev && mosqueSlug(prev) === mosqueSlug(mosque) ? null : mosque
    );
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    setConfirming(true);
    // Convert FavoriteMosque → MosqueRow shape if needed
    const toSave: MosqueRow = isFavorite(selected)
      ? {
          id:        selected.mosque_id,
          slug:      selected.slug,
          name:      selected.name,
          logo_url:  selected.logo_url,
          city:      selected.city,
          province:  selected.province,
        }
      : selected;

    selectMosque(toSave);
    sessionStorage.removeItem("select_mosque_intent");
    // Navigate after a tick so selectMosque state propagates
    setTimeout(() => router.replace("/app"), 50);
  }, [selected, selectMosque, router]);

  const handleClearSearch = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  // ─── Derived display ──────────────────────────────────────────────

  const showSearch  = query.trim().length > 0;
  const showRecent  = !showSearch && recent.length > 0;
  const showPopular = !showSearch && popular.length > 0;
  const isEmpty     = !showSearch && recent.length === 0 && popular.length === 0;

  // ─── Loading state ────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <div
        className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
          <span className="text-3xl">🕌</span>
        </div>
        <p className="text-slate-400 text-sm">Memuat...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden"
      style={{
        paddingTop:    "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* ── Top area: branding + search ──────────────────────────── */}
      <div className="shrink-0 px-5 pt-8 pb-4">

        {/* Brand header */}
        <div className="flex items-center gap-3 mb-7">
          <div
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-900/40 shrink-0"
            aria-hidden="true"
          >
            <span className="text-2xl">🕌</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight">
              Pilih Masjid Anda
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              SmartMasjid Mobile
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative flex items-center mb-3">
          <Search
            size={16}
            className="absolute left-3.5 text-slate-500 pointer-events-none shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama masjid, kota, provinsi..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={[
              "w-full bg-slate-800/80 text-white text-sm",
              "pl-10 pr-10 py-3.5 rounded-2xl border",
              "border-slate-700 focus:border-emerald-500",
              "outline-none transition-colors placeholder:text-slate-500",
            ].join(" ")}
            aria-label="Cari masjid berdasarkan nama, kota, atau provinsi"
          />
          {query ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 text-slate-500 active:text-white transition-colors focus-visible:outline-none"
              aria-label="Hapus pencarian"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          ) : searching ? (
            <Loader2
              size={15}
              className="absolute right-3.5 text-slate-500 animate-spin pointer-events-none"
              aria-hidden="true"
            />
          ) : null}
        </div>

        {/* "Gunakan Lokasi Saya" — placeholder, no GPS yet */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 border border-slate-700/50 rounded-2xl py-2.5 cursor-not-allowed select-none"
          aria-label="Gunakan lokasi saya (belum tersedia)"
          title="Fitur ini akan segera hadir"
        >
          <Navigation size={13} strokeWidth={2} aria-hidden="true" />
          Gunakan Lokasi Saya
          <span className="text-[10px] text-slate-600 font-normal">(segera hadir)</span>
        </button>
      </div>

      {/* ── Scrollable mosque list ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5" role="main">

        {/* Search results */}
        {showSearch && (
          <section aria-label="Hasil pencarian">
            {searching ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                <span className="text-sm">Mencari...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center" aria-hidden="true">
                  <Building2 size={28} className="text-slate-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Masjid tidak ditemukan</p>
                  <p className="text-slate-500 text-xs mt-1">Coba kata kunci lain</p>
                </div>
              </div>
            ) : (
              <ul className="flex flex-col gap-2" role="list" aria-label="Hasil pencarian masjid">
                {results.map((m) => (
                  <li key={m.id}>
                    <MosqueListItem
                      mosque={m}
                      isSelected={selected ? mosqueSlug(selected) === m.slug : false}
                      onSelect={handleSelect}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Recent mosques */}
        {showRecent && (
          <section aria-label="Masjid terakhir dikunjungi">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
              Terakhir Dikunjungi
            </p>
            <ul className="flex flex-col gap-2" role="list">
              {recent.map((m) => (
                <li key={m.mosque_id}>
                  <MosqueListItem
                    mosque={m}
                    isSelected={selected ? mosqueSlug(selected) === m.slug : false}
                    onSelect={handleSelect}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Popular mosques */}
        {showPopular && (
          <section aria-label="Masjid terdaftar">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
              Masjid Terdaftar
            </p>
            <ul className="flex flex-col gap-2" role="list">
              {popular.map((m) => (
                <li key={m.id}>
                  <MosqueListItem
                    mosque={m}
                    isSelected={selected ? mosqueSlug(selected) === m.slug : false}
                    onSelect={handleSelect}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Empty state when no list data yet */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div
              className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-slate-700/40 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-4xl">🕌</span>
            </div>
            <div>
              <p className="text-white font-bold">Cari Masjid Anda</p>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed max-w-[220px]">
                Ketik nama masjid, kota, atau provinsi di kolom pencarian di atas.
              </p>
            </div>
          </div>
        )}

        {/* Spacer for bottom CTA */}
        <div className="h-2" aria-hidden="true" />
      </div>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 py-4 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-sm"
        aria-live="polite"
      >
        {selected ? (
          /* Mosque selected — show confirm button */
          <div className="flex items-center gap-3">
            {/* Selected mosque preview */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Dipilih</p>
              <p className="text-white text-sm font-bold truncate mt-0.5">{selected.name}</p>
              {(() => {
                const city = isFavorite(selected) ? selected.city : (selected.city as string | null | undefined);
                const prov = isFavorite(selected) ? selected.province : (selected.province as string | null | undefined);
                const loc  = [city, prov].filter(Boolean).join(", ");
                return loc ? (
                  <p className="text-[11px] text-slate-500 truncate">{loc}</p>
                ) : null;
              })()}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className={[
                "flex items-center gap-2 shrink-0",
                "bg-emerald-500 active:bg-emerald-600 text-black font-bold",
                "px-5 py-3 rounded-2xl transition-colors",
                "disabled:opacity-60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
              ].join(" ")}
              aria-label={`Gunakan ${selected.name} sebagai masjid favorit`}
            >
              {confirming ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <>
                  Gunakan Masjid Ini
                  <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* No selection yet */
          <div className="flex flex-col items-center gap-1 py-1">
            <p className="text-slate-500 text-xs text-center">
              Pilih masjid dari daftar di atas untuk melanjutkan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
