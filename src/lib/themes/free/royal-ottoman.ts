import type { TVThemeConfig } from "../types";

/**
 * Royal Ottoman Theme
 * 
 * Inspired by Ottoman architecture with rich green and gold tones.
 * Ornate patterns and decorative borders evoking classical Islamic art.
 */
export const royalOttomanTheme: TVThemeConfig = {
  id: "royal-ottoman",
  name: "Royal Ottoman",
  description: "Terinspirasi arsitektur Ottoman dengan perpaduan hijau tua dan emas yang megah",
  tier: "free",

  typography: {
    fontFamily: "'Playfair Display', 'Merriweather', serif",
    fontFamilyArabic: "'Amiri', serif",
    headingWeight: "700",
    bodyWeight: "400",
  },

  colors: {
    primary: "#b45309", // amber-700 (gold)
    secondary: "#d97706", // amber-600
    background: "#14532d", // green-900
    surface: "#166534", // green-800
    textPrimary: "#fef3c7", // amber-100
    textSecondary: "#fcd34d", // amber-300
    prayerHighlight: "#fbbf24", // amber-400
    timeAccent: "#fcd34d", // amber-300
    border: "#854d0e", // amber-800
    ornament: "#78350f", // amber-900
  },

  layout: {
    padding: "2rem",
    gap: "1.5rem",
    borderRadius: "0.75rem",
    headerHeight: "130px",
    footerHeight: "85px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 25,
    showMosqueSilhouette: true,
    backgroundOverlay: 20,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: false,
    duration: 700,
    easing: "ease-out",
  },

  previewImage: "/themes/preview-royal-ottoman.jpg",
};
