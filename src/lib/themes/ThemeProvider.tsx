"use client";

/**
 * SmartMasjid PWA — ThemeProvider
 *
 * Supports four theme modes:
 *  - "light"  : always light
 *  - "dark"   : always dark
 *  - "system" : follows OS preference via prefers-color-scheme
 *  - "auto"   : light 06:00–18:00, dark 18:00–06:00 (checked every minute)
 *
 * Persists choice to localStorage key "sm-theme".
 * Applies/removes the "dark" class on document.documentElement so that
 * Tailwind's dark: variants and CSS .dark {} block both work correctly.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────

export type ThemeMode = "light" | "dark" | "system" | "auto";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** The stored theme preference */
  theme: ThemeMode;
  /** The actual applied theme ("light" or "dark") */
  resolvedTheme: ResolvedTheme;
  /** Change the theme preference */
  setTheme: (t: ThemeMode) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "sm-theme";
const DEFAULT_THEME: ThemeMode = "dark";

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (stored && ["light", "dark", "system", "auto"].includes(stored)) {
    return stored;
  }
  return DEFAULT_THEME;
}

function isAutoLight(): boolean {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18;
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  switch (mode) {
    case "light":
      return "light";
    case "dark":
      return "dark";
    case "system":
      if (typeof window === "undefined") return "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    case "auto":
      return isAutoLight() ? "light" : "dark";
    default:
      return "dark";
  }
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// ─── Context ──────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  resolvedTheme: "dark",
  setTheme: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  // Compute and apply resolved theme
  const applyMode = useCallback((mode: ThemeMode) => {
    const resolved = resolveTheme(mode);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // On mount: read from localStorage
  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyMode(stored);
  }, [applyMode]);

  // For "system": listen to OS preference changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyMode("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, applyMode]);

  // For "auto": re-check every minute
  useEffect(() => {
    if (theme !== "auto") return;
    const id = setInterval(() => applyMode("auto"), 60_000);
    return () => clearInterval(id);
  }, [theme, applyMode]);

  const setTheme = useCallback(
    (t: ThemeMode) => {
      setThemeState(t);
      localStorage.setItem(STORAGE_KEY, t);
      applyMode(t);
    },
    [applyMode]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// ─── TVThemeProvider ──────────────────────────────────────────────────────
// Applies TV display theme CSS variables based on the selected theme ID.
// Used in /tv/[slug] to inject --theme-* CSS custom properties.

import { getTheme, themeToCSS } from "@/lib/themes";

interface TVThemeProviderProps {
  children: React.ReactNode;
  themeId: string;
}

export function TVThemeProvider({ children, themeId }: TVThemeProviderProps) {
  const theme = getTheme(themeId);
  const css = themeToCSS(theme);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </>
  );
}
