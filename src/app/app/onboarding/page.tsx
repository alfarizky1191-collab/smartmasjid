"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { useFavoriteMosque } from "@/hooks/useFavoriteMosque";
import { getPopularMosques } from "@/lib/mobile/mosque";
import { searchMosques }     from "@/lib/mobile/mosque";
import type { MosqueRow }    from "@/lib/mobile/types";
import MosqueCard from "../components/mobile/MosqueCard";
import MosqueSearchSheet from "../components/mobile/MosqueSearchSheet";

export default function OnboardingPage() {
  const router = useRouter();
  const { state, favorite, recent, selectMosque } = useFavoriteMosque();

  const [popular, setPopular]       = useState<MosqueRow[]>([]);
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [selected, setSelected]     = useState<MosqueRow | null>(null);
  const [confirming, setConfirming] = useState(false);

  // If already has a favorite, go straight to home
  useEffect(() => {
    if (state === "found") {
      router.replace("/app");
    }
  }, [state, router]);

  // Load popular mosques
  useEffect(() => {
    getPopularMosques(10).then(setPopular).catch(() => {});
  }, []);

  const handleSelect = (mosque: MosqueRow) => {
    setSelected(mosque);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    // selectMosque sets state → "found" → useEffect above fires → router.replace("/app")
    // Do NOT call router here to avoid double-navigate
    selectMosque(selected);
  };

  // Still loading from localStorage
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-14 pb-8 text-center">
        {/* Ornament */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 border-2 border-emerald-400/60 flex items-center justify-center shadow-xl shadow-emerald-900/40">
            <span className="text-4xl" aria-hidden="true">🕌</span>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-white leading-tight">
          Selamat Datang di<br />
          <span className="text-emerald-400">SmartMasjid Mobile</span>
        </h1>
        <p className="text-slate-400 text-sm mt-3 leading-relaxed">
          Pilih masjid yang ingin Anda ikuti.<br />
          Informasi sholat, pengumuman &amp; kegiatan masjid Anda.
        </p>
      </div>

      {/* Search trigger */}
      <div className="px-5 mb-5">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-slate-400 text-sm active:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label="Cari masjid"
        >
          <Search size={16} strokeWidth={2} aria-hidden="true" />
          <span>Cari nama masjid, kota, provinsi...</span>
        </button>
      </div>

      {/* Scrollable mosque list */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 space-y-5">

        {/* Recent mosques */}
        {recent.length > 0 && (
          <section aria-label="Terakhir dikunjungi">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Terakhir Dikunjungi
            </p>
            <div className="flex flex-col gap-2">
              {recent.map((m) => (
                <MosqueCard
                  key={m.mosque_id}
                  mosque={m}
                  onSelect={(mosque) => handleSelect(mosque as MosqueRow)}
                  isSelected={selected?.slug === m.slug}
                />
              ))}
            </div>
          </section>
        )}

        {/* Popular mosques */}
        {popular.length > 0 && (
          <section aria-label="Masjid terdaftar">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Masjid Terdaftar
            </p>
            <div className="flex flex-col gap-2">
              {popular.map((m) => (
                <MosqueCard
                  key={m.id}
                  mosque={m}
                  onSelect={(mosque) => handleSelect(mosque as MosqueRow)}
                  isSelected={selected?.slug === m.slug}
                  badge={selected?.slug === m.slug ? "Dipilih" : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {popular.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-3" aria-hidden="true">🕌</p>
            <p className="text-slate-400 text-sm">Gunakan kolom pencarian di atas</p>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800 px-5 py-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            {/* Selected preview */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Dipilih:</p>
              <p className="text-white text-sm font-bold truncate">{selected.name}</p>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="flex items-center gap-2 bg-emerald-500 active:bg-emerald-600 disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 shrink-0"
              aria-label={`Pilih ${selected.name} sebagai masjid favorit`}
            >
              {confirming ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              ) : (
                <>
                  Pilih Masjid
                  <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-400 font-bold py-3.5 rounded-2xl border border-slate-700 active:bg-slate-700 transition-colors"
          >
            <Search size={16} strokeWidth={2} aria-hidden="true" />
            Cari &amp; Pilih Masjid
          </button>
        )}
      </div>

      {/* Search sheet */}
      <MosqueSearchSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={(mosque) => {
          handleSelect(mosque as MosqueRow);
          setSheetOpen(false);
        }}
        recentMosques={recent}
        popularMosques={popular}
        currentSlug={selected?.slug}
        title="Pilih Masjid"
      />
    </div>
  );
}
