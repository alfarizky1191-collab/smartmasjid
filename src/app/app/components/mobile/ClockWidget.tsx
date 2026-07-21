"use client";

import { useEffect, useState, memo } from "react";
import type { PrayerEntry } from "@/lib/mobile/types";
import { getNextPrayerCountdown, formatIqomah } from "@/lib/mobile/prayer";

// ─── Helpers ─────────────────────────────────────────────────────────────

function clockString(): string {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function gregorianString(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function hijriString(): string {
  try {
    return new Date().toLocaleDateString("id-ID-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────

const DateDisplay = memo(function DateDisplay() {
  const gregorian = gregorianString();
  const hijri = hijriString();

  return (
    <div className="mt-2 text-center">
      <p
        className="text-sm sm:text-base font-bold tracking-wide"
        style={{ color: "var(--pwa-text-secondary)" }}
      >
        {gregorian}
      </p>
      {hijri && (
        <div className="flex justify-center mt-2">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 border border-amber-400/40 rounded-full px-4 py-1 shadow-sm">
            <span className="text-amber-300 text-sm font-bold" aria-hidden="true">☽</span>
            <span className="text-amber-300 text-xs sm:text-sm font-bold tracking-wide">{hijri}</span>
          </span>
        </div>
      )}
    </div>
  );
});

interface CountdownBarProps {
  prayers: PrayerEntry[];
  iqomahSecs: number;
  showAdzan: boolean;
  currentPrayer: string;
}

export const CountdownBar = memo(function CountdownBar({
  prayers,
  iqomahSecs,
  showAdzan,
  currentPrayer,
}: CountdownBarProps) {
  const { name, countdown } =
    prayers.length > 0
      ? getNextPrayerCountdown(prayers)
      : { name: "—", countdown: "00:00:00" };

  return (
    <div
      className={`mx-4 sm:mx-5 rounded-3xl p-6 text-center transition-all duration-500 shadow-2xl border ${
        showAdzan
          ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 border-amber-300 animate-pulse shadow-amber-500/40"
          : "bg-gradient-to-b from-emerald-900/90 via-slate-900/95 to-emerald-950/90 border-emerald-500/40 backdrop-blur-xl shadow-emerald-950/80 text-white"
      }`}
      role="timer"
      aria-live="off"
      aria-label={showAdzan ? `Adzan ${currentPrayer}` : `Adzan ${name} dalam ${countdown}`}
    >
      {showAdzan ? (
        <div>
          <p className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950">
            🕌 ADZAN WAKTU {currentPrayer}
          </p>
          <p className="text-sm font-extrabold text-slate-950 mt-1.5 animate-bounce">
            Hayya &apos;alash Shalah — 📵 Harap Matikan / Heningkan HP
          </p>
          <p className="text-xl font-black mt-2 font-mono tracking-wide" aria-label={`Iqomah ${formatIqomah(iqomahSecs)}`}>
            Jeda Iqomah: {formatIqomah(iqomahSecs)}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-300 mb-1 flex items-center justify-center gap-1.5">
            <span>✨</span> Waktu Sholat Berikutnya <span>✨</span>
          </p>
          <p className="text-xl sm:text-2xl font-black text-white">{name}</p>
          <p
            className="text-5xl sm:text-6xl font-black tracking-wider font-mono text-amber-300 mt-2 drop-shadow-md tabular-nums"
            aria-label={`Countdown ${countdown}`}
          >
            {countdown}
          </p>
          {iqomahSecs > 0 && (
            <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-3 tracking-wide">
              Iqomah dalam: {formatIqomah(iqomahSecs)}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Main ClockWidget ─────────────────────────────────────────────────────

interface ClockWidgetProps {
  prayers: PrayerEntry[];
  iqomahSecs: number;
  showAdzan: boolean;
  currentPrayer: string;
}

export default memo(function ClockWidget({}: ClockWidgetProps) {
  const [clock, setClock] = useState(clockString);

  useEffect(() => {
    const id = setInterval(() => setClock(clockString()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center py-2">
      {/* Bismillah Banner */}
      <div className="mb-2">
        <span className="text-amber-300 text-lg font-serif tracking-widest opacity-90">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </span>
      </div>

      {/* Large Digital Clock — keep emerald-300 accent as-is */}
      <div className="flex items-baseline justify-center gap-1 drop-shadow-lg">
        <p
          className="text-6xl sm:text-7xl font-black tracking-wider font-mono text-emerald-300 tabular-nums"
          aria-label={`Waktu sekarang ${clock}`}
        >
          {clock.slice(0, 5)}
        </p>
        <span
          className="text-xl font-mono font-bold tabular-nums"
          style={{ color: "var(--pwa-text-muted)" }}
        >
          {clock.slice(5)}
        </span>
      </div>

      {/* Dates */}
      <DateDisplay />
    </div>
  );
});
