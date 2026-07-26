"use client";

import { useEffect, useState } from "react";

export type AppScale = "small" | "medium" | "large";

const STORAGE_KEY = "pwa-scale";
const SCALE_PX: Record<AppScale, number> = {
  small:  14,
  medium: 16,
  large:  18,
};

function readScale(): AppScale {
  if (typeof window === "undefined") return "medium";
  const saved = localStorage.getItem(STORAGE_KEY) as AppScale | null;
  return saved && saved in SCALE_PX ? saved : "medium";
}

function applyScale(scale: AppScale) {
  document.documentElement.style.fontSize = `${SCALE_PX[scale]}px`;
}

export function useAppScale() {
  const [scale, setScaleState] = useState<AppScale>("medium");

  // Baca dari localStorage saat mount (client-only)
  useEffect(() => {
    const saved = readScale();
    setScaleState(saved);
    applyScale(saved);
  }, []);

  const setScale = (next: AppScale) => {
    setScaleState(next);
    applyScale(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return { scale, setScale };
}
