"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

const FAQS = [
  { q: "Apakah SmartMasjid benar-benar gratis?", a: "Ya, semua fitur inti SmartMasjid — dashboard admin, TV display, mobile app, jadwal sholat, pengumuman, dan donasi QRIS — dapat digunakan secara gratis oleh seluruh masjid Indonesia tanpa batasan." },
  { q: "Bagaimana cara mendaftarkan masjid?", a: "Klik tombol 'Daftarkan Masjid' di halaman ini, isi formulir pendaftaran dengan nama, kota, dan email, lalu verifikasi akun Anda. Seluruh proses kurang dari 5 menit." },
  { q: "Apakah bisa digunakan di TV apa saja?", a: "TV display SmartMasjid berbasis web — cukup buka browser di Smart TV, Android TV, atau komputer/laptop yang terhubung ke TV, lalu akses URL /tv masjid Anda. Tidak perlu aplikasi tambahan." },
  { q: "Bagaimana dengan keamanan data masjid?", a: "Data masjid disimpan di Supabase dengan enkripsi standar industri. Setiap masjid memiliki data yang terisolasi — admin satu masjid tidak dapat mengakses data masjid lain." },
  { q: "Apakah ada aplikasi mobile untuk jamaah?", a: "Ya, SmartMasjid Mobile dapat diakses melalui browser di smartphone (PWA) — tidak perlu install dari Play Store atau App Store. Jamaah dapat melihat jadwal sholat, pengumuman, dan donasi." },
  { q: "Bagaimana jika butuh bantuan teknis?", a: "Tim SmartMasjid siap membantu melalui WhatsApp. Klik tombol 'Hubungi via WhatsApp' di bawah atau di bagian kontak untuk terhubung langsung dengan admin." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-gray-50 py-16 sm:py-24" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <HelpCircle className="w-3.5 h-3.5" /> FAQ
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-gray-500">Tidak menemukan jawaban? Hubungi kami langsung.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-gray-800 text-sm">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-emerald-500 flex-shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
