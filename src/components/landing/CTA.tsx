import Link from "next/link";
import { Building2, Smartphone, MapPin, MessageCircle, ArrowRight } from "lucide-react";

function IslamicPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M100 10 L120 40 L155 30 L145 65 L175 80 L145 95 L155 130 L120 120 L100 150 L80 120 L45 130 L55 95 L25 80 L55 65 L45 30 L80 40 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M100 30 L114 52 L139 44 L131 69 L153 80 L131 91 L139 116 L114 108 L100 130 L86 108 L61 116 L69 91 L47 80 L69 69 L61 44 L86 52 Z" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.25" />
      <circle cx="100" cy="80" r="18" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="100" cy="80" r="8" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2" />
    </svg>
  );
}

export default function CTA() {
  return (
    <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 py-16 sm:py-24 overflow-hidden">
      <IslamicPattern className="absolute top-0 right-0 w-72 h-72 text-white opacity-10 pointer-events-none" />
      <IslamicPattern className="absolute bottom-0 left-0 w-56 h-56 text-white opacity-10 pointer-events-none rotate-180" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-5">
          Siap Menghadirkan Masjid Digital?
        </h2>
        <p className="text-emerald-100 text-base sm:text-lg mb-10 leading-relaxed">
          Bergabunglah bersama ratusan masjid di seluruh Indonesia yang sudah memanfaatkan SmartMasjid untuk pelayanan jamaah yang lebih baik.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-6">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-5 py-3 rounded-xl hover:bg-emerald-50 transition-colors text-sm shadow-lg">
            <Building2 className="w-4 h-4" /> Daftarkan Masjid Anda
          </Link>
          <Link href="/app" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm border border-emerald-400">
            <Smartphone className="w-4 h-4" /> Coba SmartMasjid Mobile
          </Link>
          <Link href="/masjid" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm border border-white/20">
            <MapPin className="w-4 h-4" /> Lihat Direktori Masjid
          </Link>
          <a
            href="https://wa.me/6289656009717?text=Halo%2C+saya+ingin+mendaftarkan+masjid+ke+SmartMasjid"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" /> Hubungi Admin via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
