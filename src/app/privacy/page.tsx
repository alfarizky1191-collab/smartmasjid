import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi – SmartMasjid",
  description:
    "Kebijakan privasi SmartMasjid menjelaskan cara kami mengumpulkan, menggunakan, dan melindungi data Anda.",
};

const SECTIONS = [
  {
    id: "data-dikumpulkan",
    title: "1. Data yang Dikumpulkan",
    content: [
      "SmartMasjid mengumpulkan data yang Anda berikan secara langsung maupun data yang terkumpul secara otomatis saat menggunakan layanan, meliputi:",
      "• Data identitas: nama lengkap pengelola, alamat email.",
      "• Data masjid: nama masjid, lokasi (kota/kabupaten), nomor telepon masjid, logo, dan gambar slide.",
      "• Data keuangan: catatan transaksi pemasukan dan pengeluaran yang Anda masukkan.",
      "• Data donasi: catatan donasi dan informasi QRIS.",
      "• Data penggunaan: halaman yang dikunjungi, fitur yang digunakan, dan waktu akses (log sistem).",
      "• Data teknis: alamat IP, jenis browser, dan informasi perangkat.",
    ],
  },
  {
    id: "cara-penggunaan",
    title: "2. Cara Penggunaan Data",
    content: [
      "Data yang kami kumpulkan digunakan untuk tujuan-tujuan berikut:",
      "• Menyediakan dan menjalankan layanan SmartMasjid.",
      "• Mengautentikasi identitas pengguna dan menjaga keamanan akun.",
      "• Menampilkan informasi masjid pada layar TV publik dan dashboard.",
      "• Memproses dan mencatat transaksi keuangan serta donasi.",
      "• Mengirimkan notifikasi layanan penting, seperti konfirmasi pendaftaran dan pembaruan kebijakan.",
      "• Meningkatkan kualitas platform berdasarkan pola penggunaan (data anonim/agregat).",
      "• Memenuhi kewajiban hukum dan regulasi yang berlaku.",
    ],
  },
  {
    id: "perlindungan",
    title: "3. Perlindungan Data",
    content: [
      "Kami berkomitmen untuk melindungi data Anda dengan langkah-langkah berikut:",
      "• Enkripsi data saat transmisi menggunakan protokol HTTPS/TLS.",
      "• Penyimpanan data pada infrastruktur cloud Supabase dengan enkripsi at-rest.",
      "• Pembatasan akses data hanya kepada tim yang memerlukan untuk menjalankan layanan.",
      "• Pemantauan sistem secara berkala untuk mendeteksi akses tidak sah.",
      "• Kebijakan password yang kuat untuk akses internal.",
    ],
  },
  {
    id: "cookie",
    title: "4. Cookie",
    content: [
      "SmartMasjid menggunakan cookie dan teknologi penyimpanan browser serupa untuk:",
      "• Menjaga sesi login Anda tetap aktif (session token).",
      "• Menyimpan preferensi tampilan.",
      "• Menganalisis penggunaan layanan secara anonim.",
      "Anda dapat mengnonaktifkan cookie melalui pengaturan browser, namun hal ini dapat memengaruhi fungsionalitas layanan, termasuk kemampuan untuk tetap masuk ke akun.",
    ],
  },
  {
    id: "penyimpanan",
    title: "5. Penyimpanan Data",
    content: [
      "Data akun dan masjid disimpan selama akun Anda aktif. Jika akun dihapus, data terkait akan dihapus dalam waktu 30 hari, kecuali ada kewajiban hukum untuk menyimpannya lebih lama.",
      "Data log sistem disimpan maksimal 90 hari untuk keperluan keamanan dan pemecahan masalah.",
      "Data keuangan dapat disimpan lebih lama sesuai ketentuan perpajakan dan regulasi keuangan yang berlaku di Indonesia.",
    ],
  },
  {
    id: "hak-pengguna",
    title: "6. Hak Pengguna",
    content: [
      "Anda memiliki hak-hak berikut terkait data pribadi Anda:",
      "• Hak akses: meminta salinan data pribadi yang kami miliki.",
      "• Hak koreksi: memperbarui data yang tidak akurat melalui dashboard atau menghubungi kami.",
      "• Hak penghapusan: meminta penghapusan akun dan data terkait.",
      "• Hak portabilitas: meminta data dalam format yang dapat dibaca mesin.",
      "• Hak keberatan: menolak pemrosesan data untuk tujuan tertentu.",
      "Untuk menggunakan hak-hak ini, hubungi kami melalui informasi kontak di bagian akhir kebijakan ini.",
    ],
  },
  {
    id: "pembagian",
    title: "7. Pembagian Data",
    content: [
      "SmartMasjid tidak menjual data pengguna kepada pihak ketiga. Data dapat dibagikan dalam kondisi berikut:",
      "• Penyedia layanan infrastruktur: Supabase (penyimpanan data dan autentikasi), dalam batas yang diperlukan untuk menjalankan layanan.",
      "• Kewajiban hukum: jika diwajibkan oleh hukum, perintah pengadilan, atau otoritas berwenang di Indonesia.",
      "• Perlindungan hak: untuk melindungi hak, properti, atau keselamatan SmartMasjid, pengguna, atau publik.",
      "Seluruh mitra pihak ketiga wajib mematuhi kebijakan privasi yang setara dengan standar kami.",
    ],
  },
  {
    id: "keamanan",
    title: "8. Keamanan",
    content: [
      "Kami mengambil langkah wajar untuk melindungi data Anda. Namun, tidak ada metode transmisi atau penyimpanan digital yang 100% aman.",
      "Jika terjadi pelanggaran data yang berdampak pada data Anda, kami akan memberitahu Anda dalam waktu 72 jam setelah pelanggaran terdeteksi.",
      "Anda bertanggung jawab menjaga kerahasiaan password akun. Gunakan password yang kuat dan unik, serta aktifkan verifikasi dua langkah bila tersedia.",
    ],
  },
  {
    id: "perubahan",
    title: "9. Perubahan Kebijakan",
    content: [
      "Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan material akan diinformasikan melalui:",
      "• Notifikasi email ke alamat terdaftar.",
      "• Banner pemberitahuan pada dashboard.",
      "Dengan terus menggunakan layanan setelah pembaruan, Anda menyetujui kebijakan privasi yang baru. Versi sebelumnya tersimpan dan dapat diminta melalui kontak kami.",
    ],
  },
  {
    id: "hubungi",
    title: "10. Hubungi Kami",
    content: [
      "Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait kebijakan privasi ini, silakan hubungi kami:",
      "• Email: privacy@smartmasjid.id",
      "• Website: smartmasjid.biz.id",
      "Kami berkomitmen merespons setiap pertanyaan privasi dalam 3 hari kerja.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-white">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <span className="text-sm font-bold text-emerald-700">SmartMasjid</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-4">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Kebijakan Privasi</h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">Kami berkomitmen menjaga privasi dan keamanan data Anda. Halaman ini menjelaskan bagaimana SmartMasjid mengumpulkan dan menggunakan informasi Anda.</p>
          <p className="text-xs text-gray-400 mt-3">Terakhir diperbarui: 6 Juli 2026</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 p-5 sm:p-6 mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Daftar Isi</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-sm text-emerald-700 hover:text-emerald-600 hover:underline underline-offset-2 transition-colors">{s.title}</a></li>)}
          </ol>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{section.title}</h2>
                <div className="flex flex-col gap-3">
                  {section.content.map((para, i) => <p key={i} className="text-sm text-gray-600 leading-relaxed">{para}</p>)}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center"><p className="text-sm text-gray-500">Lihat juga:{" "}<Link href="/terms" className="text-emerald-600 font-semibold hover:underline underline-offset-2 transition-colors">Syarat &amp; Ketentuan</Link></p></div>
      </div>

      <footer className="border-t border-gray-100 bg-white mt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-sm font-semibold text-gray-700">© 2026 SmartMasjid</p>
          <p className="text-xs text-gray-400 mt-1">Platform Digital Manajemen Masjid Indonesia</p>
        </div>
      </footer>
    </main>
  );
}
