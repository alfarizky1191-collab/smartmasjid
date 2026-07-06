"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { searchMosques } from "@/lib/mobile/mosque";
import type { MosqueRow, FavoriteMosque } from "@/lib/mobile/types";
import MosqueCard from "./MosqueCard";

type MosqueItem = MosqueRow | FavoriteMosque;

interface MosqueSearchSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mosque: MosqueItem) => void;
  recentMosques?: FavoriteMosque[];
  popularMosques?: MosqueRow[];
  currentSlug?: string;
  title?: string;
}

export default function MosqueSearchSheet({
  open,
  onClose,
  onSelect,
  recentMosques = [],
  popularMosques = [],
  currentSlug,
  title = "Pilih Masjid",
}: MosqueSearchSheetProps) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<MosqueRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [animated, setAnimated]   = useState(false);

  const inputRef    = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate in/out
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setAnimated(true));
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setAnimated(false);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced search — 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setSearching(false); return; }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const data = await searchMosques(query);
      setResults(data);
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (mosque: MosqueItem) => {
    onSelect(mosque);
    onClose();
  };

  if (!open && !animated) return null;

  const showSearch  = query.trim().length > 0;
  const showRecent  = !showSearch && recentMosques.length > 0;
  const showPopular = !showSearch && popularMosques.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] bg-black/60 transition-opacity duration-300 ${animated ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[201]
          bg-slate-950 rounded-t-3xl
          transition-transform duration-350 ease-out
          max-h-[90dvh] flex flex-col
          ${animated ? "translate-y-0" : "translate-y-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-slate-700 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 shrink-0">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center active:bg-slate-700 transition-colors"
            aria-label="Tutup"
          >
            <X size={15} strokeWidth={2.5} className="text-slate-400" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-4 shrink-0">
          <div className="relative flex items-center">
            <Search
              size={16}
              className="absolute left-3.5 text-slate-500 pointer-events-none"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama masjid, kota, provinsi..."
              className={[
                "w-full bg-slate-800 text-white text-sm",
                "pl-10 pr-10 py-3 rounded-2xl",
                "border border-slate-700 focus:border-emerald-500",
                "outline-none transition-colors placeholder:text-slate-500",
              ].join(" ")}
              aria-label="Cari masjid"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 text-slate-500 active:text-white transition-colors"
                aria-label="Hapus pencarian"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Results area — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">

          {/* Search results */}
          {showSearch && (
            <section aria-label="Hasil pencarian">
              {searching ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  <span className="text-sm">Mencari...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-slate-400 text-sm font-medium">Masjid tidak ditemukan</p>
                  <p className="text-slate-600 text-xs mt-1">Coba kata kunci lain</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {results.map((m) => (
                    <MosqueCard
                      key={m.id}
                      mosque={m}
                      onSelect={handleSelect}
                      isSelected={m.slug === currentSlug}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Recent mosques */}
          {showRecent && (
            <section aria-label="Terakhir dikunjungi">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Terakhir Dikunjungi
              </p>
              <div className="flex flex-col gap-2">
                {recentMosques.map((m) => (
                  <MosqueCard
                    key={m.mosque_id}
                    mosque={m}
                    onSelect={handleSelect}
                    isSelected={m.slug === currentSlug}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Popular mosques */}
          {showPopular && (
            <section aria-label="Masjid terdaftar">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Masjid Terdaftar
              </p>
              <div className="flex flex-col gap-2">
                {popularMosques.map((m) => (
                  <MosqueCard
                    key={m.id}
                    mosque={m}
                    onSelect={handleSelect}
                    isSelected={m.slug === currentSlug}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state when no query and no lists */}
          {!showSearch && !showRecent && !showPopular && (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">🕌</p>
              <p className="text-slate-400 text-sm">Ketik nama masjid untuk mencari</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
