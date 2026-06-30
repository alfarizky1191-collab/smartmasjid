"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Search, MapPin, ChevronRight, Loader2 } from "lucide-react";

interface MosqueResult {
  name: string;
  slug: string;
  city: string | null;
  province: string | null;
  logo_url: string | null;
  address: string | null;
}

export default function MosqueSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MosqueResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("mosques")
        .select("name, slug, city, province, logo_url, address")
        .or(`name.ilike.%${q}%,city.ilike.%${q}%,province.ilike.%${q}%`)
        .limit(10);

      setResults((data as MosqueResult[]) ?? []);
      setSearched(true);
      setLoading(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama masjid, kota, atau provinsi..."
          className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-white/80 bg-white text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:border-emerald-500 shadow-xl transition-colors"
        />
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {loading && (
            <div className="p-4 text-center text-slate-400 text-sm">Mencari...</div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-slate-500 text-sm">Tidak ada masjid ditemukan untuk &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul>
              {results.map((mosque, i) => (
                <li key={mosque.slug ?? i} className="border-b border-slate-100 last:border-0">
                  <Link
                    href={`/masjid/${mosque.slug}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-emerald-50 transition-colors group"
                  >
                    {/* Logo */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-emerald-100 shrink-0 flex items-center justify-center">
                      {mosque.logo_url ? (
                        <img
                          src={mosque.logo_url}
                          alt={mosque.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-emerald-600 text-lg">🕌</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {mosque.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-500 truncate">
                          {[mosque.address, mosque.city, mosque.province]
                            .filter(Boolean)
                            .join(", ") || "Lokasi belum diatur"}
                        </p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
