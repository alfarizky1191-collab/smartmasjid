"use client";

/**
 * Pull-to-refresh wrapper for SmartMasjid Mobile.
 * Works on touch devices with native-feeling threshold.
 * Does NOT break scroll on non-touch browsers.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;   // px of overscroll needed to trigger
const MAX_PULL  = 110;  // px max rubber-band distance

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
  const [pullY, setPullY]         = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef  = useRef(0);
  const pullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || refreshing) return;
    const el = containerRef.current;
    if (!el) return;
    // Only trigger pull when already scrolled to top
    if (el.scrollTop > 4) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, [disabled, refreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current || disabled || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) { setPullY(0); return; }
    // Rubber-band: slow down past threshold
    const rubberBand = Math.min(MAX_PULL, delta * (1 - delta / (MAX_PULL * 2)));
    setPullY(Math.max(0, rubberBand));
    if (delta > 4) {
      e.preventDefault();   // prevent scroll when pulling
    }
  }, [disabled, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullY(0);
  }, [pullY, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove",  handleTouchMove,  { passive: false });
    el.addEventListener("touchend",   handleTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove",  handleTouchMove);
      el.removeEventListener("touchend",   handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const indicatorVisible = pullY > 0 || refreshing;
  const spinnerRotate    = Math.min(360, (pullY / THRESHOLD) * 360);
  const triggered        = pullY >= THRESHOLD;

  return (
    <div ref={containerRef} className="relative overflow-y-auto h-full">
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center z-10 pointer-events-none overflow-hidden transition-all duration-200"
        style={{
          top: 0,
          height: indicatorVisible ? pullY || (refreshing ? THRESHOLD : 0) : 0,
          opacity: indicatorVisible ? 1 : 0,
        }}
        aria-hidden="true"
      >
        <div
          className={[
            "mt-3 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-lg",
            triggered || refreshing
              ? "bg-emerald-500 border-emerald-400 text-black"
              : "bg-slate-800 border-slate-600 text-slate-400",
          ].join(" ")}
        >
          <RefreshCw
            size={18}
            strokeWidth={2.5}
            className={refreshing ? "animate-spin" : ""}
            style={!refreshing ? { transform: `rotate(${spinnerRotate}deg)` } : undefined}
          />
        </div>
      </div>

      {/* Content — shifts down while pulling */}
      <div
        style={{
          transform: `translateY(${pullY}px)`,
          transition: pullingRef.current ? "none" : "transform 0.25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
