"use client";

import { useEffect, useState, memo } from "react";
import type { PrayerEntry } from "@/lib/mobile/types";
import { getNextPrayerCountdown, formatIqomah } from "@/lib/mobile/prayer";

// ─── Helpers (pure, no allocations in render) ────────────────────────────

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

// ─── Sub-components (memoised so parent tick doesn't cascade) ────────────

const DateDisplay = memo(function DateDisplay() {
  const gregorian = gregorianString();
  const hijri     = hijriString();

  return (
    <>
      <p className="text-center text-sm font-semibold text-slate-300 mt-1">
        {gregorian}
      </p>
      {hijri && (
        <div className="flex justify-center mt-2">
          <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
            <span className="text-yellow-400 text-xs" aria-hidden="true">☽</span>
            <span className="text-yellow-300 text-xs font-semibold">{hijri}</span>
          </span>
        </div>
      )}
    </>
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
  const { name, countdown } = prayers.length > 0
    ? getNextPrayerCountdown(prayers)
    : { name: "—", countdown: "00:00:00" };

  return (
    <div
      className={`mx-5 rounded-3xl p-5 text-center transition-colors duration-500 ${
        showAdzan
          ? "bg-yellow-400 text-black animate-pulse"
          : "bg-emerald-500/15 border border-emerald-500/30 text-white"
      }`}
      role="timer"
      aria-live="off"
      aria-label={showAdzan ? `Adzan ${currentPrayer}` : `Adzan ${name} dalam ${countdown}`}
    >
      {showAdzan ? (
        <div>
          <p className="text-base font-extrabold">🕌 ADZAN {currentPrayer}</p>
          <p className="text-sm mt-1 font-semibold">
            Hayya &apos;alash Shalah — 📵 Matikan HP
          </p>
          <p className="text-lg font-bold mt-1 tabular-nums" aria-label={`Iqomah ${formatIqomah(iqomahSecs)}`}>
            Iqomah: {formatIqomah(iqomahSecs)}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300 mb-1">
            Adzan berikutnya
          </p>
          <p className="text-lg font-bold text-white">{name}</p>
          <p
            className="text-[42px] font-extrabold tabular-nums leading-none tracking-tight text-white mt-1"
            aria-label={`Countdown ${countdown}`}
          >
            {countdown}
          </p>
          {iqomahSecs > 0 && (
            <p className="text-xs text-emerald-300 mt-2 font-semibold">
              Iqomah: {formatIqomah(iqomahSecs)}
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

/**
 * Isolated client island — ONLY this component re-renders every second.
 * The rest of the page (mosque info, announcements, events…) is static.
 */
export default memo(function ClockWidget({
  prayers,
  iqomahSecs,
  showAdzan,
  currentPrayer,
}: ClockWidgetProps) {
  const [clock, setClock] = useState(clockString);

  useEffect(() => {
    const id = setInterval(() => setClock(clockString()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      {/* HH:MM large */}
      <p
        className="text-[64px] font-extrabold leading-none tracking-tight tabular-nums text-white"
        aria-label={`Waktu sekarang ${clock}`}
      >
        {clock.slice(0, 5)}
      </p>
      {/* :SS small */}
      <span className="text-slate-500 text-lg font-semibold tabular-nums">
        {clock.slice(6)}
      </span>

      {/* Dates — only computed once (memoised) */}
      <DateDisplay />
    </div>
  );
});
