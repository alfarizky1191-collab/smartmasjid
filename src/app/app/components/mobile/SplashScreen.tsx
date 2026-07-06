"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  /** Minimum display duration in ms before it can dismiss */
  minDuration?: number;
  onDone?: () => void;
}

/**
 * Animated splash screen shown once on first app load.
 * Fades out after minDuration or when the page is ready.
 */
export default function SplashScreen({ minDuration = 1800, onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<"visible" | "fading" | "done">("visible");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("fading");
      const fadeTimer = setTimeout(() => {
        setPhase("done");
        onDone?.();
      }, 500); // fade duration
      return () => clearTimeout(fadeTimer);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onDone]);

  if (phase === "done") return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-white transition-opacity duration-500
        ${phase === "fading" ? "opacity-0" : "opacity-100"}
      `}
      aria-hidden="true"
    >
      {/* Mosque icon */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer pulse ring */}
        <div className="absolute w-28 h-28 rounded-full bg-emerald-100 animate-ping opacity-40" />
        {/* Icon container */}
        <div className="relative w-24 h-24 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-200">
          {/* Inline SVG mosque */}
          <svg viewBox="0 0 64 64" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
            {/* Dome */}
            <ellipse cx="32" cy="22" rx="12" ry="9" fill="white"/>
            <polygon points="32,10 24,22 40,22" fill="white"/>
            {/* Minaret left */}
            <rect x="12" y="21" width="5" height="18" rx="2" fill="white"/>
            <ellipse cx="14.5" cy="21" rx="2.5" ry="3.5" fill="white"/>
            <polygon points="14.5,14 11.5,21 17.5,21" fill="#d1fae5"/>
            {/* Minaret right */}
            <rect x="47" y="21" width="5" height="18" rx="2" fill="white"/>
            <ellipse cx="49.5" cy="21" rx="2.5" ry="3.5" fill="white"/>
            <polygon points="49.5,14 46.5,21 52.5,21" fill="#d1fae5"/>
            {/* Main body -->*/}
            <rect x="20" y="31" width="24" height="14" rx="2" fill="white"/>
            {/* Door */}
            <path d="M28 45 L28 37 Q32 33 36 37 L36 45 Z" fill="#059669"/>
            {/* Crescent */}
            <path d="M32 6 Q36 3 36 6 Q32 8 28 6 Q28 3 32 6 Z" fill="#fbbf24"/>
            <circle cx="34.5" cy="4.5" r="2" fill="#fbbf24"/>
          </svg>
        </div>
      </div>

      {/* App name */}
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
        SmartMasjid
      </h1>
      <p className="text-sm text-slate-400 mt-1 font-medium">Portal Jamaah Digital</p>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-400"
            style={{
              animation: `splash-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.0); opacity: 1.0; }
        }
      `}</style>
    </div>
  );
}
