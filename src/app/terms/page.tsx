import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

// ─── Page metadata ────────────────────────────────────────────────────────────

export const metadata = {
  title: "Syarat & Ketentuan – SmartMasjid",
  description:
    "Syarat dan ketentuan penggunaan platform SmartMasjid untuk pengelolaan masjid digital.",
};

// ─── Section data ─────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "tentang",
    title: "1. Tentang SmartMasjid",
    content: [
      "SmartMasjid adalah platform manajemen digital untuk masjid di Indonesia. Layanan ini menyediakan dashboard administrasi, tampilan TV publik, pengelolaan keuangan, jadwal kegiatan, dan fitur donasi digital.",
      "Dengan menggunakan SmartMasjid, Anda menyetujui syarat dan ketentuan yang tercantum dalam dokumen ini. Harap baca dengan saksama sebelum mendaftarkan masjid Anda.",
    ],
  },
  {
    id: "persyaratan",
    title: "2. Persyaratan Pengguna",
    content: [
      "Untuk menggunakan SmartMasjid, pengguna wajib memenuhi persyaratan berikut:",
      "• Berusia minimal 17 tahun atau memiliki izin dari wali yang sah.",
      "• Merupakan pengurus, takmir, atau pihak yang memiliki wewenang resmi dalam pengelolaan masjid yang didaftarkan.",
      "• Memberikan informasi yang benar, lengkap, dan terkini saat mendaftar.",
      "• Memiliki akses internet yang memadai untuk menggunakan layanan.",
    ],
  },
  {
    id: "akun",
    title: "3. Akun Pengguna",
    content: [
      "Setiap masjid hanya dapat memiliki satu akun aktif. Pengguna bertanggung jawab penuh atas kerahasiaan kredensial akun (email dan password).",
      "Anda wajib segera memberitahu tim SmartMasjid jika terdapat akses tidak sah atau penyalahgunaan akun Anda.",
      "SmartMasjid tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian pengguna dalam menjaga keamanan akun.",
      "Akun yang terbukti melanggar ketentuan dapat dinonaktifkan tanpa pemberitahuan sebelumnya.",
    ],
  },
  {
    id: "penggunaan",
    title: "4. Penggunaan Layanan",
    content: [
      "Layanan SmartMasjid disediakan khusus untuk keperluan pengelolaan masjid, meliputi:",
      "• Manajemen profil dan informasi masjid.",
      "• Pengelolaan konten tampilan TV masjid.",
      "• Pencatatan transaksi keuangan.",
      "• Pengelolaan donasi dan QRIS.",
      "• Jadwal kegiatan dan pengumuman.",
      "Pengguna tidak diperkenankan menggunakan layanan untuk tujuan komersial di luar pengelolaan masjid tanpa izin tertulis dari SmartMasjid.",
    ],
  },
  {
    id: "data-masjid",
    title: "5. Data Masjid",
    content: [
      "Pengguna menyatakan bahwa seluruh data masjid yang dimasukkan ke dalam platform adalah akurat dan merupakan data resmi masjid yang bersangkutan.",
      "SmartMasjid berhak menghapus atau memblokir konten yang dinilai tidak sesuai, menyesatkan, atau melanggar hukum yang berlaku di Indonesia.",
      "Data keuangan dan transaksi yang dicatat menjadi tanggung jawab pengguna. SmartMasjid hanya menyediakan sarana pencatatan, bukan melakukan audit keuangan.",
    ],
  },
  {
    id: "larangan",
    title: "6. Larangan Penggunaan",
    content: [
      "Pengguna dilarang keras melakukan hal-hal berikut:",
      "• Mendaftar atau mengoperasikan akun atas nama masjid tanpa wewenang yang sah.",
      "• Mengunggah konten yang mengandung SARA, pornografi, atau melanggar hukum.",
      "• Melakukan manipulasi data keuangan atau donasi.",
      "• Mencoba mengakses sistem SmartMasjid secara tidak sah (hacking, scraping berlebihan, dll.).",
      "• Menggunakan layanan untuk menyebarkan spam atau konten berbahaya.",
      "• Mendistribusikan ulang atau menjual akses layanan kepada pihak lain.",
    ],
  },
  {
    id: "keamanan",
    title: "7. Keamanan",
    content: [
      "SmartMasjid menerapkan langkah-langkah keamanan standar industri untuk melindungi data pengguna, termasuk enkripsi data saat transmisi dan penyimpanan.",
      "Namun, tidak ada sistem yang sepenuhnya bebas dari risiko. Pengguna disarankan menggunakan password yang kuat dan unik, serta tidak membagikan kredensial akun kepada pihak lain.",
      "Segera laporkan potensi celah keamanan kepada tim kami melalui kontak yang tersedia.",
    ],
  },
  {
    id: "haki",
    title: "8. Hak Kekayaan Intelektual",
    content: [
      "Seluruh elemen platform SmartMasjid, termasuk desain antarmuka, kode sumber, merek dagang, logo, dan konten bawaan, adalah milik SmartMasjid dan dilindungi oleh hukum hak cipta Indonesia.",
      "Pengguna diberikan lisensi terbatas, non-eksklusif, dan tidak dapat dialihkan untuk menggunakan layanan sesuai tujuan yang dimaksud.",
      "Konten yang diunggah oleh pengguna (logo masjid, gambar slide, dll.) tetap menjadi milik pengguna. Pengguna memberikan SmartMasjid lisensi untuk menampilkan konten tersebut dalam rangka menjalankan layanan.",
    ],
  },
  {
    id: "penangguhan",
    title: "9. Penangguhan Akun",
    content: [
      "SmartMasjid berhak menangguhkan atau menghapus akun yang:",
      "• Melanggar syarat dan ketentuan ini.",
      "• Tidak aktif selama lebih dari 12 bulan berturut-turut.",
      "• Terbukti menggunakan layanan untuk tujuan yang tidak sah.",
      "Pengguna akan diberikan notifikasi melalui email terdaftar sebelum penangguhan, kecuali pada kasus pelanggaran berat yang memerlukan tindakan segera.",
    ],
  },
  {
    id: "tanggung-jawab",
    title: "10. Batas Tanggung Jawab",
    content: [
      "SmartMasjid disediakan 'sebagaimana adanya' (as-is) dan tidak menjamin layanan bebas dari gangguan atau kesalahan.",
      "SmartMasjid tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan.",
      "Batas tanggung jawab SmartMasjid dalam segala keadaan tidak akan melebihi jumlah yang dibayarkan pengguna kepada SmartMasjid dalam 3 (tiga) bulan terakhir.",
    ],
  },
  {
    id: "perubahan",
    title: "11. Perubahan Ketentuan",
    content: [
      "SmartMasjid berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan signifikan akan diinformasikan melalui email terdaftar atau notifikasi dalam platform.",
      "Dengan terus menggunakan layanan setelah perubahan diberlakukan, pengguna dianggap telah menyetujui ketentuan yang diperbarui.",
      "Tanggal pembaruan terakhir akan selalu ditampilkan di halaman ini.",
    ],
  },
  {
    id: "kontak",
    title: "12. Kontak",
    content: [
      "Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami:",
      "• Email: support@smartmasjid.id",
      "• Website: smartmasjid.id",
      "Tim kami akan merespons dalam 1–3 hari kerja.",
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <span className="text-sm font-bold text-emerald-700">SmartMasjid</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-4">
            <Scale className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Harap baca syarat dan ketentuan berikut sebelum menggunakan layanan SmartMasjid.
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Terakhir diperbarui: 6 Juli 2026
          </p>
        </div>

        {/* Table of contents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-5 sm:p-6 mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Daftar Isi
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-emerald-700 hover:text-emerald-600 hover:underline underline-offset-2 transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h2>
                <div className="flex flex-col gap-3">
                  {section.content.map((para, i) => (
                    <p key={i} className="text-sm text-gray-600 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Related link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Lihat juga:{" "}
            <Link
              href="/privacy"
              className="text-emerald-600 font-semibold hover:underline underline-offset-2 transition-colors"
            >
              Kebijakan Privasi
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-sm font-semibold text-gray-700">© 2026 SmartMasjid</p>
          <p className="text-xs text-gray-400 mt-1">
            Platform Digital Manajemen Masjid Indonesia
          </p>
        </div>
      </footer>
    </main>
  );
}
