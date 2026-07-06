"use client";

/**
 * useFavoriteMosque
 *
 * Single source of truth for the selected mosque in SmartMasjid Mobile.
 * - Reads from / writes to localStorage (no login required).
 * - Exposes selectMosque() which updates state + persists.
 * - Exposes clearMosque() for "change mosque" flow.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getFavoriteMosque,
  setFavoriteMosque,
  clearFavoriteMosque,
  getRecentMosques,
} from "@/lib/mobile/favorite-mosque";
import type { FavoriteMosque, MosqueRow } from "@/lib/mobile/types";

export type FavoriteState = "loading" | "found" | "not_found";

export interface UseFavoriteMosqueReturn {
  state: FavoriteState;
  favorite: FavoriteMosque | null;
  recent: FavoriteMosque[];
  selectMosque: (mosque: MosqueRow | FavoriteMosque) => void;
  clearMosque: () => void;
}

/** Type guard — FavoriteMosque always has mosque_id */
function isFavoriteMosque(m: MosqueRow | FavoriteMosque): m is FavoriteMosque {
  return "mosque_id" in m;
}

export function useFavoriteMosque(): UseFavoriteMosqueReturn {
  const [state, setState]       = useState<FavoriteState>("loading");
  const [favorite, setFavorite] = useState<FavoriteMosque | null>(null);
  const [recent, setRecent]     = useState<FavoriteMosque[]>([]);

  // Read localStorage once on mount (client-only)
  useEffect(() => {
    // Small tick to ensure hydration is complete before reading localStorage,
    // preventing the flash where state briefly shows "not_found" on pages that
    // have a mosque saved. Without this, pages redirect to onboarding incorrectly.
    const timer = setTimeout(() => {
      const saved = getFavoriteMosque();
      setFavorite(saved);
      setRecent(getRecentMosques());
      setState(saved ? "found" : "not_found");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const selectMosque = useCallback((mosque: MosqueRow | FavoriteMosque) => {
    let entry: Omit<FavoriteMosque, "last_visit">;

    if (isFavoriteMosque(mosque)) {
      // Already a FavoriteMosque shape
      entry = {
        mosque_id: mosque.mosque_id,
        slug:      mosque.slug,
        name:      mosque.name,
        logo_url:  mosque.logo_url,
        city:      mosque.city,
        province:  mosque.province,
      };
    } else {
      // MosqueRow — id is typed as unknown due to index signature, cast safely
      entry = {
        mosque_id: String(mosque.id ?? ""),
        slug:      mosque.slug,
        name:      mosque.name,
        logo_url:  (mosque.logo_url as string | null | undefined) ?? null,
        city:      (mosque.city     as string | null | undefined) ?? null,
        province:  (mosque.province as string | null | undefined) ?? null,
      };
    }

    setFavoriteMosque(entry);

    const full: FavoriteMosque = { ...entry, last_visit: new Date().toISOString() };
    setFavorite(full);
    setRecent(getRecentMosques());
    setState("found");
  }, []);

  const clearMosque = useCallback(() => {
    clearFavoriteMosque();
    setFavorite(null);
    setState("not_found");
  }, []);

  return { state, favorite, recent, selectMosque, clearMosque };
}
