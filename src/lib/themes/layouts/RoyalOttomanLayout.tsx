"use client";

import type { TVDisplayProps } from "./types";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIqomah(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Gold ornamental divider SVG
function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="10" x2="160" y2="10" stroke="#d4a843" strokeWidth="1" strokeOpacity="0.6"/>
      <circle cx="200" cy="10" r="6" fill="#d4a843" fillOpacity="0.8"/>
      <circle cx="180" cy="10" r="3" fill="#d4a843" fillOpacity="0.5"/>
      <circle cx="220" cy="10" r="3" fill="#d4a843" fillOpacity="0.5"/>
      <line x1="240" y1="10" x2="400" y2="10" stroke="#d4a843" strokeWidth="1" strokeOpacity="0.6"/>
    </svg>
  );
}

// Arch ornament top border
function ArchBorder() {
  return (
    <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
  );
}

// Prayer card for the jadwal panel
function PrayerCard({ name, time, isNext }: { name: string; time?: string; isNext?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
        isNext
          ? "bg-amber-500/20 border border-amber-400/60"
          : "bg-black/20 border border-amber-900/30"
      }`}
    >
      <span className={`text-lg font-semibold ${isNext ? "text-amber-300" : "text-amber-100/80"}`}>
        {name}
      </span>
      <span className={`text-xl font-bold font-mono ${isNext ? "text-amber-300" : "text-amber-100"}`}>
        {time ?? "--:--"}
      </span>
    </div>
  );
}

// Islamic Corner Ornament component
function IslamicCornerOrnament({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0 H100 V10 C100 50 50 100 10 100 H0 Z" fill="currentColor" opacity="0.1" />
      <path d="M0 2 V98 H98" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M0 6 V94 H94" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
      <path d="M40 0 C40 20 20 40 0 40" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function RoyalOttomanLayout({
  mosque,
  time,
  prayerGrid,
  nextPrayer,
  countdown,
  showAdzan,
  currentPrayer,
  iqomahCountdown,
  showPrayerMode,
  autoAdzanEnabled,
  setAutoAdzanEnabled,
  stopAdzan,
  goFullscreen,
  onTestAdzan,
  onTestAlarm,
  isFriday,
  showJumatMode,
  announcements,
  events,
  slides,
  currentSlide,
  todayOfficers,
  qrisUrl,
}: TVDisplayProps) {
  const today = new Date();
  const dayName = today.toLocaleDateString("id-ID", { weekday: "long" }).toUpperCase();
  const dateStr = today.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const hijriStr = today.toLocaleDateString("id-TN-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ─── Adzan / Prayer overlay ──────────────────────────────────────────────
  if (showAdzan) {
    const isIqomahPhase = iqomahCountdown > 0 && !showAdzan; // akan selalu false di sini — cek lewat prop
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 text-white p-8"
        style={{
          background: isIqomahPhase
            ? "linear-gradient(135deg, #0b1a2e 0%, #064e3b 100%)"
            : "linear-gradient(135deg, #78350f 0%, #92400e 50%, #78350f 100%)",
          fontFamily: "'Playfair Display', serif",
        }}>
        <div className="text-8xl">🕌</div>
        <h1 className="text-8xl font-bold text-amber-300 text-center animate-pulse">
          ADZAN {currentPrayer.toUpperCase()}
        </h1>
        <p className="text-5xl text-amber-100 animate-bounce">Hayya &apos;alash Shalah</p>
        <p className="text-3xl text-amber-200/80">Mari tinggalkan aktivitas sejenak</p>
        <p className="text-3xl text-amber-200/80">📵 Mohon tenang &amp; matikan HP</p>
        <div className="mt-4 bg-amber-900/40 rounded-2xl px-10 py-6 border border-amber-500/30">
          <p className="text-2xl text-center text-amber-300 font-semibold uppercase tracking-widest">Iqomah dalam</p>
          <p className="text-6xl font-bold text-center text-white font-mono mt-2">
            {formatIqomah(iqomahCountdown)}
          </p>
        </div>
        <button onClick={stopAdzan} className="mt-4 bg-red-600 px-10 py-4 rounded-2xl text-white text-2xl font-bold hover:bg-red-700 cursor-pointer">
          Stop Adzan
        </button>
      </div>
    );
  }

  if (showPrayerMode) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center text-center p-8 animate-page-fade">
        <p className="text-5xl md:text-6xl font-bold text-white tracking-wide leading-relaxed max-w-5xl"
           style={{ fontFamily: "'Playfair Display', serif" }}>
          {mosque?.shaf_message || "Harap rapatkan dan luruskan barisan shaf sholat"}
        </p>
      </div>
    );
  }

  // ─── Main 3-panel layout ──────────────────────────────────────────────────
  return (
    <div
      className="h-screen w-full relative overflow-hidden flex flex-col p-5 select-none"
      style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
    >
      {/* ── Background image + overlay ── */}
      <div className="absolute inset-0 z-0">
        {/* Dark navy base */}
        <div className="absolute inset-0 bg-[#0b1a2e]" />

        {/* Mosque silhouette background */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1920&q=80")`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1a2e]/80 via-transparent to-[#0b1a2e]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1a2e]/70 via-transparent to-[#0b1a2e]/70" />

        {/* Gold vignette top */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
        {/* Gold vignette bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      </div>

      {/* ── Islamic geometric pattern overlay ── */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a843' fill-opacity='1'%3E%3Cpath d='M30 0l7.5 22.5L60 30l-22.5 7.5L30 60l-7.5-22.5L0 30l22.5-7.5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Islamic corner ornaments ── */}
      <IslamicCornerOrnament className="absolute top-4 left-4 w-20 h-20 text-[#d4a843] opacity-25 rotate-0 pointer-events-none z-0" />
      <IslamicCornerOrnament className="absolute top-4 right-4 w-20 h-20 text-[#d4a843] opacity-25 -rotate-90 pointer-events-none z-0" />
      <IslamicCornerOrnament className="absolute bottom-4 left-4 w-20 h-20 text-[#d4a843] opacity-25 rotate-90 pointer-events-none z-0" />
      <IslamicCornerOrnament className="absolute bottom-4 right-4 w-20 h-20 text-[#d4a843] opacity-25 rotate-180 pointer-events-none z-0" />

      {/* ── Content ── */}
      <div className="relative z-10 h-full flex flex-col gap-4 min-h-0">

        {/* ═══ TOP BAR: Date | Mosque Name | Time ═══ */}
        <div className="flex items-center justify-between px-2 flex-shrink-0">

          {/* Date left */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm">📅</span>
              <span className="text-amber-200 text-lg font-semibold tracking-wide">{dayName}</span>
            </div>
            <span className="text-amber-100 text-base">{dateStr}</span>
            <span className="text-amber-400/70 text-sm">{hijriStr}</span>
          </div>

          {/* Center: mosque name + bismillah */}
          <div className="flex flex-col items-center gap-1 flex-1 px-4">
            {/* Bismillah arabic */}
            <p className="text-amber-300/90 text-2xl" style={{ fontFamily: "'Amiri', 'Arial', serif" }}>
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
            </p>
            <GoldDivider className="w-64" />
            <div className="flex items-center gap-3">
              {mosque?.logo_url && (
                <img
                  src={mosque.logo_url}
                  alt="Logo"
                  className="w-12 h-12 rounded-full object-cover shadow-md"
                  style={{ border: "2px solid #d4a843" }}
                />
              )}
              <h1 className="text-3xl font-bold text-amber-100 tracking-widest text-center uppercase">
                {mosque?.name}
              </h1>
            </div>
            {mosque?.tagline && (
              <p className="text-amber-400/80 text-xs tracking-wider">◆ {mosque.tagline} ◆</p>
            )}
          </div>

          {/* Right: time + control buttons */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-col items-end">
              <span className="text-amber-400 text-sm tracking-widest uppercase">Waktu Saat Ini</span>
              <span className="text-amber-100 text-4xl font-bold font-mono tracking-wider">{time}</span>
              <span className="text-amber-400/70 text-xs">WIB</span>
            </div>
            {/* Control buttons */}
            <div className="flex flex-wrap gap-1.5 justify-end">
              <button
                onClick={goFullscreen}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                style={{ background: "rgba(212,168,67,0.2)", color: "#fcd34d", border: "1px solid rgba(212,168,67,0.3)" }}
              >
                ⛶ Fullscreen
              </button>
              <button
                onClick={() => setAutoAdzanEnabled(!autoAdzanEnabled)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                style={{
                  background: autoAdzanEnabled ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                  color: autoAdzanEnabled ? "#6ee7b7" : "#fca5a5",
                  border: `1px solid ${autoAdzanEnabled ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                {autoAdzanEnabled ? "🔔 Adzan ON" : "🔕 Adzan OFF"}
              </button>
              {onTestAdzan && (
                <button onClick={onTestAdzan} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-blue-900/40 text-blue-300 border border-blue-700/30 cursor-pointer">
                  ▶ Test Adzan
                </button>
              )}
              {onTestAlarm && (
                <button onClick={onTestAlarm} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-yellow-900/40 text-yellow-300 border border-yellow-700/30 cursor-pointer">
                  ▶ Test Alarm
                </button>
              )}
            </div>
          </div>
        </div>

        <GoldDivider className="w-full flex-shrink-0" />

        {/* Jumat banner */}
        {isFriday && (
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-6 py-2 text-center flex-shrink-0">
            <p className="text-amber-300 text-lg font-bold tracking-wide leading-tight">
              🕌 JUMAT MUBARAK — Perbanyak Sholawat, Rapikan Shaf, &amp; Datang Lebih Awal
            </p>
          </div>
        )}

        {/* ═══ MAIN 3-COLUMN PANEL ═══ */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* ── LEFT PANEL: Jadwal Sholat ── */}
          <div
            className="w-[26%] flex flex-col gap-2 rounded-2xl p-4 relative overflow-hidden min-h-0 flex-shrink-0"
            style={{
              background: "linear-gradient(160deg, rgba(11,26,46,0.95) 0%, rgba(20,83,45,0.85) 100%)",
              border: "1px solid rgba(212,168,67,0.3)",
              boxShadow: "0 0 30px rgba(212,168,67,0.08) inset",
            }}
          >
            <ArchBorder />
            <div className="text-center mb-1 flex-shrink-0">
              <span className="text-amber-400 text-xs tracking-[0.2em] uppercase">📅 Jadwal Sholat</span>
              <GoldDivider className="w-full mt-1" />
            </div>

            <div className="flex flex-col gap-1.5 flex-1 justify-between min-h-0 overflow-y-auto pr-0.5">
              {prayerGrid.map((item) => (
                <PrayerCard
                  key={item.name}
                  name={item.name}
                  time={item.time}
                  isNext={item.name === nextPrayer}
                />
              ))}
            </div>

            {/* Countdown to next prayer */}
            <div
              className="mt-2 rounded-xl p-3 text-center flex-shrink-0"
              style={{ background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)" }}
            >
              <p className="text-amber-400/80 text-xs tracking-wider uppercase">
                Adzan {nextPrayer} dalam
              </p>
              <p className="text-amber-300 text-3xl font-bold font-mono mt-1">{countdown}</p>
            </div>
          </div>

          {/* ── CENTER PANEL: Slides + Announcements ── */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">

            {/* Slide image */}
            <div
              className="relative rounded-2xl overflow-hidden flex-1 min-h-0"
              style={{ border: "1px solid rgba(212,168,67,0.3)", background: "#000" }}
            >
              {slides.length > 0 ? (
                <img
                  src={slides[currentSlide]?.image_url}
                  alt="Slide"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: "rgba(11,26,46,0.95)" }}
                >
                  <span className="text-amber-400/50 text-xl font-medium">Belum ada slide</span>
                </div>
              )}
              {/* Gold frame corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400/60 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400/60 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400/60 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-xl" />
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
              <div
                className="rounded-xl px-5 py-3 flex-shrink-0"
                style={{
                  background: "rgba(11,26,46,0.9)",
                  border: "1px solid rgba(212,168,67,0.3)",
                }}
              >
                <p className="text-amber-400 text-xs tracking-[0.2em] uppercase mb-1">📢 Pengumuman</p>
                <div className="flex flex-col gap-1">
                  {announcements.slice(0, 2).map((a) => (
                    <p key={a.id} className="text-amber-100 text-lg font-semibold truncate">
                      {a.title}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Running text */}
            {mosque?.running_text && (
              <div
                className="rounded-xl py-2 px-4 overflow-hidden flex-shrink-0"
                style={{ background: "rgba(11,26,46,0.85)", border: "1px solid rgba(212,168,67,0.2)" }}
              >
                <div
                  className="text-amber-300 text-lg font-semibold whitespace-nowrap"
                  style={{
                    display: "inline-block",
                    paddingLeft: "100%",
                    animation: `marquee ${mosque?.running_text_speed || 20}s linear infinite`,
                  }}
                >
                  {mosque.running_text}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Pengumuman + QRIS + Events ── */}
          <div
            className="w-[26%] flex flex-col gap-3 rounded-2xl p-4 relative overflow-hidden min-h-0 flex-shrink-0"
            style={{
              background: "linear-gradient(160deg, rgba(11,26,46,0.95) 0%, rgba(74,20,6,0.3) 100%)",
              border: "1px solid rgba(212,168,67,0.3)",
              boxShadow: "0 0 30px rgba(212,168,67,0.08) inset",
            }}
          >
            <ArchBorder />

            {/* QRIS */}
            {qrisUrl && (
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <p className="text-amber-400 text-xs tracking-[0.2em] uppercase">💳 Infaq &amp; Donasi</p>
                <GoldDivider className="w-full" />
                <div className="h-[150px] w-full bg-white p-2 rounded-xl flex items-center justify-center border border-amber-500/30 shadow-inner">
                  <img
                    src={qrisUrl}
                    alt="QRIS"
                    className="h-full object-contain rounded-lg"
                  />
                </div>
                <p className="text-amber-200/80 text-[10px] text-center">Scan QRIS untuk donasi masjid</p>
              </div>
            )}

            {/* Agenda — selalu tampil */}
            <div className="flex flex-col gap-2 min-h-0 flex-1">
              <p className="text-amber-400 text-xs tracking-[0.2em] uppercase mt-1">📅 Agenda Kegiatan</p>
              <GoldDivider className="w-full" />
              {events.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-amber-400/40 text-xs text-center">Belum ada kegiatan</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
                  {events.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg px-3 py-2"
                      style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}
                    >
                      <p className="text-amber-100 text-sm font-semibold leading-tight truncate">{ev.title}</p>
                      {ev.speaker && (
                        <p className="text-amber-400/70 text-[11px] truncate mt-0.5">{ev.speaker}</p>
                      )}
                      <p className="text-amber-400/60 text-[10px] mt-0.5">
                        {formatIndonesianDateWithDay(ev.event_date)}{ev.event_time ? ` • ${ev.event_time}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Petugas */}
            {todayOfficers.length > 0 && (
              <div className="flex flex-col gap-2 min-h-0 flex-1">
                <p className="text-amber-400 text-xs tracking-[0.2em] uppercase mt-1">👥 Petugas Hari Ini</p>
                <GoldDivider className="w-full" />
                <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1 justify-center">
                  {todayOfficers.slice(0, 3).map((o, i) => (
                    <div key={i} className="flex justify-between items-center bg-black/20 px-3.5 py-1.5 rounded-lg border border-amber-900/30">
                      <span className="text-amber-400/80 text-[11px] capitalize font-semibold">{o.role}</span>
                      <span className="text-amber-100 text-xs font-semibold truncate max-w-[130px]">{o.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
        {/* ═══ End 3-col ═══ */}

      </div>
    </div>
  );
}
