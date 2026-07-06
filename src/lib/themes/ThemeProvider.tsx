"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTheme, themeToCSS, type TVThemeConfig } from "@/lib/themes";

// ─── Context ──────────────────────────────────────────────────────────────────

interface TVThemeContextValue {
  theme: TVThemeConfig;
  themeId: string;
}

const TVThemeContext = createContext<TVThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface TVThemeProviderProps {
  themeId?: string | null;
  children: React.ReactNode;
}

/**
 * ThemeProvider for TV Display.
 * 
 * Injects theme CSS variables into the page without modifying business logic.
 * The TV page's data queries, prayer calculations, and realtime subscriptions
 * remain completely untouched.
 */
export function TVThemeProvider({ themeId, children }: TVThemeProviderProps) {
  const [theme, setTheme] = useState<TVThemeConfig>(() => getTheme(themeId));

  useEffect(() => {
    const newTheme = getTheme(themeId);
    setTheme(newTheme);

    // Inject theme CSS variables into <head>
    const existingStyle = document.getElementById("tv-theme-vars");
    if (existingStyle) {
      existingStyle.textContent = themeToCSS(newTheme);
    } else {
      const style = document.createElement("style");
      style.id = "tv-theme-vars";
      style.textContent = themeToCSS(newTheme);
      document.head.appendChild(style);
    }

    // Apply theme background to body (supports gradients)
    if (newTheme.colors.background.startsWith("linear-gradient")) {
      document.body.style.background = newTheme.colors.background;
    } else {
      document.body.style.backgroundColor = newTheme.colors.background;
    }

    return () => {
      // Cleanup: restore default background on unmount
      document.body.style.background = "";
      document.body.style.backgroundColor = "";
    };
  }, [themeId]);

  return (
    <TVThemeContext.Provider value={{ theme, themeId: theme.id }}>
      {children}
    </TVThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the current TV theme.
 * Only use inside components wrapped by <TVThemeProvider>.
 */
export function useTVTheme(): TVThemeContextValue {
  const context = useContext(TVThemeContext);
  if (!context) {
    throw new Error("useTVTheme must be used inside TVThemeProvider");
  }
  return context;
}
