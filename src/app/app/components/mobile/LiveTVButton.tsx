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
        className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 active:from-emerald-700 active:to-emerald-600 text-black font-bold text-sm rounded-3xl py-4 transition-all shadow-lg shadow-emerald-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label="Buka TV Display masjid di layar penuh"
      >
        <Tv2 size={18} strokeWidth={2.5} aria-hidden="true" />
        Lihat TV Display
      </Link>
    </section>
  );
}
