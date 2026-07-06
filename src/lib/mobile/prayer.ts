/**
 * Prayer times service for SmartMasjid Mobile.
 *
 * Reuses the same Aladhan API call pattern used by TV Display and m/[slug].
 * Method 11 = Kemenag RI (used consistently across the project).
 */
import type { PrayerEntry, PrayerCountdown } from "./types";

// ─── Aladhan fetch ────────────────────────────────────────────────────────

export async function fetchPrayerTimesForCity(city: string): Promise<Record<string, string> | null> {
  if (!city.trim()) return null;
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city.trim())}&country=Indonesia&method=11`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.timings ?? null;
  } catch {
    return null;
  }
}

// ─── Build prayer list from raw timings ──────────────────────────────────

/**
 * Returns the ordered prayer list for the day.
 * Includes Imsak during Ramadhan, same logic as TV Display.
 */
export function buildPrayerList(timings: Record<string, string>): PrayerEntry[] {
  const isRamadhan = new Date()
    .toLocaleDateString("en-TN-u-ca-islamic")
    .includes("Ramadan");

  const list: PrayerEntry[] = [
    ...(isRamadhan ? [{ name: "Imsak", time: timings.Imsak ?? "" }] : []),
    { name: "Subuh",   time: timings.Fajr    ?? "" },
    { name: "Syuruq",  time: timings.Sunrise ?? "" },
    { name: "Dzuhur",  time: timings.Dhuhr   ?? "" },
    { name: "Ashar",   time: timings.Asr     ?? "" },
    { name: "Maghrib", time: timings.Maghrib ?? "" },
    { name: "Isya",    time: timings.Isha    ?? "" },
  ];

  return list.filter((p) => Boolean(p.time));
}

/**
 * Returns prayers list without Syuruq (Syuruq is not a prayer to pray,
 * just a reference time shown as badge). Used for the grid.
 */
export function buildSholatList(timings: Record<string, string>): PrayerEntry[] {
  return buildPrayerList(timings).filter((p) => p.name !== "Syuruq");
}

// ─── Countdown ────────────────────────────────────────────────────────────

/**
 * Given a list of prayers (without Syuruq), return which prayer is next
 * and the formatted "HH:MM:SS" countdown.
 * Matches exact logic from TV Display and m/[slug].
 */
export function getNextPrayerCountdown(prayers: PrayerEntry[]): PrayerCountdown {
  const now = new Date();

  for (const prayer of prayers) {
    if (!prayer.time) continue;
    const [h, m] = prayer.time.split(":").map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(h, m, 0, 0);
    if (prayerDate > now) {
      return { name: prayer.name, countdown: diffToHMS(prayerDate.getTime() - now.getTime()) };
    }
  }

  // All prayers done today → wrap to Subuh tomorrow
  const first = prayers.find((p) => p.name === "Subuh") ?? prayers[0];
  if (!first?.time) return { name: "Subuh", countdown: "00:00:00" };

  const [h, m] = first.time.split(":").map(Number);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(h, m, 0, 0);
  return { name: first.name, countdown: diffToHMS(tomorrow.getTime() - now.getTime()) };
}

function diffToHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hrs  = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// ─── Decorate with isNext / isDone flags ─────────────────────────────────

export function decoratePrayerList(
  prayers: PrayerEntry[],
  nextName: string
): PrayerEntry[] {
  const now = new Date();
  let foundNext = false;

  return prayers.map((p) => {
    const [h, m] = (p.time ?? "").split(":").map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(h, m, 0, 0);

    const isNext = p.name === nextName && !foundNext;
    if (isNext) foundNext = true;

    return {
      ...p,
      isNext,
      isDone: prayerDate < now && !isNext,
    };
  });
}

// ─── Iqomah formatter (reused from TV Display) ───────────────────────────

export function formatIqomah(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${pad(mins)}:${pad(secs)}`;
}
