import type { TVThemeConfig } from "../types";

/**
 * Andalusia Luxury Theme (Pro)
 * 
 * Inspired by Moorish architecture of Andalusia. 
 * Rich burgundy, terracotta, and gold with intricate geometric ornaments.
 */
export const andalusiaLuxuryTheme: TVThemeConfig = {
  id: "andalusia-luxury",
  name: "Andalusia Luxury",
  description: "Terinspirasi arsitektur Moorish Andalusia dengan burgundy, terracotta, dan emas",
  tier: "pro",

  typography: {
    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
    fontFamilyArabic: "'Amiri', serif",
    headingWeight: "600",
    bodyWeight: "400",
  },

  colors: {
    primary: "#9f1239", // rose-800 (burgundy)
    secondary: "#be185d", // pink-700
    background: "#1c0a00", // very dark brown
    surface: "#2d1206", // dark brown
    textPrimary: "#fef3c7", // amber-100
    textSecondary: "#fcd34d", // amber-300
    prayerHighlight: "#f59e0b", // amber-500
    timeAccent: "#fbbf24", // amber-400
    border: "#7c2d12", // orange-900
    ornament: "#c2410c", // orange-700
  },

  layout: {
    padding: "2.5rem",
    gap: "2rem",
    borderRadius: "0.5rem",
    headerHeight: "150px",
    footerHeight: "90px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 30,
    showMosqueSilhouette: true,
    backgroundOverlay: 25,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: true,
    duration: 800,
    easing: "ease-in-out",
  },

  previewImage: "/themes/preview-andalusia-luxury.jpg",
};
