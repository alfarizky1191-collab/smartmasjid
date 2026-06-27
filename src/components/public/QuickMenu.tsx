const MENU = [
  { icon: "🕐", label: "Waktu Sholat", href: "#sholat" },
  { icon: "📢", label: "Pengumuman", href: "#pengumuman" },
  { icon: "📅", label: "Kegiatan", href: "#kegiatan" },
  { icon: "👤", label: "Petugas", href: "#petugas" },
  { icon: "💛", label: "Donasi", href: "#donasi" },
  { icon: "📍", label: "Lokasi", href: "#lokasi" },
];

export default function QuickMenu() {
  return (
    <nav aria-label="Menu cepat" className="bg-white shadow-sm sticky top-0 z-40 border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-3 overflow-x-auto">
        <div className="flex gap-3 min-w-max md:justify-center">
          {MENU.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-slate-700 text-center min-w-[72px]"
            >
              <span className="text-2xl" aria-hidden="true">{item.icon}</span>
              <span className="text-xs font-semibold whitespace-nowrap">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
