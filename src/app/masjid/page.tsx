"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, MapPin, Building2, ChevronRight, ArrowLeft,
  X, Loader2,
} from "lucide-react";
import { searchMosques, getPopularMosques } from "@/lib/mobile/mosque";
import type { MosqueRow } from "@/lib/mobile/types";

// ─── Mosque icon ──────────────────────────────────────────────────────────────
function MosqueIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <path d="M32 4 C28 4 24 8 24 12 L24 16 L8 16 L8 56 L56 56 L56 16 L40 16 L40 12 C40 8 36 4 32 4Z M28 12 C28 10 30 8 32 8 C34 8 36 10 36 12 L36 16 L28 16 Z M12 20 L52 20 L52 52 L38 52 L38 36 C38 32 35 28 32 28 C29 28 26 32 26 36 L26 52 L12 52 Z" />
    </svg>
  );
}

// ─── Mosque Card ──────────────────────────────────────────────────────────────
function MosqueCard({ mosque }: { mosque: MosqueRow }) {
  return (
    <Link
      href={`/app?slug=${mosque.slug}`}
      className="flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-emerald-300 hover:shadow-md rounded-2xl transition-all group"
    >
      <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-emerald-100">
        {mosque.logo_url ? (
          <Image
            src={mosque.logo_url}
            alt={mosque.name}
            width={56}
            height={56}
            className="object-cover w-full h-full"
          />
        ) : (
          <MosqueIcon className="w-7 h-7 text-emerald-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
          {mosque.name}
        </div>
        {(mosque.city || mosque.province) && (
          <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {[mosque.city, mosque.province].filter(Boolean).join(", ")}
          </div>
        )}
        {mosque.tagline && (
          <div className="text-xs text-gray-400 mt-0.5 truncate italic">{mosque.tagline}</div>
        )}
        {mosque.address && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">{mosque.address}</div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MasjidDirectoryPage() {
  const [query, setQuery] = useState("");
  const [mosques, setMosques] = useState<MosqueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load popular mosques on mount
  useEffect(() => {
    getPopularMosques(24).then((data) => {
      setMosques(data);
      setLoading(false);
    });
  }, []);

  // Debounced search
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearching(true);
      const data = await getPopularMosques(24);
      setMosques(data);
      setSearching(false);
      return;
    }
    setSearching(true);
    const data = await searchMosques(q, 24);
    setMosques(data);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(query), 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, runSearch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 pt-10 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-100 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Direktori Masjid</h1>
          </div>
          <p className="text-emerald-100 text-sm sm:text-base mb-8">
            Temukan masjid di sekitar Anda dan pantau informasinya secara real-time
          </p>

          {/* Search bar */}
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-lg">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama masjid, kota, atau provinsi..."
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
              autoFocus
            />
            {searching && <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />}
            {query && !searching && (
              <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Result count header */}
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {loading ? "Memuat..." : query.trim()
                ? `${mosques.length} hasil untuk "${query}"`
                : `${mosques.length} masjid terdaftar`}
            </span>
            {!query && !loading && (
              <span className="text-xs text-gray-400">Terbaru terdaftar</span>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && mosques.length === 0 && (
            <div className="py-16 text-center">
              <MosqueIcon className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium mb-1">
                {query.trim() ? `Tidak ada masjid untuk "${query}"` : "Belum ada masjid terdaftar"}
              </p>
              <p className="text-gray-300 text-sm">
                {query.trim()
                  ? "Coba kata kunci lain"
                  : "Jadilah yang pertama mendaftarkan masjid Anda"}
              </p>
              {!query.trim() && (
                <Link
                  href="/dashboard"
                  className="mt-4 inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold hover:underline"
                >
                  Daftarkan Masjid <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}

          {/* Mosque list */}
          {!loading && mosques.length > 0 && (
            <div className="divide-y divide-gray-50">
              {mosques.map((m) => (
                <div key={m.id} className="px-3 py-1.5">
                  <MosqueCard mosque={m} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Register CTA */}
        <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-800 text-sm">Masjid Anda belum terdaftar?</p>
            <p className="text-gray-500 text-xs mt-0.5">Daftarkan gratis dan mulai kelola masjid secara digital</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
          >
            Daftarkan Masjid <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
