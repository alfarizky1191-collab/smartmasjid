// Server Component — static display only.
import Image from "next/image";

interface QrisCardProps {
  imageUrl: string;
  mosqueName?: string;
}

export default function QrisCard({ imageUrl, mosqueName }: QrisCardProps) {
  return (
    <section className="mx-5 mt-5" aria-label="Donasi QRIS">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 p-5">
        {/* Decorative */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[80px] opacity-5 select-none pointer-events-none leading-none" aria-hidden="true">
          ☽
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <span aria-hidden="true">📱</span>
            Donasi {mosqueName ?? "Masjid"}
          </h2>

          <Image
            src={imageUrl}
            alt={`QR Code donasi ${mosqueName ?? "masjid"} — scan untuk berdonasi`}
            width={208}
            height={208}
            className="rounded-2xl border-2 border-emerald-400 shadow-lg shadow-emerald-900/40"
            unoptimized={imageUrl.startsWith("http")}
          />

          <p className="text-slate-400 text-xs text-center">
            Scan QRIS untuk infaq &amp; donasi masjid
          </p>
        </div>
      </div>
    </section>
  );
}
