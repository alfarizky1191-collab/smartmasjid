import { Monitor, Smartphone, Bell, Calendar, BarChart2, Users, Wifi, Building2 } from "lucide-react";

const FEATURES = [
  { icon: Monitor, title: "TV Display Masjid", desc: "Tampilan layar TV yang menampilkan jadwal sholat, pengumuman, dan countdown adzan secara real-time." },
  { icon: Smartphone, title: "Mobile App", desc: "Aplikasi mobile untuk jamaah — lihat jadwal sholat, kegiatan, pengumuman, dan donasi kapan saja." },
  { icon: Bell, title: "Pengumuman Real-time", desc: "Kelola pengumuman masjid yang langsung tampil di TV display dan mobile app jamaah." },
  { icon: Calendar, title: "Jadwal Kegiatan", desc: "Atur dan tampilkan jadwal kajian, acara, dan kegiatan masjid dengan mudah." },
  { icon: BarChart2, title: "Laporan Keuangan", desc: "Catat pemasukan dan pengeluaran masjid, ekspor laporan PDF transparan." },
  { icon: Users, title: "Manajemen Petugas", desc: "Jadwal imam, khatib, dan muadzin tersusun rapi dan tampil otomatis di layar." },
  { icon: Wifi, title: "Donasi QRIS Digital", desc: "Tampilkan QRIS donasi di TV dan mobile. Catat otomatis setiap transaksi masuk." },
  { icon: Building2, title: "Multi-Tenant", desc: "Satu platform untuk banyak masjid. Setiap masjid punya dashboard dan tampilan sendiri." },
];

export default function Features() {
  return (
    <section className="bg-gray-50 py-16 sm:py-24" id="fitur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">Fitur Lengkap</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Semua yang Dibutuhkan Masjid Modern</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Dari dashboard admin hingga tampilan TV dan aplikasi jamaah — semua dalam satu platform terintegrasi.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group">
              <div className="w-11 h-11 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <Icon className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
