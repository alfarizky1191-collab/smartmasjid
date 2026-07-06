import type { TVThemeConfig } from "../types";

/**
 * Makkah Premium Theme (Pro)
 * 
 * Inspired by the Grand Mosque in Makkah.
 * Rich black and gold — luxurious, majestic, timeless.
 */
export const makkahPremiumTheme: TVThemeConfig = {
  id: "makkah-premium",
  name: "Makkah Premium",
  description: "Terinspirasi Masjidil Haram, hitam dan emas mewah yang agung dan abadi",
  tier: "pro",

  typography: {
    fontFamily: "'EB Garamond', 'Playfair Display', serif",
    fontFamilyArabic: "'Amiri Quran', 'Amiri', serif",
    headingWeight: "700",
    bodyWeight: "400",
  },

  colors: {
    primary: "#d97706", // amber-600 (gold)
    secondary: "#f59e0b", // amber-500
    background: "#0a0a0a", // near black
    surface: "#1a1a1a", // dark surface
    textPrimary: "#fef3c7", // amber-100
    textSecondary: "#fcd34d", // amber-300
    prayerHighlight: "#fbbf24", // amber-400
    timeAccent: "#f59e0b", // amber-500
    border: "#451a03", // dark amber
    ornament: "#78350f", // amber-900
  },

  layout: {
    padding: "2.5rem",
    gap: "2rem",
    borderRadius: "0.5rem",
    headerHeight: "150px",
    footerHeight: "95px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 35,
    showMosqueSilhouette: true,
    backgroundOverlay: 30,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: false,
    duration: 900,
    easing: "ease-out",
  },

  previewImage: "/themes/preview-makkah-premium.jpg",
};
