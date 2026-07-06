import type { TVThemeConfig } from "../types";

/**
 * Emerald Modern Theme
 * 
 * Contemporary design with gradient backgrounds and modern typography.
 * Bold emerald-teal palette with smooth animations.
 */
export const emeraldModernTheme: TVThemeConfig = {
  id: "emerald-modern",
  name: "Emerald Modern",
  description: "Desain kontemporer dengan gradasi hijau-tosca dan tipografi modern",
  tier: "free",

  typography: {
    fontFamily: "'Poppins', 'Inter', sans-serif",
    headingWeight: "600",
    bodyWeight: "400",
  },

  colors: {
    primary: "#14b8a6", // teal-500
    secondary: "#0d9488", // teal-600
    background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)", // emerald-50 to teal-50
    surface: "#ffffff",
    textPrimary: "#0f172a", // slate-900
    textSecondary: "#64748b", // slate-500
    prayerHighlight: "#14b8a6",
    timeAccent: "#06b6d4", // cyan-500
    border: "#e2e8f0", // slate-200
    ornament: "#99f6e4", // teal-200
  },

  layout: {
    padding: "2.5rem",
    gap: "2rem",
    borderRadius: "1.5rem",
    headerHeight: "140px",
    footerHeight: "90px",
  },

  ornament: {
    showPattern: true,
    patternOpacity: 20,
    showMosqueSilhouette: true,
    backgroundOverlay: 5,
  },

  animation: {
    enableFadeIn: true,
    enableSlide: true,
    duration: 600,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  previewImage: "/themes/preview-emerald-modern.jpg",
};
