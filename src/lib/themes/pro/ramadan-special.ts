import type { TVThemeConfig } from "../types";

/**
 * Ramadan Special Theme (Pro)
 * 
 * Celebratory Ramadan atmosphere with deep purple-indigo and crescent moon motifs.
 * Festive, spiritual, warm — perfect for the blessed month.
 */
export const ramadanSpecialTheme: TVThemeConfig = {
  id: "ramadan-special",
  name: "Ramadan Special",
  description: "Nuansa Ramadan yang khidmat dan meriah dengan ungu-indigo dan motif bulan sabit",
  tier: "pro",

  typography: {
    fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
    fontFamilyArabic: "'Lateef', 'Amiri', serif",
    headingWeight: "700",
    bodyWeight: "400",
  },

  colors: {
    primary: "#7c3aed", // violet-600
    secondary: "#6d28d9", // violet-700
    background: "#1e1b4b", // indigo-950
    surface: "#312e81", // indigo-900
    textPrimary: "#ede9fe", // violet-100
    textSecondary: "#c4b5fd", // violet-300
    prayerHighlight: "#a78bfa", // violet-400
    timeAccent: "#818cf8", // indigo-400
    border: "#4338ca", // indigo-700
    ornament: "#4c1d95", // violet-900
  },

  layout: {
    padding: "2.5rem",
    gap: "2rem",
    borderRadius: "1rem",
    headerHeight: "145px",
    footerHeight: "90px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 28,
    showMosqueSilhouette: true,
    backgroundOverlay: 20,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: true,
    duration: 800,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  previewImage: "/themes/preview-ramadan-special.jpg",
};
