import type { TVThemeConfig } from "../types";

/**
 * Nabawi Green Theme (Pro)
 * 
 * Inspired by the Prophet's Mosque in Madinah.
 * Pure deep green with white and silver, peaceful and sacred atmosphere.
 */
export const nabawiGreenTheme: TVThemeConfig = {
  id: "nabawi-green",
  name: "Nabawi Green",
  description: "Terinspirasi Masjid Nabawi, hijau dalam yang tenang dengan nuansa suci dan damai",
  tier: "pro",

  typography: {
    fontFamily: "'Noto Sans', 'Inter', sans-serif",
    fontFamilyArabic: "'Scheherazade New', serif",
    headingWeight: "600",
    bodyWeight: "400",
  },

  colors: {
    primary: "#15803d", // green-700
    secondary: "#166534", // green-800
    background: "#052e16", // green-950
    surface: "#14532d", // green-900
    textPrimary: "#f0fdf4", // green-50
    textSecondary: "#86efac", // green-300
    prayerHighlight: "#4ade80", // green-400
    timeAccent: "#86efac", // green-300
    border: "#166534", // green-800
    ornament: "#166534", // green-800
  },

  layout: {
    padding: "2rem",
    gap: "1.75rem",
    borderRadius: "1rem",
    headerHeight: "135px",
    footerHeight: "85px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 18,
    showMosqueSilhouette: true,
    backgroundOverlay: 10,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: true,
    duration: 700,
    easing: "ease-in-out",
  },

  previewImage: "/themes/preview-nabawi-green.jpg",
};
