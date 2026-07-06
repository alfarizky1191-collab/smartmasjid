import type { TVThemeConfig, ThemeId } from "./types";
import { DEFAULT_THEME_ID } from "./types";

// ─── Free themes ──────────────────────────────────────────────────────────────
import { classicTheme }       from "./free/classic";
import { emeraldModernTheme } from "./free/emerald-modern";
import { royalOttomanTheme }  from "./free/royal-ottoman";

// ─── Pro themes ───────────────────────────────────────────────────────────────
import { andalusiaLuxuryTheme }  from "./pro/andalusia-luxury";
import { midnightSapphireTheme } from "./pro/midnight-sapphire";
import { nabawiGreenTheme }      from "./pro/nabawi-green";
import { makkahPremiumTheme }    from "./pro/makkah-premium";
import { ramadanSpecialTheme }   from "./pro/ramadan-special";
import { eidCelebrationTheme }   from "./pro/eid-celebration";

// ─── Registry ─────────────────────────────────────────────────────────────────

/**
 * Central theme registry.
 * 
 * To add a new theme:
 * 1. Create the config file under src/lib/themes/free/ or src/lib/themes/pro/
 * 2. Import it here
 * 3. Add it to THEME_REGISTRY
 * 
 * No other files need to be modified.
 */
export const THEME_REGISTRY: Record<ThemeId, TVThemeConfig> = {
  "classic":            classicTheme,
  "emerald-modern":     emeraldModernTheme,
  "royal-ottoman":      royalOttomanTheme,
  "andalusia-luxury":   andalusiaLuxuryTheme,
  "midnight-sapphire":  midnightSapphireTheme,
  "nabawi-green":       nabawiGreenTheme,
  "makkah-premium":     makkahPremiumTheme,
  "ramadan-special":    ramadanSpecialTheme,
  "eid-celebration":    eidCelebrationTheme,
};

/**
 * Ordered list of all themes for display in the theme selector.
 * Free themes first, then pro.
 */
export const ALL_THEMES: TVThemeConfig[] = [
  classicTheme,
  emeraldModernTheme,
  royalOttomanTheme,
  andalusiaLuxuryTheme,
  midnightSapphireTheme,
  nabawiGreenTheme,
  makkahPremiumTheme,
  ramadanSpecialTheme,
  eidCelebrationTheme,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get a theme by its ID.
 * Returns the Classic theme if the ID is invalid or unknown.
 */
export function getTheme(id: string | null | undefined): TVThemeConfig {
  if (!id) return THEME_REGISTRY[DEFAULT_THEME_ID];
  return THEME_REGISTRY[id as ThemeId] ?? THEME_REGISTRY[DEFAULT_THEME_ID];
}

/**
 * Convert a ThemeConfig into a flat CSS variables object.
 * Injected into the TV page via a <style> tag to override theme tokens
 * without touching any Tailwind class names.
 */
export function themeToCSS(theme: TVThemeConfig): string {
  const { colors, typography, layout, animation } = theme;
  return `
    :root {
      --theme-primary:           ${colors.primary};
      --theme-secondary:         ${colors.secondary};
      --theme-background:        ${colors.background};
      --theme-surface:           ${colors.surface};
      --theme-text-primary:      ${colors.textPrimary};
      --theme-text-secondary:    ${colors.textSecondary};
      --theme-prayer-highlight:  ${colors.prayerHighlight};
      --theme-time-accent:       ${colors.timeAccent};
      --theme-border:            ${colors.border};
      --theme-ornament:          ${colors.ornament};

      --theme-font:              ${typography.fontFamily};
      --theme-font-arabic:       ${typography.fontFamilyArabic ?? typography.fontFamily};
      --theme-heading-weight:    ${typography.headingWeight};
      --theme-body-weight:       ${typography.bodyWeight};

      --theme-padding:           ${layout.padding};
      --theme-gap:               ${layout.gap};
      --theme-radius:            ${layout.borderRadius};
      --theme-header-height:     ${layout.headerHeight};
      --theme-footer-height:     ${layout.footerHeight};

      --theme-anim-duration:     ${animation.duration}ms;
      --theme-anim-easing:       ${animation.easing};
    }
  `.trim();
}

export type { TVThemeConfig, ThemeId };
