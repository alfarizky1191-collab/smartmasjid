/**
 * SmartMasjid Mobile — Favorite Mosque Service
 *
 * Persists favorite mosque selection in localStorage.
 * No login required. Works offline after first selection.
 * PWA-safe: localStorage survives app install.
 */

import type { FavoriteMosque } from "./types";

const KEY_FAVORITE = "sm_favorite_mosque";
const KEY_RECENT   = "sm_recent_mosques";
const MAX_RECENT   = 5;

// ─── Favorite ─────────────────────────────────────────────────────────────

export function getFavoriteMosque(): FavoriteMosque | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_FAVORITE);
    if (!raw) return null;
    return JSON.parse(raw) as FavoriteMosque;
  } catch {
    return null;
  }
}

export function setFavoriteMosque(mosque: Omit<FavoriteMosque, "last_visit">): void {
  if (typeof window === "undefined") return;
  try {
    const entry: FavoriteMosque = {
      ...mosque,
      last_visit: new Date().toISOString(),
    };
    localStorage.setItem(KEY_FAVORITE, JSON.stringify(entry));
    // Also push to recent list
    addToRecent(entry);
  } catch {
    // localStorage may be unavailable in private mode — fail silently
  }
}

export function clearFavoriteMosque(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY_FAVORITE);
  } catch {
    // ignore
  }
}

// ─── Recent mosques ───────────────────────────────────────────────────────

export function getRecentMosques(): FavoriteMosque[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_RECENT);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteMosque[];
  } catch {
    return [];
  }
}

function addToRecent(mosque: FavoriteMosque): void {
  try {
    const current = getRecentMosques();
    // Remove existing entry for same mosque, then prepend
    const filtered = current.filter((m) => m.mosque_id !== mosque.mosque_id);
    const updated  = [mosque, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(KEY_RECENT, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
