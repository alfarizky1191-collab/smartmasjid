/**
 * SmartMasjid TV Display Theme Engine
 * 
 * Pure presentation layer — does not modify any business logic,
 * data queries, prayer calculations, or realtime subscriptions.
 */

// ─── Theme Tier ───────────────────────────────────────────────────────────────

export type ThemeTier = "free" | "pro";

// ─── Typography ───────────────────────────────────────────────────────────────

export interface ThemeTypography {
  /** Primary font family */
  fontFamily: string;
  /** Secondary/accent font (optional) */
  fontFamilyArabic?: string;
  /** Font weight for headings */
  headingWeight: string;
  /** Font weight for body text */
  bodyWeight: string;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

export interface ThemeColors {
  /** Primary brand color */
  primary: string;
  /** Secondary accent color */
  secondary: string;
  /** Background color */
  background: string;
  /** Surface/card background */
  surface: string;
  /** Text on background */
  textPrimary: string;
  /** Secondary text */
  textSecondary: string;
  /** Prayer name highlight */
  prayerHighlight: string;
  /** Countdown/time accent */
  timeAccent: string;
  /** Border color */
  border: string;
  /** Ornament/decoration color */
  ornament: string;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface ThemeLayout {
  /** Container padding */
  padding: string;
  /** Gap between sections */
  gap: string;
  /** Border radius */
  borderRadius: string;
  /** Header height */
  headerHeight: string;
  /** Footer height */
  footerHeight: string;
}

// ─── Ornaments ────────────────────────────────────────────────────────────────

export interface ThemeOrnament {
  /** Show Islamic geometric patterns */
  showPattern: boolean;
  /** Pattern opacity (0-100) */
  patternOpacity: number;
  /** Show mosque silhouette */
  showMosqueSilhouette: boolean;
  /** Custom background image URL */
  backgroundImage?: string;
  /** Background overlay opacity (0-100) */
  backgroundOverlay: number;
}

// ─── Animations ───────────────────────────────────────────────────────────────

export interface ThemeAnimation {
  /** Enable fade-in animations */
  enableFadeIn: boolean;
  /** Enable slide transitions */
  enableSlide: boolean;
  /** Animation duration (ms) */
  duration: number;
  /** Animation easing function */
  easing: string;
}

// ─── Theme Configuration ──────────────────────────────────────────────────────

export interface TVThemeConfig {
  /** Unique theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Theme description */
  description: string;
  /** Theme tier (free or pro) */
  tier: ThemeTier;
  /** Typography configuration */
  typography: ThemeTypography;
  /** Color palette */
  colors: ThemeColors;
  /** Layout configuration */
  layout: ThemeLayout;
  /** Ornament configuration */
  ornament: ThemeOrnament;
  /** Animation configuration */
  animation: ThemeAnimation;
  /** Preview thumbnail URL */
  previewImage: string;
}

// ─── Theme Registry ───────────────────────────────────────────────────────────

export const THEME_IDS = [
  "classic",
  "emerald-modern",
  "royal-ottoman",
  "andalusia-luxury",
  "midnight-sapphire",
  "nabawi-green",
  "makkah-premium",
  "ramadan-special",
  "eid-celebration",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME_ID: ThemeId = "classic";
