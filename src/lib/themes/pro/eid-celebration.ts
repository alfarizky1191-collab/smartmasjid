import type { TVThemeConfig } from "../types";

/**
 * Eid Celebration Theme (Pro)
 * 
 * Joyful and festive for Eid al-Fitr and Eid al-Adha.
 * Warm gold, bright green, and white with celebratory animations.
 */
export const eidCelebrationTheme: TVThemeConfig = {
  id: "eid-celebration",
  name: "Eid Celebration",
  description: "Semarak dan meriah untuk Idul Fitri dan Idul Adha dengan emas, hijau, dan putih",
  tier: "pro",

  typography: {
    fontFamily: "'Raleway', 'Nunito', sans-serif",
    fontFamilyArabic: "'Scheherazade New', serif",
    headingWeight: "800",
    bodyWeight: "500",
  },

  colors: {
    primary: "#16a34a", // green-600
    secondary: "#ca8a04", // yellow-600 (gold)
    background: "#fefce8", // yellow-50 warm white
    surface: "#ffffff",
    textPrimary: "#14532d", // green-950
    textSecondary: "#166534", // green-900
    prayerHighlight: "#16a34a",
    timeAccent: "#ca8a04",
    border: "#bbf7d0", // green-200
    ornament: "#fef9c3", // yellow-100
  },

  layout: {
    padding: "2rem",
    gap: "1.5rem",
    borderRadius: "1.5rem",
    headerHeight: "140px",
    footerHeight: "85px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 20,
    showMosqueSilhouette: true,
    backgroundOverlay: 0,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: true,
    duration: 500,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // bouncy spring
  },

  previewImage: "/themes/preview-eid-celebration.jpg",
};
