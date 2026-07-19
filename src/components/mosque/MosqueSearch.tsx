"use client";

import { useMemo, useState } from "react";
import type { Mosque } from "./types";
import MosqueCard from "./MosqueCard";
import MosqueEmpty from "./MosqueEmpty";

const PAGE_SIZE = 12;

export default function MosqueSearch({ mosques }: { mosques: Mosque[] }) {
  const [search, setSearch]     = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity]         = useState("");
  const [page, setPage]         = useState(1);

  // Sorted unique provinces & cities
  const provinces = useMemo(
    () => [...new Set(mosques.map((m) => m.province).filter(Boolean))].sort(),
    [mosques]
  );

  const cities = useMemo(() => {
    const source = province
      ? mosques.filter((m) => m.province === province)
      : mosques;
    return [...new Set(source.map((m) => m.city).filter(Boolean))].sort();
  }, [mosques, province]);

  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return mosques.filter((m) => {
      const matchSearch =
        !kw ||
        m.name.toLowerCase().includes(kw) ||
        m.city.toLowerCase().includes(kw) ||
        m.province.toLowerCase().includes(kw);
      const matchProvince = !province || m.province === province;
      const matchCity     = !city     || m.city     === city;
      return matchSearch && matchProvince && matchCity;
    });
  }, [mosques, search, province, city]);

  // Reset to page 1 whenever filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetFilters() {
    setSearch("");
    setProvince("");
    setCity("");
    setPage(1);
  }

  const hasFilters = search || province || city;

  return (
    <div className="space-y-6">
      {/* ── Search bar ──────────────────────────────────────────────── */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
          🔍
        </span>
        <input
          type="search"
          placeholder="Cari nama masjid, kota atau provinsi..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          aria-label="Cari masjid"
          className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-5 py-3.5 text-base shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
        />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <select
          value={province}
          onChange={(e) => { setProvince(e.target.value); setCity(""); setPage(1); }}
          aria-label="Filter provinsi"
          className="flex-1 min-w-[160px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Semua Provinsi</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={city}
          onChange={(e) => { setCity(e.target.value); setPage(1); }}
          aria-label="Filter kota"
          disabled={!province}
          className="flex-1 min-w-[160px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Semua Kota</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 hover:text-red-500 hover:border-red-200 shadow-sm transition-colors"
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* ── Result count ────────────────────────────────────────────── */}
      <p className="text-sm text-slate-500">
        Menampilkan{" "}
        <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
        masjid{filtered.length !== mosques.length && (
          <> dari <span className="font-semibold text-slate-700">{mosques.length}</span> total</>
        )}
      </p>

      {/* ── Cards grid ──────────────────────────────────────────────── */}
      {paginated.length === 0 ? (
        <MosqueEmpty />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((mosque) => (
            <MosqueCard key={mosque.id} mosque={mosque} />
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4" role="navigation" aria-label="Navigasi halaman">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-sm text-sm"
            aria-label="Halaman sebelumnya"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={`w-9 h-9 rounded-xl border text-sm font-semibold transition-colors shadow-sm ${
                    safePage === item
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                  aria-current={safePage === item ? "page" : undefined}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-sm text-sm"
            aria-label="Halaman berikutnya"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
