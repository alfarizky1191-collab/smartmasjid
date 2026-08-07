import Link from "next/link";
import { Building2, Layers, BarChart2, Monitor, ArrowRight } from "lucide-react";

const HOW_STEPS = [
  { num: "01", icon: Building2, title: "Daftarkan Masjid", desc: "Buat akun dan daftarkan masjid Anda dalam hitungan menit. Gratis tanpa syarat." },
  { num: "02", icon: Layers, title: "Lengkapi Profil", desc: "Upload logo, isi nama kota, tagline, dan informasi masjid untuk tampilan yang profesional." },
  { num: "03", icon: BarChart2, title: "Kelola Dashboard", desc: "Atur pengumuman, jadwal kegiatan, donasi QRIS, dan slide foto dari dashboard admin." },
  { num: "04", icon: Monitor, title: "TV Display Siap", desc: "Buka /tv di browser TV masjid — semua informasi tampil otomatis dan real-time." },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-24" id="cara-kerja">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">Cara Kerja</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Mulai dalam 4 Langkah Mudah</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Tidak perlu keahlian teknis. SmartMasjid dirancang agar mudah digunakan oleh siapa saja.</p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_STEPS.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 group-hover:border-emerald-400 group-hover:bg-emerald-100 flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-emerald-200 group-hover:shadow-md">
                    <Icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                    {num.replace("0", "")}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/register" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-100 text-sm">
            Mulai Sekarang — Gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
