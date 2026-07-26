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

// ─── DateDisplay ─────────────────────────────────────────────────────────

const DateDisplay = memo(function DateDisplay() {
  const gregorian = gregorianString();
  const hijri = hijriString();

  return (
    <div className="mt-4">
      <p
        className="text-base font-bold tracking-wide text-center"
        style={{ color: "var(--pwa-text-secondary)" }}
      >
        {gregorian}
      </p>
      {hijri && (
        <div className="flex justify-center mt-3">
          <div
            className="glass-card inline-flex items-center gap-2.5 rounded-full px-6 py-2.5"
            style={{
              background: "rgba(251,191,36,0.12)",
              borderColor: "rgba(251,191,36,0.28)",
            }}
          >
            <span className="text-amber-300 text-lg font-bold" aria-hidden="true">☽</span>
            <span className="text-amber-300 text-base font-bold tracking-wide">{hijri}</span>
          </div>
        </div>
      )}
    </div>
  );
});

// ─── CountdownBar ─────────────────────────────────────────────────────────

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
          "relative overflow-hidden rounded-3xl px-6 py-8 text-center transition-all duration-500 shadow-premium",
          showAdzan
            ? "animate-pulse"
            : "",
        ].join(" ")}
        style={
          showAdzan
            ? {
                background: "linear-gradient(135deg, #78350f, #92400e, #78350f)",
                border: "2px solid rgba(251,191,36,0.6)",
                boxShadow: "0 0 40px rgba(251,191,36,0.2)",
              }
            : {
                background: "rgba(16,185,129,0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(16,185,129,0.25)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
              }
        }
        role="timer"
        aria-live="off"
        aria-label={showAdzan ? `Adzan ${currentPrayer}` : `Adzan ${name} dalam ${countdown}`}
      >
        {/* Ambient glow top */}
        {!showAdzan && (
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center top, rgba(16,185,129,0.25) 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />
        )}

        {showAdzan ? (
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-4xl">🕌</span>
              <span className="text-2xl font-black uppercase tracking-wider text-amber-300">
                ADZAN {currentPrayer.toUpperCase()}
              </span>
              <span className="text-4xl">🕌</span>
            </div>
            <p className="text-base font-extrabold text-amber-200 mt-2 animate-bounce">
              Hayya &apos;alash Shalah — 📵 Harap Matikan / Heningkan HP
            </p>
            <div
              className="mt-5 inline-block rounded-2xl px-8 py-4"
              style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)" }}
            >
              <p className="text-sm font-bold text-amber-300/80 uppercase tracking-wider mb-1">
                Jeda Iqomah
              </p>
              <p className="text-5xl font-black font-mono tracking-wide text-white" aria-label={`Iqomah ${formatIqomah(iqomahSecs)}`}>
                {formatIqomah(iqomahSecs)}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-amber-300 text-base font-bold" aria-hidden="true">✨</span>
              <p className="text-sm font-black uppercase tracking-widest text-amber-300">
                Waktu Sholat Berikutnya
              </p>
              <span className="text-amber-300 text-base font-bold" aria-hidden="true">✨</span>
            </div>
            <p className="text-2xl font-black text-white mb-3 tracking-wide">{name}</p>
            <p
              className="text-7xl font-black tracking-wider font-mono text-amber-300 drop-shadow-md tabular-nums"
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

// Props diterima tapi tidak dipakai di sini — countdown ada di CountdownBar
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
    <div className="text-center py-4">
      {/* Bismillah Banner */}
      <div className="mb-5">
        <span className="text-amber-300 text-2xl font-serif tracking-widest opacity-90">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </span>
      </div>

      {/* Large Digital Clock */}
      <div className="flex items-baseline justify-center gap-2 drop-shadow-lg">
        <p
          className="font-black tracking-wider font-mono text-emerald-300 tabular-nums"
          style={{ fontSize: "clamp(4.5rem, 22vw, 6rem)" }}
          aria-label={`Waktu sekarang ${clock}`}
        >
          {clock.slice(0, 5)}
        </p>
        <span
          className="text-3xl font-mono font-bold tabular-nums"
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
