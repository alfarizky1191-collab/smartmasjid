import Link from "next/link";
import { Landmark, MapPin } from "lucide-react";
import type { Mosque } from "./types";

/**
 * Premium mosque card used in the /masjid directory page.
 * Links to /masjid/[slug] (public mosque profile page).
 */
export default function MosqueCard({ mosque }: { mosque: Mosque }) {
  const location = [mosque.city, mosque.province].filter(Boolean).join(", ") || "Lokasi belum diatur";

  return (
    <Link
      href={`/masjid/${mosque.slug}`}
      className="group flex flex-col rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={`Lihat profil ${mosque.name}`}
    >
      {/* Top accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-emerald-400" />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Logo + name row */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-emerald-50 border border-slate-100 flex items-center justify-center">
            {mosque.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mosque.logo_url}
                alt={`Logo ${mosque.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <Landmark className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                {mosque.name}
              </h2>
              {mosque.verified && (
                <span
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold"
                  title="Masjid Terverifikasi"
                >
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={1.75} />
              {location}
            </p>
          </div>
        </div>

        {/* Address */}
        {mosque.address && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {mosque.address}
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 group-hover:text-emerald-900 transition-colors">
            Lihat Profil
            <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
