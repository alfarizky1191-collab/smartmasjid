import Link from "next/link";
import { MessageCircle } from "lucide-react";

function MosqueIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <path d="M32 4 C28 4 24 8 24 12 L24 16 L8 16 L8 56 L56 56 L56 16 L40 16 L40 12 C40 8 36 4 32 4Z M28 12 C28 10 30 8 32 8 C34 8 36 10 36 12 L36 16 L28 16 Z M12 20 L52 20 L52 52 L38 52 L38 36 C38 32 35 28 32 28 C29 28 26 32 26 36 L26 52 L12 52 Z" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400 py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <MosqueIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">SmartMasjid</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs mb-5">
              Platform digital masjid modern untuk manajemen jadwal, donasi, pengumuman, dan tampilan informasi masjid Indonesia.
            </p>
            <a
              href="https://wa.me/6289656009717"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Hubungi via WhatsApp
            </a>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Produk</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/app" className="hover:text-emerald-400 transition-colors">SmartMasjid Mobile</Link></li>
              <li><Link href="/masjid" className="hover:text-emerald-400 transition-colors">Direktori Masjid</Link></li>
              <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard Admin</Link></li>
              <li><a href="#tv" className="hover:text-emerald-400 transition-colors">TV Display</a></li>
              <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Daftarkan Masjid</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Bantuan</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#cara-kerja" className="hover:text-emerald-400 transition-colors">Cara Kerja</a></li>
              <li><a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a></li>
              <li><a href="#donasi-support" className="hover:text-emerald-400 transition-colors">Dukung Kami</a></li>
              <li><a href="https://wa.me/6289656009717" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">WhatsApp Admin</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Syarat &amp; Ketentuan</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {year} SmartMasjid. Semua hak dilindungi.</p>
          <p className="text-gray-600">Dibuat untuk kemajuan masjid Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
