"use client";

/**
 * Pull-to-refresh wrapper — bekerja di window scroll (bukan overflow div).
 * Mendeteksi pull saat window.scrollY === 0, sesuai dengan layout
 * SmartMasjid Mobile yang scroll di window level.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 80;   // px pull yang dibutuhkan untuk trigger
const MAX_PULL  = 120;  // px max rubber-band

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [pullY, setPullY]           = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef    = useRef(0);
  const pullingRef   = useRef(false);
  const pullYRef     = useRef(0);   // mirror state ke ref supaya touchend bisa baca nilai terkini

  // Sync state ke ref
  useEffect(() => { pullYRef.current = pullY; }, [pullY]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || refreshing) return;
    // Hanya aktifkan pull saat halaman di posisi paling atas
    if (window.scrollY > 4) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, [disabled, refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current || disabled || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPullY(0);
      return;
    }
    // Hanya cegah scroll default saat sedang pull-down
    if (window.scrollY <= 0 && delta > 0) {
      e.preventDefault();
    }
    // Rubber-band damping
    const rubberBand = Math.min(MAX_PULL, delta * (1 - delta / (MAX_PULL * 2.5)));
    setPullY(Math.max(0, rubberBand));
  }, [disabled, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullYRef.current >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  }, [onRefresh]);

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove",  handleTouchMove,  { passive: false });
    document.addEventListener("touchend",   handleTouchEnd,   { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove",  handleTouchMove);
      document.removeEventListener("touchend",   handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const indicatorH  = refreshing ? THRESHOLD : pullY;
  const spinDeg     = Math.min(360, (pullY / THRESHOLD) * 360);
  const triggered   = pullY >= THRESHOLD;

  return (
    <div className="relative">
      {/* Pull indicator — fixed di atas, tidak ikut scroll */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
        style={{
          height: indicatorH > 0 ? indicatorH : 0,
          overflow: "hidden",
          transition: pullingRef.current ? "none" : "height 0.25s ease",
        }}
        aria-hidden="true"
      >
        <div
          className={[
            "mt-3 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-xl",
            triggered || refreshing
              ? "bg-emerald-500 border-emerald-400 text-slate-950"
              : "border-emerald-500/40 text-emerald-400",
          ].join(" ")}
          style={!triggered && !refreshing ? {
            background: "rgba(16,185,129,0.15)",
            backdropFilter: "blur(12px)",
          } : undefined}
        >
          <RefreshCw
            size={20}
            strokeWidth={2.5}
            className={refreshing ? "animate-spin" : "transition-transform duration-100"}
            style={!refreshing ? { transform: `rotate(${spinDeg}deg)` } : undefined}
          />
        </div>
      </div>

      {/* Content — tekan ke bawah saat pulling */}
      <div
        style={{
          transform: `translateY(${pullY}px)`,
          transition: pullingRef.current ? "none" : "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
