// Server Component — static display only.
import Image from "next/image";

interface QrisCardProps {
  imageUrl: string;
  mosqueName?: string;
}

export default function QrisCard({ imageUrl, mosqueName }: QrisCardProps) {
  return (
    <section className="mx-5 mt-5" aria-label="Donasi QRIS">
      <div
        className="glass-card relative overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, rgba(2,44,34,0.30) 100%)",
          border: "1px solid rgba(52,211,153,0.15)",
        }}
      >
        {/* Decorative crescent */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[120px] select-none pointer-events-none leading-none"
          style={{ opacity: 0.04 }}
          aria-hidden="true"
        >
          ☽
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <span aria-hidden="true">📱</span>
              Donasi {mosqueName ?? "Masjid"}
            </h2>
            <p className="text-sm text-emerald-400/80">Infaq &amp; Sedekah</p>
          </div>

          <Image
            src={imageUrl}
            alt={`QR Code donasi ${mosqueName ?? "masjid"} — scan untuk berdonasi`}
            width={240}
            height={240}
            className="rounded-2xl border-2 border-amber-400/60 shadow-xl"
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
