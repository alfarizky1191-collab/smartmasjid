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
    <div className="mt-3">
      <p
        className="text-base font-bold tracking-wide text-center"
        style={{ color: "var(--pwa-text-secondary)" }}
      >
        {gregorian}
      </p>
      {hijri && (
        <div className="flex justify-center mt-3">
          <div
            className="glass-card inline-flex items-center gap-2 rounded-full px-5 py-2"
            style={{
              background: "rgba(251,191,36,0.1)",
              borderColor: "rgba(251,191,36,0.25)",
            }}
          >
            <span className="text-amber-300 text-base font-bold" aria-hidden="true">☽</span>
            <span className="text-amber-300 text-sm font-bold tracking-wide">{hijri}</span>
          </div>
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
    <div className="mx-5">
      <div
        className={[
          "relative overflow-hidden rounded-3xl p-7 text-center transition-all duration-500 shadow-premium",
          showAdzan
            ? "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-500 border-2 border-amber-300 animate-pulse"
            : "glass-card",
        ].join(" ")}
        style={!showAdzan ? {
          background: "rgba(16,185,129,0.08)",
          borderColor: "rgba(16,185,129,0.25)",
        } : undefined}
        role="timer"
        aria-live="off"
        aria-label={showAdzan ? `Adzan ${currentPrayer}` : `Adzan ${name} dalam ${countdown}`}
      >
        {/* Ambient glow */}
        {!showAdzan && (
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center top, rgba(16,185,129,0.2) 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />
        )}

        {showAdzan ? (
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">🕌</span>
              <span className="text-xl font-black uppercase tracking-wider text-slate-950">
                ADZAN WAKTU {currentPrayer}
              </span>
              <span className="text-3xl">🕌</span>
            </div>
            <p className="text-base font-extrabold text-slate-950 mt-2 animate-bounce">
              Hayya &apos;alash Shalah — 📵 Harap Matikan / Heningkan HP
            </p>
            <div className="mt-4 inline-block bg-slate-950/20 backdrop-blur-sm rounded-2xl px-6 py-3">
              <p className="text-sm font-bold text-slate-950/70 uppercase tracking-wider mb-1">
                Jeda Iqomah
              </p>
              <p className="text-3xl font-black font-mono tracking-wide text-slate-950" aria-label={`Iqomah ${formatIqomah(iqomahSecs)}`}>
                {formatIqomah(iqomahSecs)}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-amber-300 text-sm font-bold" aria-hidden="true">✨</span>
              <p className="text-sm font-black uppercase tracking-widest text-amber-300">
                Waktu Sholat Berikutnya
              </p>
              <span className="text-amber-300 text-sm font-bold" aria-hidden="true">✨</span>
            </div>
            <p className="text-3xl font-black text-white mb-3">{name}</p>
            <p
              className="text-6xl sm:text-7xl font-black tracking-wider font-mono text-amber-300 drop-shadow-md tabular-nums"
              aria-label={`Countdown ${countdown}`}
            >
              {countdown}
            </p>
            {iqomahSecs > 0 && (
              <p className="text-sm font-bold text-emerald-400 mt-4 tracking-wide">
                Iqomah dalam: {formatIqomah(iqomahSecs)}
              </p>
            )}
          </div>
        )}
      </div>
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
    <div className="text-center py-3">
      {/* Bismillah Banner */}
      <div className="mb-4">
        <span className="text-amber-300 text-xl font-serif tracking-widest opacity-90">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </span>
      </div>

      {/* Large Digital Clock */}
      <div className="flex items-baseline justify-center gap-2 drop-shadow-lg">
        <p
          className="text-7xl sm:text-8xl font-black tracking-wider font-mono text-emerald-300 tabular-nums"
          aria-label={`Waktu sekarang ${clock}`}
        >
          {clock.slice(0, 5)}
        </p>
        <span
          className="text-2xl font-mono font-bold tabular-nums"
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
