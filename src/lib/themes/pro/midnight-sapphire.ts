import type { TVThemeConfig } from "../types";

/**
 * Midnight Sapphire Theme (Pro)
 * 
 * Deep navy and sapphire blue with silver accents.
 * Elegant night-sky aesthetic with subtle star-like patterns.
 */
export const midnightSapphireTheme: TVThemeConfig = {
  id: "midnight-sapphire",
  name: "Midnight Sapphire",
  description: "Tampilan mewah biru safir dengan aksen perak, sempurna untuk masjid modern",
  tier: "pro",

  typography: {
    fontFamily: "'Montserrat', 'Inter', sans-serif",
    headingWeight: "700",
    bodyWeight: "300",
  },

  colors: {
    primary: "#3b82f6", // blue-500
    secondary: "#6366f1", // indigo-500
    background: "#0f172a", // slate-900
    surface: "#1e293b", // slate-800
    textPrimary: "#f1f5f9", // slate-100
    textSecondary: "#94a3b8", // slate-400
    prayerHighlight: "#60a5fa", // blue-400
    timeAccent: "#818cf8", // indigo-400
    border: "#334155", // slate-700
    ornament: "#1d4ed8", // blue-700
  },

  layout: {
    padding: "2.5rem",
    gap: "2rem",
    borderRadius: "1.25rem",
    headerHeight: "140px",
    footerHeight: "85px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 20,
    showMosqueSilhouette: false,
    backgroundOverlay: 15,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: true,
    duration: 600,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  previewImage: "/themes/preview-midnight-sapphire.jpg",
};
