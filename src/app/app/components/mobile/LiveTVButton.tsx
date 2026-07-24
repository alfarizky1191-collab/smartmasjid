// Server Component — plain Next.js Link, no client interactivity.
import Link from "next/link";
import { Tv2 } from "lucide-react";

interface LiveTVButtonProps {
  slug: string;
}

export default function LiveTVButton({ slug }: LiveTVButtonProps) {
  if (!slug) return null;

  return (
    <section className="mx-5 mt-5">
      <Link
        href={`/tv/${slug}`}
        className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 active:from-emerald-700 active:via-emerald-600 active:to-teal-600 text-black font-black text-base rounded-3xl py-5 transition-all shadow-xl shadow-emerald-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label="Buka TV Display masjid di layar penuh"
      >
        {/* Live pulse dot */}
        <span
          className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse shrink-0"
          aria-hidden="true"
        />
        <Tv2 size={22} strokeWidth={2.5} aria-hidden="true" />
        Lihat TV Display
      </Link>
    </section>
  );
}
