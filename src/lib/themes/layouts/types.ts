/**
 * Shared props passed to every TV layout component.
 *
 * All data comes from TVPage state — layouts are purely presentational.
 * Business logic (prayer calculation, realtime, adzan) stays in tv/page.tsx.
 */
export interface TVDisplayProps {
  // Mosque info
  mosque: any;

  // Time & date
  time: string;

  // Prayer
  prayerGrid: { name: string; time: string | undefined }[];
  nextPrayer: string;
  countdown: string;

  // Adzan / iqomah state
  showAdzan: boolean;
  currentPrayer: string;
  iqomahCountdown: number;
  showPrayerMode: boolean;
  autoAdzanEnabled: boolean;
  setAutoAdzanEnabled: (v: boolean) => void;
  stopAdzan: () => void;
  goFullscreen: () => void;

  // Test buttons refs (optional — not all layouts need to show them)
  onTestAdzan?: () => void;
  onTestAlarm?: () => void;

  // Jumat
  isFriday: boolean;
  showJumatMode: boolean;

  // Content
  announcements: any[];
  events: any[];
  slides: any[];
  currentSlide: number;
  todayOfficers: { role: string; name: string }[];
  qrisUrl: string;

  // Running text
  runningText?: string;
  runningTextSpeed?: number;
}
