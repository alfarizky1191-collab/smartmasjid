import type { TVThemeConfig } from "../types";

/**
 * Classic Theme
 * 
 * Traditional mosque display with emerald green accents.
 * Clean, professional, and easy to read from a distance.
 */
export const classicTheme: TVThemeConfig = {
  id: "classic",
  name: "Classic",
  description: "Tampilan tradisional dengan aksen hijau zamrud yang elegan dan profesional",
  tier: "free",

  typography: {
    fontFamily: "'Inter', sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
  },

  colors: {
    primary: "#10b981", // emerald-500
    secondary: "#059669", // emerald-600
    background: "#f9fafb", // gray-50
    surface: "#ffffff",
    textPrimary: "#111827", // gray-900
    textSecondary: "#6b7280", // gray-500
    prayerHighlight: "#10b981",
    timeAccent: "#059669",
    border: "#e5e7eb", // gray-200
    ornament: "#d1fae5", // emerald-100
  },

  layout: {
    padding: "2rem",
    gap: "1.5rem",
    borderRadius: "1rem",
    headerHeight: "120px",
    footerHeight: "80px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 15,
    showMosqueSilhouette: false,
    backgroundOverlay: 0,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: true,
    duration: 500,
    easing: "ease-in-out",
  },

  previewImage: "/themes/preview-classic.jpg",
};
