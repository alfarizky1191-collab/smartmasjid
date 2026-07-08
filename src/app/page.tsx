"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, MapPin, Smartphone, Monitor, Star, ChevronRight,
  Wifi, Bell, Calendar, BarChart2, Users, MessageCircle,
  ArrowRight, CheckCircle2, Building2, X,
  ChevronDown, Mail, Phone, HelpCircle, Layers,
} from "lucide-react";
import { searchMosques, getPopularMosques } from "@/lib/mobile/mosque";
import { supabase } from "@/lib/supabase/client";
import type { MosqueRow } from "@/lib/mobile/types";

// ─── Islamic geometric ornament (SVG inline) ─────────────────────────────────
function IslamicPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M100 10 L120 40 L155 30 L145 65 L175 80 L145 95 L155 130 L120 120 L100 150 L80 120 L45 130 L55 95 L25 80 L55 65 L45 30 L80 40 Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
      <path d="M100 30 L114 52 L139 44 L131 69 L153 80 L131 91 L139 116 L114 108 L100 130 L86 108 L61 116 L69 91 L47 80 L69 69 L61 44 L86 52 Z" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.25" />
      <circle cx="100" cy="80" r="18" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
      <circle cx="100" cy="80" r="8" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2" />
    </svg>
  );
}

function MosqueIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <path d="M32 4 C28 4 24 8 24 12 L24 16 L8 16 L8 56 L56 56 L56 16 L40 16 L40 12 C40 8 36 4 32 4Z M28 12 C28 10 30 8 32 8 C34 8 36 10 36 12 L36 16 L28 16 Z M12 20 L52 20 L52 52 L38 52 L38 36 C38 32 35 28 32 28 C29 28 26 32 26 36 L26 52 L12 52 Z" />
      <path d="M20 28 L20 44 L16 44 L16 28 Z M44 28 L44 44 L48 44 L48 28 Z" opacity="0.6" />
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <MosqueIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">SmartMasjid</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#fitur" className="hover:text-emerald-600 transition-colors">Fitur</a>
          <a href="#cara-kerja" className="hover:text-emerald-600 transition-colors">Cara Kerja</a>
          <a href="#direktori" className="hover:text-emerald-600 transition-colors">Direktori</a>
          <a href="#mobile" className="hover:text-emerald-600 transition-colors">Mobile App</a>
          <a href="#tv" className="hover:text-emerald-600 transition-colors">TV Display</a>
          <a href="#kontak" className="hover:text-emerald-600 transition-colors">Kontak</a>
          <a
            href="#donasi-support"
            className="hover:text-emerald-600 transition-colors"
          >
            Donasi
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-gray-700 hover:text-emerald-600 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Daftarkan Masjid
          </Link>
        </div>
      </div>
    </nav>
  );
}


// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [mosqueCount, setMosqueCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [mobileActive, setMobileActive] = useState<number | null>(null);

  useEffect(() => {
    // Fetch all platform stats from the server-side API route.
    // The route calls a SECURITY DEFINER RPC so RLS does not interfere.
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setMosqueCount(Number(data.mosqueCount ?? 0));
        setUserCount(Number(data.userCount ?? 0));
        setMobileActive(Number(data.mobileAppActive ?? 0));
      })
      .catch(() => {
        // Fail silently — empty state is shown via null check below
      });
  }, []);

  const fmt = (n: number | null): string => {
    if (n === null) return "...";
    if (n === 0) return "0";
    if (n < 10) return `${n}`;
    return `${n}+`;
  };

  const mosqueLabel = fmt(mosqueCount);
  const userLabel = fmt(userCount);
  const mobileLabel = fmt(mobileActive);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-16">
      {/* Background ornaments */}
      <IslamicPattern className="absolute top-10 right-8 w-64 h-64 text-emerald-400 opacity-30 pointer-events-none" />
      <IslamicPattern className="absolute bottom-20 left-4 w-48 h-48 text-teal-400 opacity-20 pointer-events-none rotate-45" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Platform Manajemen Masjid Digital #1 Indonesia
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Kelola Masjid Anda{" "}
          <span className="text-emerald-600">Lebih Cerdas</span>
          <br className="hidden sm:block" /> dan Modern
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          SmartMasjid menghadirkan dashboard admin, tampilan TV, dan aplikasi mobile untuk mempermudah pengelolaan jadwal, donasi, pengumuman, dan kegiatan masjid.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-emerald-200"
          >
            Daftarkan Masjid Anda
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-6 py-3.5 rounded-xl text-base transition-colors border border-gray-200 shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Coba Mobile App
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-8 text-center">
          {[
            { value: mosqueLabel, label: "Masjid Terdaftar" },
            { value: userLabel,   label: "Pengguna Terdaftar" },
            { value: mobileLabel, label: "Mobile App Aktif" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{s.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave separator */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 30 C360 60 1080 0 1440 30 L1440 60 L0 60 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}


// ─── Search Mosque ────────────────────────────────────────────────────────────
function MosqueSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MosqueRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const data = await searchMosques(q, 6);
    setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(query), 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, runSearch]);

  return (
    <section className="bg-white py-16 sm:py-20" id="cari">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <IslamicPattern className="w-16 h-16 text-emerald-400 mx-auto mb-4 opacity-60" />
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Temukan Masjid Anda</h2>
        <p className="text-gray-500 mb-8">Cari nama masjid, kota, atau provinsi</p>

        <div className="relative">
          <div className="flex items-center gap-3 bg-gray-50 border-2 border-gray-200 focus-within:border-emerald-500 rounded-2xl px-4 py-3 transition-colors">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              placeholder="Cari nama masjid atau kota..."
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {focused && (query || results.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
              {loading && (
                <div className="px-5 py-4 text-sm text-gray-400 text-center">Mencari...</div>
              )}
              {!loading && results.length === 0 && query.trim() && (
                <div className="px-5 py-4 text-sm text-gray-400 text-center">Tidak ditemukan</div>
              )}
              {results.map((m) => (
                <Link
                  key={m.id}
                  href={`/app?slug=${m.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {m.logo_url
                      ? <Image src={m.logo_url} alt={m.name} width={40} height={40} className="object-cover w-full h-full" />
                      : <MosqueIcon className="w-5 h-5 text-emerald-600" />
                    }
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{m.name}</div>
                    {(m.city || m.province) && (
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {[m.city, m.province].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
              <Link
                href="/masjid"
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors"
              >
                Lihat semua direktori masjid <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
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

function Features() {
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


// ─── How It Works ─────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    num: "01",
    icon: Building2,
    title: "Daftarkan Masjid",
    desc: "Buat akun dan daftarkan masjid Anda dalam hitungan menit. Gratis tanpa syarat.",
  },
  {
    num: "02",
    icon: Layers,
    title: "Lengkapi Profil",
    desc: "Upload logo, isi nama kota, tagline, dan informasi masjid untuk tampilan yang profesional.",
  },
  {
    num: "03",
    icon: BarChart2,
    title: "Kelola Dashboard",
    desc: "Atur pengumuman, jadwal kegiatan, donasi QRIS, dan slide foto dari dashboard admin.",
  },
  {
    num: "04",
    icon: Monitor,
    title: "TV Display Siap",
    desc: "Buka /tv di browser TV masjid — semua informasi tampil otomatis dan real-time.",
  },
];

function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-24" id="cara-kerja">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Cara Kerja
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Mulai dalam 4 Langkah Mudah
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tidak perlu keahlian teknis. SmartMasjid dirancang agar mudah digunakan oleh siapa saja.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_STEPS.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="flex flex-col items-center text-center group">
                {/* Circle */}
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

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-100 text-sm"
          >
            Mulai Sekarang — Gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}


// ─── Dashboard Preview ────────────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <section className="bg-gray-50 py-16 sm:py-24" id="dashboard">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Text side */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-5">
              <Layers className="w-3.5 h-3.5" /> Dashboard Admin
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-snug">
              Semua Kendali<br />di Satu Tempat
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Dashboard admin SmartMasjid memberikan kontrol penuh atas profil masjid, konten TV, keuangan, donasi, jadwal kegiatan, dan pengumuman.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Upload logo & slide foto masjid",
                "Kelola pengumuman & running text",
                "Catat & ekspor laporan keuangan PDF",
                "Manajemen donasi QRIS & petugas",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-emerald-100"
            >
              <Layers className="w-4 h-4" />
              Masuk ke Dashboard
            </Link>
          </div>

          {/* Dashboard mockup */}
          <div className="flex-shrink-0 w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 border border-gray-200 text-center max-w-xs mx-auto">
                  smartmasjid.id/dashboard
                </div>
              </div>
              {/* App layout */}
              <div className="flex h-64">
                {/* Sidebar */}
                <div className="w-36 bg-slate-900 flex flex-col py-3 px-2 gap-1 flex-shrink-0">
                  <div className="flex items-center gap-2 px-2 py-2 mb-2">
                    <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
                      <MosqueIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white text-[9px] font-bold">SmartMasjid</span>
                  </div>
                  {[
                    { label: "Dashboard", active: true },
                    { label: "TV Display", active: false },
                    { label: "Pengumuman", active: false },
                    { label: "Keuangan", active: false },
                    { label: "Donasi", active: false },
                    { label: "Kegiatan", active: false },
                  ].map(({ label, active }) => (
                    <div
                      key={label}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-medium transition-colors ${
                        active
                          ? "bg-emerald-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div className="flex-1 bg-slate-50 p-3 overflow-hidden">
                  <div className="text-[10px] font-bold text-gray-700 mb-2">Ringkasan Masjid</div>
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: "Donasi Bulan Ini", val: "Rp 2.4jt", color: "text-emerald-600" },
                      { label: "Kegiatan Aktif", val: "5", color: "text-blue-600" },
                      { label: "Pengumuman", val: "3", color: "text-yellow-600" },
                      { label: "Slide Aktif", val: "8", color: "text-purple-600" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                        <div className={`text-sm font-extrabold ${color}`}>{val}</div>
                        <div className="text-[8px] text-gray-400 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Recent activity */}
                  <div className="bg-white rounded-lg p-2 border border-gray-100">
                    <div className="text-[9px] font-bold text-gray-600 mb-1.5">Aktivitas Terbaru</div>
                    {[
                      "Pengumuman baru ditambahkan",
                      "Donasi Rp 500rb diterima",
                      "Slide foto diperbarui",
                    ].map((a) => (
                      <div key={a} className="flex items-center gap-1.5 py-1 border-t border-gray-50 first:border-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-[8px] text-gray-500 truncate">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function DirectoryPreview() {
  const [mosques, setMosques] = useState<MosqueRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPopularMosques(6).then((data) => { setMosques(data); setLoading(false); });
  }, []);

  return (
    <section className="bg-white py-16 sm:py-24" id="direktori">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">Direktori Masjid</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Masjid Terdaftar</h2>
            <p className="text-gray-500 mt-2">Bergabung bersama ratusan masjid yang sudah menggunakan SmartMasjid</p>
          </div>
          <Link href="/masjid" className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm hover:underline self-start sm:self-auto">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && mosques.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <MosqueIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Belum ada masjid terdaftar</p>
            <Link href="/register" className="mt-4 inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold hover:underline">
              Daftarkan masjid pertama <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!loading && mosques.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mosques.map((m) => (
              <Link
                key={m.id}
                href={`/app?slug=${m.slug}`}
                className="flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-emerald-300 hover:shadow-md rounded-2xl transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-emerald-100">
                  {m.logo_url
                    ? <Image src={m.logo_url} alt={m.name} width={56} height={56} className="object-cover w-full h-full" />
                    : <MosqueIcon className="w-7 h-7 text-emerald-500" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-800 truncate group-hover:text-emerald-700 transition-colors">{m.name}</div>
                  {(m.city || m.province) && (
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {[m.city, m.province].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {m.tagline && <div className="text-xs text-gray-400 mt-0.5 truncate italic">{m.tagline}</div>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Mobile Preview ───────────────────────────────────────────────────────────
function MobilePreview() {
  return (
    <section className="bg-gradient-to-br from-emerald-600 to-teal-700 py-16 sm:py-24 overflow-hidden" id="mobile">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Text side */}
          <div className="flex-1 text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-5">
              <Smartphone className="w-3.5 h-3.5" /> SmartMasjid Mobile
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 leading-snug">
              Informasi Masjid<br />di Genggaman Jamaah
            </h2>
            <p className="text-emerald-100 text-base leading-relaxed mb-8">
              Jamaah bisa memantau jadwal sholat, pengumuman, donasi, dan kegiatan langsung dari smartphone — tanpa perlu login.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Jadwal sholat & countdown adzan",
                "Pengumuman & kegiatan real-time",
                "Donasi QRIS digital",
                "Profil lengkap masjid",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-emerald-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
            >
              <Smartphone className="w-4 h-4" />
              Coba SmartMasjid Mobile
            </Link>
          </div>

          {/* Phone mockup */}
          <div className="flex-shrink-0">
            <div className="relative w-56 sm:w-64 mx-auto">
              <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl ring-4 ring-white/20">
                <div className="bg-gray-800 rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-emerald-700 px-5 pt-3 pb-2 flex justify-between items-center">
                    <span className="text-white text-xs font-semibold">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-1.5 bg-white/80 rounded-sm" />
                      <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
                    </div>
                  </div>
                  {/* App screen */}
                  <div className="bg-slate-50 px-3 py-3 space-y-2.5 min-h-[320px]">
                    <div className="flex items-center gap-2 bg-emerald-600 rounded-xl p-2.5">
                      <div className="w-7 h-7 bg-white/20 rounded-lg" />
                      <div>
                        <div className="text-white text-xs font-bold leading-tight">Masjid Al-Ikhlas</div>
                        <div className="text-emerald-200 text-[10px]">Jakarta Selatan</div>
                      </div>
                    </div>
                    <div className="bg-emerald-500 rounded-xl p-3 text-center">
                      <div className="text-white text-[10px] font-semibold mb-0.5">Adzan Maghrib dalam</div>
                      <div className="text-white text-2xl font-bold tabular-nums">01:24:38</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya", "Jumat"].map((s) => (
                        <div key={s} className="bg-white rounded-lg p-1.5 text-center shadow-sm">
                          <div className="text-emerald-600 text-[9px] font-bold">{s}</div>
                          <div className="text-gray-700 text-[10px] font-semibold mt-0.5">05:12</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl p-2 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-700 mb-1">Pengumuman</div>
                      <div className="text-[9px] text-gray-500">Kajian Sabtu pukul 08.00 bersama Ust. Ahmad</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── TV Preview ───────────────────────────────────────────────────────────────
function TVPreview() {
  return (
    <section className="bg-gray-50 py-16 sm:py-24" id="tv">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
          {/* Text side */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full mb-5">
              <Monitor className="w-3.5 h-3.5" /> TV Display
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-snug">
              Layar Informasi Masjid<br />yang Memukau
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Tampilkan jadwal sholat, countdown adzan, pengumuman, QRIS donasi, dan slide foto masjid di layar TV ukuran besar secara otomatis.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Jadwal sholat & countdown real-time",
                "Auto-play adzan & iqomah mode",
                "Slide foto dan pengumuman",
                "Koneksi Supabase real-time",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/masjid"
              className="inline-flex items-center gap-2 bg-gray-900 text-emerald-400 font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Monitor className="w-4 h-4" />
              Lihat Direktori Masjid
            </Link>
          </div>

          {/* TV mockup */}
          <div className="flex-shrink-0 w-full max-w-sm lg:max-w-md">
            <div className="bg-gray-800 rounded-2xl p-2 shadow-2xl ring-4 ring-gray-700">
              <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video flex flex-col p-3 gap-2">
                {/* TV header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <MosqueIcon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-emerald-400 text-xs font-bold">Masjid Al-Ikhlas</div>
                      <div className="text-gray-500 text-[9px]">Jakarta Selatan</div>
                    </div>
                  </div>
                  <div className="text-white text-sm font-bold tabular-nums">18:24:07</div>
                </div>
                {/* Countdown */}
                <div className="bg-emerald-500 rounded-lg p-2 text-center flex-1 flex flex-col justify-center">
                  <div className="text-black text-[9px] font-semibold">Adzan Maghrib dalam</div>
                  <div className="text-black text-2xl font-extrabold tabular-nums">00:15:42</div>
                  <div className="text-black/70 text-[9px] mt-0.5">Iqomah: 07:00</div>
                </div>
                {/* Prayer grid */}
                <div className="grid grid-cols-5 gap-1">
                  {["Subuh\n04:52", "Dzuhur\n12:15", "Ashar\n15:30", "Maghrib\n18:39", "Isya\n19:52"].map((p) => {
                    const [name, time] = p.split("\n");
                    return (
                      <div key={name} className="bg-slate-800 rounded p-1 text-center">
                        <div className="text-emerald-400 text-[7px] font-bold">{name}</div>
                        <div className="text-white text-[8px] tabular-nums">{time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* TV stand */}
            <div className="flex justify-center mt-2">
              <div className="w-16 h-2 bg-gray-700 rounded-b-lg" />
            </div>
            <div className="flex justify-center">
              <div className="w-24 h-1.5 bg-gray-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// ─── Testimonials (carousel) ──────────────────────────────────────────────────
function Testimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("id, name, role, rating, content")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(9)
      .then(({ data }) => {
        if (data && data.length > 0) setTestimonials(data);
      });
  }, []);

  // Auto-advance every 5 s
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const visible = testimonials.slice(idx, idx + 3).concat(
    idx + 3 > testimonials.length ? testimonials.slice(0, (idx + 3) % testimonials.length) : []
  );

  return (
    <section className="bg-white py-16 sm:py-24" id="testimoni">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Star className="w-3.5 h-3.5" /> Testimoni
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Dipercaya Pengurus Masjid</h2>
          <p className="text-gray-500">Apa kata mereka yang sudah menggunakan SmartMasjid</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {visible.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating || 5 }).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">&ldquo;{t.content}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dot navigation */}
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Testimoni ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "bg-emerald-500 w-5" : "bg-gray-300 hover:bg-emerald-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Apakah SmartMasjid benar-benar gratis?",
    a: "Ya, semua fitur inti SmartMasjid — dashboard admin, TV display, mobile app, jadwal sholat, pengumuman, dan donasi QRIS — dapat digunakan secara gratis oleh seluruh masjid Indonesia tanpa batasan.",
  },
  {
    q: "Bagaimana cara mendaftarkan masjid?",
    a: "Klik tombol 'Daftarkan Masjid' di halaman ini, isi formulir pendaftaran dengan nama, kota, dan email, lalu verifikasi akun Anda. Seluruh proses kurang dari 5 menit.",
  },
  {
    q: "Apakah bisa digunakan di TV apa saja?",
    a: "TV display SmartMasjid berbasis web — cukup buka browser di Smart TV, Android TV, atau komputer/laptop yang terhubung ke TV, lalu akses URL /tv masjid Anda. Tidak perlu aplikasi tambahan.",
  },
  {
    q: "Bagaimana dengan keamanan data masjid?",
    a: "Data masjid disimpan di Supabase dengan enkripsi standar industri. Setiap masjid memiliki data yang terisolasi — admin satu masjid tidak dapat mengakses data masjid lain.",
  },
  {
    q: "Apakah ada aplikasi mobile untuk jamaah?",
    a: "Ya, SmartMasjid Mobile dapat diakses melalui browser di smartphone (PWA) — tidak perlu install dari Play Store atau App Store. Jamaah dapat melihat jadwal sholat, pengumuman, dan donasi.",
  },
  {
    q: "Bagaimana jika butuh bantuan teknis?",
    a: "Tim SmartMasjid siap membantu melalui WhatsApp. Klik tombol 'Hubungi via WhatsApp' di bawah atau di bagian kontak untuk terhubung langsung dengan admin.",
  },
];

function FAQ() {
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
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-gray-800 text-sm">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-500 flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
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

// ─── Contact ──────────────────────────────────────────────────────────────────
function Contact() {
  return (
    <section className="bg-white py-16 sm:py-20" id="kontak">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Mail className="w-3.5 h-3.5" /> Kontak
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Ada Pertanyaan?</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Tim kami siap membantu Anda mendaftarkan masjid, mengatasi kendala teknis, atau menjawab pertanyaan apapun.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {[
            {
              icon: MessageCircle,
              title: "WhatsApp",
              desc: "Respon cepat via chat",
              label: "Chat Sekarang",
              href: "https://wa.me/6289656009717?text=Halo%2C+saya+ingin+bertanya+tentang+SmartMasjid",
              color: "bg-green-50 border-green-200 hover:border-green-400 text-green-700",
              iconBg: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              icon: Building2,
              title: "Daftarkan Masjid",
              desc: "Mulai dalam 5 menit",
              label: "Daftar Gratis",
              href: "/register",
              color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-700",
              iconBg: "bg-emerald-100",
              iconColor: "text-emerald-600",
            },
            {
              icon: Phone,
              title: "Telepon",
              desc: "+62 896-5600-9717",
              label: "Hubungi",
              href: "tel:+6289656009717",
              color: "bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-700",
              iconBg: "bg-blue-100",
              iconColor: "text-blue-600",
            },
          ].map(({ icon: Icon, title, desc, label, href, color, iconBg, iconColor }) => (
            <a
              key={title}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all hover:shadow-md group ${color}`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="font-bold text-gray-900 mb-1">{title}</div>
              <div className="text-sm text-gray-500 mb-4">{desc}</div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                {label} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
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
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-5 py-3 rounded-xl hover:bg-emerald-50 transition-colors text-sm shadow-lg"
          >
            <Building2 className="w-4 h-4" />
            Daftarkan Masjid Anda
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm border border-emerald-400"
          >
            <Smartphone className="w-4 h-4" />
            Coba SmartMasjid Mobile
          </Link>
          <Link
            href="/masjid"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm border border-white/20"
          >
            <MapPin className="w-4 h-4" />
            Lihat Direktori Masjid
          </Link>
          <a
            href="https://wa.me/6289656009717?text=Halo%2C+saya+ingin+mendaftarkan+masjid+ke+SmartMasjid"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Hubungi Admin via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Support SmartMasjid ─────────────────────────────────────────────────────
function SupportSmartMasjid() {
  return (
    <section id="donasi-support" className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 sm:py-24 overflow-hidden">
      {/* Islamic ornament background layers */}
      <IslamicPattern className="absolute -top-8 -right-8 w-80 h-80 text-emerald-500 opacity-10 pointer-events-none" />
      <IslamicPattern className="absolute -bottom-8 -left-8 w-64 h-64 text-amber-400 opacity-8 pointer-events-none rotate-45" />
      <IslamicPattern className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] text-emerald-400 opacity-5 pointer-events-none" />

      {/* Glowing ambient blobs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-amber-400/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* Section header */}
        <div className="text-center mb-12">
          {/* Gold ornamental divider */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/60" />
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-400" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/60" />
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Dukung Misi Kami
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-5 leading-snug">
            Dukung Pengembangan{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              SmartMasjid
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            SmartMasjid berkomitmen menyediakan platform digital yang dapat digunakan secara{" "}
            <span className="text-emerald-400 font-semibold">gratis</span> oleh masjid di seluruh Indonesia.
            <br className="hidden sm:block" />
            Dukungan Anda membantu kami mengembangkan fitur baru, menjaga server tetap online,
            meningkatkan keamanan, dan menghadirkan layanan yang lebih baik bagi seluruh jamaah.
          </p>
        </div>

        {/* Two-column cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* ── Left card: Benefits + CTA ── */}
          <div className="group relative rounded-3xl p-px bg-gradient-to-br from-emerald-500/40 via-teal-500/20 to-transparent hover:from-emerald-400/60 transition-all duration-500">
            <div className="relative h-full bg-slate-900/80 backdrop-blur-xl rounded-3xl p-7 sm:p-8 flex flex-col">
              {/* Corner ornament */}
              <IslamicPattern className="absolute top-3 right-3 w-20 h-20 text-emerald-500 opacity-15 pointer-events-none" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <MosqueIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">SmartMasjid Tetap Gratis</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Donasi Anda menjaga platform tetap berjalan</p>
                </div>
              </div>

              {/* Benefit list */}
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  { label: "Infrastruktur Cloud", icon: "🌐" },
                  { label: "Pengembangan Fitur", icon: "⚙️" },
                  { label: "Keamanan Sistem", icon: "🔒" },
                  { label: "Digitalisasi Masjid Indonesia", icon: "🕌" },
                ].map(({ label, icon }) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-xl px-4 py-3 transition-all duration-200"
                  >
                    <span className="text-base leading-none" aria-hidden="true">{icon}</span>
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <a
                href="#qris-support"
                className="relative inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold px-6 py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 text-base group"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
                Donasi Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* ── Right card: QRIS placeholder ── */}
          <div
            id="qris-support"
            className="group relative rounded-3xl p-px bg-gradient-to-br from-amber-400/40 via-yellow-500/20 to-transparent hover:from-amber-400/60 transition-all duration-500"
          >
            <div className="relative h-full bg-slate-900/80 backdrop-blur-xl rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center">
              {/* Corner ornament */}
              <IslamicPattern className="absolute top-3 left-3 w-20 h-20 text-amber-400 opacity-15 pointer-events-none" />

              <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full mb-5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
                QRIS Donasi
              </div>

              <h3 className="text-white font-bold text-xl mb-2">Scan QRIS</h3>
              <p className="text-slate-400 text-sm mb-7">Dukung SmartMasjid melalui QRIS.</p>

              {/* QRIS image */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 mb-6">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/30 to-emerald-500/20 blur-sm" />
                {/* Card */}
                <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl border-4 border-white overflow-hidden">
                  <Image
                    src="/qris-donasi.png"
                    alt="QRIS Donasi SmartMasjid"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              </div>

              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
                Scan untuk mendukung pengembangan SmartMasjid.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Donasi bersifat sukarela.</span>
          </div>
          <span className="hidden sm:block text-slate-600" aria-hidden="true">•</span>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              Semua fitur inti SmartMasjid tetap dapat digunakan secara{" "}
              <span className="text-emerald-400 font-semibold">gratis</span> oleh seluruh masjid.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400 py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand — spans 2 cols on lg */}
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

          {/* Product */}
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

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Bantuan</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#cara-kerja" className="hover:text-emerald-400 transition-colors">Cara Kerja</a></li>
              <li><a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a></li>
              <li><a href="#donasi-support" className="hover:text-emerald-400 transition-colors">Dukung Kami</a></li>
              <li>
                <a
                  href="https://wa.me/6289656009717"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  WhatsApp Admin
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {year} SmartMasjid. Semua hak dilindungi.</p>
          <p className="text-gray-600">Dibuat untuk kemajuan masjid Indonesia</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <MosqueSearch />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <DirectoryPreview />
        <MobilePreview />
        <TVPreview />
        <Testimonials />
        <FAQ />
        <Contact />
        <CTA />
        <SupportSmartMasjid />
      </main>
      <Footer />
    </>
  );
}
