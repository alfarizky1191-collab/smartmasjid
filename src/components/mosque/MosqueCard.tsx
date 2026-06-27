import Link from "next/link";
import Image from "next/image";
import type { Mosque } from "./types";

export default function MosqueCard({ mosque }: { mosque: Mosque }) {
  return (
    <Link
      href={`/masjid/${mosque.slug}`}
      className="group rounded-3xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={`Buka portal ${mosque.name}`}
    >
      <div className="flex items-center gap-4">
        {mosque.logo_url ? (
          <Image
            src={mosque.logo_url}
            alt={`Logo ${mosque.name}`}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl" aria-hidden="true">
            🕌
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
            {mosque.name}
          </h2>
          <p className="text-sm text-slate-500">{mosque.city}, {mosque.province}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-slate-600">{mosque.address}</p>

      <div className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition group-hover:bg-emerald-600">
        Buka Portal →
      </div>
    </Link>
  );
}
