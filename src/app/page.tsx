import Link from "next/link";
import {
  Clock3,
  Megaphone,
  CalendarDays,
  UsersRound,
  MonitorPlay,
  Presentation,
  WalletCards,
  Landmark,
  Search,
  PhoneCall,
  Mail,
  MapPin,
  Check,
  Building2,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import MosqueSearch from "@/components/landing/MosqueSearch";
import AnimatedCounter from "@/components/landing/AnimatedCounter";
import type { Mosque } from "@/components/mosque/types";

export const metadata: Metadata = {
  title: "SmartMasjid — Digitalisasi Masjid Indonesia",
  description:
    "Platform manajemen masjid modern. Jadwal sholat, pengumuman, donasi QRIS, TV Display, dan banyak lagi — dalam satu platform.",
};

// ─── Server-side data ────────────────────────────────────────────────────────
async function getStats() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const [mosqueRes, eventRes, announcementRes] = await Promise.all([
      supabase.from("mosques").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("announcements").select("id", { count: "exact", head: true }),
    ]);
    return {
      mosques:       mosqueRes.count       ?? 0,
      events:        eventRes.count        ?? 0,
      announcements: announcementRes.count ?? 0,
    };
  } catch {
    return { mosques: 0, events: 0, announcements: 0 };
  }
}

type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatar_url: string | null;
};

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await supabase
      .from("testimonials")
      .select("id, quote, name, role, avatar_url")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6);
    return (data as Testimonial[]) ?? [];
  } catch {
    return [];
  }
}

async function getFeaturedMosques(): Promise<Mosque[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from("mosques")
      .select("id, name, slug, city, province, logo_url")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) {
      console.error("[homepage] getFeaturedMosques error:", error);
      return [];
    }
    return (data as Mosque[]) ?? [];
  } catch (err) {
    console.error("[homepage] getFeaturedMosques exception:", err);
    return [];
  }
}

// ─── Feature list ─────────────────────────────────────────────────────────────
type Feature = { Icon: LucideIcon; title: string; desc: string };

const FEATURES: Feature[] = [
  { Icon: Clock3,       title: "Jadwal Sholat",   desc: "Tampilkan jadwal sholat otomatis berdasarkan lokasi masjid dengan hitung mundur adzan." },
  { Icon: Megaphone,    title: "Pengumuman",       desc: "Kelola dan tampilkan pengumuman masjid secara realtime ke layar TV dan portal jamaah." },
  { Icon: CalendarDays, title: "Agenda Masjid",    desc: "Kelola jadwal kajian, seminar, dan kegiatan masjid lengkap dengan informasi pemateri." },
  { Icon: UsersRound,   title: "Petugas",          desc: "Atur jadwal imam, muadzin, khatib, dan petugas masjid lainnya per hari." },
  { Icon: MonitorPlay,  title: "TV Display",       desc: "Tampilan layar TV masjid yang cantik — jadwal sholat, slide, donasi, dan pengumuman." },
  { Icon: Presentation, title: "Slide Informasi",  desc: "Upload dan tampilkan slide gambar informasi di layar TV masjid secara otomatis." },
  { Icon: WalletCards,  title: "QRIS Donasi",      desc: "Terima donasi digital via QRIS dan catat riwayat donasi jamaah secara transparan." },
  { Icon: Landmark,     title: "Profil Masjid",    desc: "Buat profil digital masjid lengkap dengan logo, lokasi, dan link publik unik." },
];

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Cari Masjid",              desc: "Ketik nama masjid, kota, atau provinsi di kolom pencarian." },
  { n: "02", title: "Lihat Informasi",           desc: "Buka profil masjid — jadwal sholat, pengumuman, agenda, dan petugas." },
  { n: "03", title: "Datang ke Masjid",          desc: "Hadir tepat waktu berbekal informasi lengkap dari SmartMasjid." },
  { n: "04", title: "Nikmati Layanan SmartMasjid", desc: "Rasakan pengalaman ibadah yang lebih nyaman dengan informasi digital." },
];


// ─── Geometric ornament SVG (subtle Islamic pattern) ─────────────────────────
function GeometricOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M100 10 L190 55 L190 145 L100 190 L10 145 L10 55 Z" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
      <path d="M100 30 L170 67.5 L170 132.5 L100 170 L30 132.5 L30 67.5 Z" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M100 50 L150 80 L150 120 L100 150 L50 120 L50 80 Z" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <circle cx="100" cy="100" r="12" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <circle cx="100" cy="100" r="4" fill="currentColor" opacity="0.3" />
      {[0,60,120,180,240,300].map((deg) => {
        const r = 100 * Math.PI / 180;
        const angle = deg * Math.PI / 180;
        const x = 100 + 60 * Math.cos(angle);
        const y = 100 + 60 * Math.sin(angle);
        return <circle key={deg} cx={x} cy={y} r="3" fill="currentColor" opacity="0.25" />;
      })}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const [stats, testimonials, featuredMosques] = await Promise.all([
    getStats(),
    getTestimonials(),
    getFeaturedMosques(),
  ]);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
              <Landmark className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <span className="text-xl font-bold text-slate-900">SmartMasjid</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#beranda"    className="hover:text-emerald-600 transition-colors">Beranda</a>
            <a href="#cari-masjid" className="hover:text-emerald-600 transition-colors">Cari Masjid</a>
            <Link href="/masjid"  className="hover:text-emerald-600 transition-colors">Direktori</Link>
            <a href="#fitur"      className="hover:text-emerald-600 transition-colors">Fitur</a>
            <a href="#tentang"    className="hover:text-emerald-600 transition-colors">Tentang</a>
            <a href="#kontak"     className="hover:text-emerald-600 transition-colors">Kontak</a>
          </nav>

          {/* CTA */}
          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Landmark className="w-4 h-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Daftarkan Masjid Anda</span>
            <span className="sm:hidden">Daftar</span>
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section id="beranda" className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800">
        {/* Geometric ornaments */}
        <GeometricOrnament className="absolute -top-16 -left-16 w-80 h-80 text-white/10 pointer-events-none" />
        <GeometricOrnament className="absolute -bottom-20 -right-20 w-96 h-96 text-white/10 pointer-events-none" />
        <GeometricOrnament className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] text-white/5 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/30 text-white text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            Platform Manajemen Masjid Modern
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Digitalisasi Masjid Indonesia
            <br />
            <span className="text-[#D4AF37]">Dalam Satu Platform</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto mb-12 leading-relaxed">
            SmartMasjid membantu pengurus masjid mengelola jadwal sholat, pengumuman, donasi QRIS,
            petugas, dan tampilan TV — semuanya terintegrasi dan mudah digunakan.
          </p>

          {/* Search */}
          <div id="cari-masjid" className="scroll-mt-20">
            <MosqueSearch />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATISTICS
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative -mt-1 bg-white border-b border-slate-100">
        {/* Gold divider line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <div className="max-w-4xl mx-auto px-4 py-14 grid grid-cols-3 gap-6 text-center">
          {[
            { Icon: Landmark,     label: "Total Masjid",      value: stats.mosques },
            { Icon: CalendarDays, label: "Total Event",        value: stats.events },
            { Icon: Megaphone,    label: "Total Pengumuman",   value: stats.announcements },
          ].map(({ Icon, label, value }) => (
            <div key={label}>
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-emerald-700" strokeWidth={1.75} />
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700">
                <AnimatedCounter target={value} />
              </div>
              <div className="text-sm text-slate-500 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════════ */}
      <section id="fitur" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-3">Fitur Unggulan</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Semua yang Dibutuhkan Masjid Anda</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Dari jadwal sholat hingga laporan keuangan — SmartMasjid menyediakan semua alat untuk masjid modern.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col"
              >
                {/* Icon circle */}
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shrink-0">
                  <Icon className="w-6 h-6 text-emerald-700" strokeWidth={1.75} />
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{desc}</p>

                {/* Footer link */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:text-emerald-800 transition-colors">
                    Pelajari lebih lanjut
                    <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TV DISPLAY PREVIEW
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-3">TV Display</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5">
              Layar Informasi Masjid yang Cantik
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
              Tampilkan jadwal sholat, pengumuman, donasi QRIS, agenda kegiatan, dan slide informasi
              langsung dari satu layar TV masjid yang elegan.
            </p>
            <ul className="space-y-3 text-slate-700 text-sm max-w-sm mx-auto lg:mx-0">
              {["Hitung mundur adzan & iqomah otomatis","Slide gambar informasi","Donasi QRIS realtime","Petugas sholat hari ini","Running text pengumuman"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-700" strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* TV Mockup */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* TV frame */}
              <div className="bg-slate-900 rounded-2xl p-3 shadow-2xl ring-1 ring-slate-700">
                {/* Screen */}
                <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video relative">
                  {/* TV content mockup */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 p-4 flex flex-col gap-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Landmark className="w-4 h-4 text-white" strokeWidth={1.75} />
                        </div>
                        <div>
                          <div className="h-2 w-24 bg-emerald-400 rounded-full" />
                          <div className="h-1.5 w-16 bg-slate-600 rounded-full mt-1" />
                        </div>
                      </div>
                      <div className="text-emerald-400 font-mono text-sm font-bold">05:32:18</div>
                    </div>
                    {/* Countdown */}
                    <div className="bg-emerald-500 rounded-lg p-2 text-center">
                      <div className="text-[10px] text-black font-bold">Adzan Dzuhur dalam</div>
                      <div className="text-xl font-extrabold text-black font-mono">06:28:44</div>
                    </div>
                    {/* Prayer times */}
                    <div className="grid grid-cols-3 gap-1">
                      {["Subuh 04:30","Dzuhur 11:56","Ashar 15:20"].map((p) => (
                        <div key={p} className="bg-slate-800 rounded-lg p-1 text-center">
                          <div className="text-[9px] text-emerald-400 font-bold">{p.split(" ")[0]}</div>
                          <div className="text-[10px] text-white font-mono font-bold">{p.split(" ")[1]}</div>
                        </div>
                      ))}
                    </div>
                    {/* Slide placeholder */}
                    <div className="flex-1 bg-gradient-to-br from-emerald-900/40 to-slate-800 rounded-lg flex items-center justify-center gap-1.5">
                      <Presentation className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
                      <span className="text-emerald-400 text-xs">Slide Informasi</span>
                    </div>
                    {/* Running text */}
                    <div className="bg-slate-800 rounded px-2 py-1 overflow-hidden">
                      <div className="text-[9px] text-emerald-400 whitespace-nowrap animate-marquee-slow">
                        Pengumuman: Kajian Rutin Malam Jumat Ba&apos;da Isya — Semua Jamaah Diundang
                      </div>
                    </div>
                  </div>
                </div>
                {/* TV stand */}
                <div className="flex justify-center mt-2">
                  <div className="w-8 h-2 bg-slate-700 rounded" />
                </div>
              </div>
              <div className="flex justify-center mt-1">
                <div className="w-24 h-1.5 bg-slate-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════════════ */}
      <section id="tentang" className="py-24 px-4 sm:px-6 lg:px-8 bg-emerald-700 relative overflow-hidden scroll-mt-16">
        <GeometricOrnament className="absolute -right-16 top-1/2 -translate-y-1/2 w-80 h-80 text-white/10 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#D4AF37] font-semibold text-sm uppercase tracking-widest mb-3">Cara Kerja</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Mudah dalam 4 Langkah</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-px bg-white/20 -translate-y-1/2 z-0" />
                )}
                <div className="relative bg-white/10 border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-[#D4AF37] text-slate-900 font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {step.n}
                  </div>
                  <h3 className="text-white font-bold mb-2">{step.title}</h3>
                  <p className="text-emerald-100 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TESTIMONIALS — only shown when real data exists in DB
      ════════════════════════════════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-3">Testimoni</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Dipercaya Pengurus Masjid</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-[#D4AF37] text-sm">★</span>
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {t.avatar_url ? (
                        <Image
                          src={t.avatar_url}
                          alt={t.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        t.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED MOSQUES
      ════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-3">Masjid Terdaftar</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Masjid Unggulan</h2>
              <p className="text-slate-500 mt-2 max-w-md">
                Masjid-masjid terbaru yang bergabung dengan SmartMasjid.
              </p>
            </div>
            <Link
              href="/masjid"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-emerald-600 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors"
            >
              Lihat Semua Masjid →
            </Link>
          </div>

          {featuredMosques.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Landmark className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
                </div>
              </div>
              <p className="font-medium">Belum ada masjid terdaftar.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredMosques.map((mosque) => (
                <Link
                  key={mosque.id}
                  href={`/masjid/${mosque.slug}`}
                  className="group flex flex-col rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label={`Lihat profil ${mosque.name}`}
                >
                  {/* Top accent */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-emerald-400" />

                  <div className="flex flex-col flex-1 p-5 gap-4">
                    {/* Logo + name */}
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-emerald-50 border border-slate-100 flex items-center justify-center">
                        {mosque.logo_url ? (
                          <Image
                            src={mosque.logo_url}
                            alt={`Logo ${mosque.name}`}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Landmark className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
                            {mosque.name}
                          </h3>
                          {mosque.verified && (
                            <span
                              className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold"
                              title="Masjid Terverifikasi"
                            >
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={1.75} />
                          <span className="truncate">
                            {[mosque.city, mosque.province].filter(Boolean).join(", ") || "Lokasi belum diatur"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-auto pt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-900 transition-colors">
                        Lihat Profil
                        <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center mt-10">
            <Link
              href="/masjid"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4" strokeWidth={2} />
              Lihat Semua Masjid
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════════════════════════════ */}
      <section id="kontak" className="py-24 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Ornament */}
          <div className="flex justify-center mb-6">
            <GeometricOrnament className="w-20 h-20 text-emerald-200" />
          </div>

          <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-3">Mulai Sekarang</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Siap Mendigitalisasi Masjid Anda?
          </h2>
          <p className="text-slate-500 mb-10 max-w-lg mx-auto leading-relaxed">
            Daftarkan masjid Anda dan kelola seluruh aktivitas masjid melalui SmartMasjid — gratis dan mudah.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Landmark className="w-5 h-5" strokeWidth={1.75} />
              Daftarkan Masjid Anda
            </Link>
            <a
              href="https://wa.me/6289656009717"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold transition-all hover:-translate-y-0.5"
            >
              <PhoneCall className="w-5 h-5" strokeWidth={1.75} />
              Hubungi Admin
            </a>
          </div>

          {/* WhatsApp note */}
          <p className="text-slate-400 text-sm mt-6">
            Butuh bantuan?{" "}
            <a
              href="https://wa.me/6289656009717"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-semibold hover:underline"
            >
              WhatsApp 089656009717
            </a>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-900 text-white">
        {/* Gold top line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid sm:grid-cols-3 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
                  <Landmark className="w-5 h-5 text-white" strokeWidth={1.75} />
                </div>
                <span className="text-xl font-bold">SmartMasjid</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Platform manajemen masjid digital untuk Indonesia. Mendigitalisasi masjid dengan teknologi modern.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-widest">Menu</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><a href="#tentang"    className="hover:text-emerald-400 transition-colors">Tentang</a></li>
                <li><a href="#kontak"     className="hover:text-emerald-400 transition-colors">Kontak</a></li>
                <li><a href="#"           className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#"           className="hover:text-emerald-400 transition-colors">Syarat &amp; Ketentuan</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-widest">Kontak</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
                  <a
                    href="https://wa.me/6289656009717"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    089656009717
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
                  <a href="mailto:admin@smartmasjid.id" className="hover:text-emerald-400 transition-colors">
                    admin@smartmasjid.id
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} SmartMasjid. Made for mosques, by muslims.</p>
            <div className="flex items-center gap-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem aktif</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes marquee-slow {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-slow {
          animation: marquee-slow 18s linear infinite;
          display: inline-block;
        }
      `}</style>

    </div>
  );
}
