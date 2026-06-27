"use client";

import { useMemo, useState } from "react";
import type { Mosque } from "./types";
import MosqueCard from "./MosqueCard";
import MosqueEmpty from "./MosqueEmpty";

export default function MosqueSearch({ mosques }: { mosques: Mosque[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    if (!kw) return mosques;
    return mosques.filter(
      (m) =>
        m.name.toLowerCase().includes(kw) ||
        m.city.toLowerCase().includes(kw) ||
        m.province.toLowerCase().includes(kw)
    );
  }, [search, mosques]);

  return (
    <div className="space-y-6">
      <input
        type="search"
        placeholder="🔍 Cari nama masjid, kota atau provinsi..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Cari masjid"
        className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
      />

      <p className="text-sm text-slate-500">
        Menampilkan <span className="font-semibold">{filtered.length}</span> masjid
      </p>

      {filtered.length === 0 ? (
        <MosqueEmpty />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mosque) => (
            <MosqueCard key={mosque.id} mosque={mosque} />
          ))}
        </div>
      )}
    </div>
  );
}
