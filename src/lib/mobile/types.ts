// ─── Shared types for SmartMasjid Mobile module ───────────────────────────
// All Supabase row shapes are typed here so service functions stay thin.

export interface MosqueRow {
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  city?: string | null;
  province?: string | null;
  address?: string | null;
  // Optional — may not exist in all deployments
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  email?: string | null;
  tagline?: string | null;
  running_text?: string | null;
  running_text_speed?: number | null;
  iqomah_duration?: number | null;
  // Allow any extra columns returned by Supabase select *
  [key: string]: unknown;
}

export interface AnnouncementRow {
  id: number;
  mosque_id: string;
  title: string;
  created_at: string;
}

export interface EventRow {
  id: number;
  mosque_id: string;
  title: string;
  speaker: string | null;
  event_date: string;   // "YYYY-MM-DD"
  event_time: string | null;
  location: string | null;
}

export interface OfficerScheduleRow {
  role: string;
  officers: { name: string } | null;
}

export interface OfficerEntry {
  role: string;
  name: string;
}

export interface SlideRow {
  id: number;
  mosque_id: string;
  image_url: string;
  created_at: string;
}

export interface QrisRow {
  image_url: string | null;
}

// Favorite mosque — persisted in localStorage, no login required
export interface FavoriteMosque {
  mosque_id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  province: string | null;
  last_visit: string; // ISO timestamp
}

// Prayer helpers
export interface PrayerEntry {
  name: string;
  time: string;        // "HH:MM"
  isNext?: boolean;
  isDone?: boolean;
}

export interface PrayerCountdown {
  name: string;
  countdown: string;   // "HH:MM:SS"
}
