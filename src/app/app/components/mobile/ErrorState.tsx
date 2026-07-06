"use client";

/**
 * Elegant error state for SmartMasjid Mobile.
 * Shows retry button and offline-specific message.
 */

import { WifiOff, RefreshCw } from "lucide-react";
import { useState } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  offline?: boolean;
  onRetry?: () => void;
}

export default function ErrorState({
  title,
  message,
  offline = false,
  onRetry,
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    if (!onRetry) return;
    setRetrying(true);
    // Small visual delay so the user sees feedback
    setTimeout(() => {
      setRetrying(false);
      onRetry();
    }, 600);
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-14 px-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div
        className={[
          "w-20 h-20 rounded-3xl flex items-center justify-center mb-5",
          offline
            ? "bg-yellow-500/10 border border-yellow-500/20"
            : "bg-red-500/10 border border-red-500/20",
        ].join(" ")}
        aria-hidden="true"
      >
        {offline ? (
          <WifiOff size={34} className="text-yellow-400" strokeWidth={1.5} />
        ) : (
          <span className="text-4xl">⚠️</span>
        )}
      </div>

      <h3 className="text-white font-bold text-base mb-1.5">
        {title ?? (offline ? "Tidak Ada Koneksi" : "Gagal Memuat")}
      </h3>

      <p className="text-slate-500 text-sm leading-relaxed max-w-[240px]">
        {message ??
          (offline
            ? "Periksa koneksi internet Anda. Data tersimpan ditampilkan."
            : "Terjadi kesalahan. Silakan coba lagi.")}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className={[
            "mt-5 flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-2xl",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
            "bg-emerald-500 active:bg-emerald-600 text-black disabled:opacity-60",
          ].join(" ")}
          aria-label="Coba lagi memuat data"
        >
          <RefreshCw
            size={15}
            strokeWidth={2.5}
            className={retrying ? "animate-spin" : ""}
            aria-hidden="true"
          />
          {retrying ? "Memuat..." : "Coba Lagi"}
        </button>
      )}
    </div>
  );
}
