"use client";

/**
 * PageTransition — smooth fade-up entrance for all SmartMasjid Mobile pages.
 * Uses pure CSS animation so no dependencies needed.
 * The animation runs once on mount then stops to save battery.
 */

import { useEffect, useRef } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  /** Optional variant: "fade" (default) | "slide-up" | "scale" */
  variant?: "fade" | "slide-up" | "scale";
  className?: string;
}

const VARIANTS = {
  "fade":     "animate-page-fade",
  "slide-up": "animate-page-slide-up",
  "scale":    "animate-page-scale",
} as const;

export default function PageTransition({
  children,
  variant = "slide-up",
  className = "",
}: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Remove the animation class after it finishes so it doesn't replay on re-render
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnd = () => {
      el.style.opacity    = "1";
      el.style.transform  = "none";
    };
    el.addEventListener("animationend", onEnd, { once: true });
    return () => el.removeEventListener("animationend", onEnd);
  }, []);

  return (
    <div
      ref={ref}
      className={`${VARIANTS[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
