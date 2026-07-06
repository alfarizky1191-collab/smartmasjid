import { supabase } from "@/lib/supabase/client";
import type { OfficerEntry } from "./types";

/**
 * Fetch today's officer schedule for a mosque.
 * Matches the exact query shape used in TV Display and m/[slug].
 * Returns only entries that have a valid officer name.
 */
export async function getTodayOfficers(mosqueId: string): Promise<OfficerEntry[]> {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const { data, error } = await supabase
    .from("officer_schedules")
    .select("role, officers(name)")
    .eq("mosque_id", mosqueId)
    .eq("schedule_date", today);

  if (error || !data) return [];

  // Supabase returns the joined `officers` column as an array from the relation.
  // We cast to unknown first to satisfy strict TS, then do the safe access.
  return (data as unknown as Array<{ role: string; officers: { name: string }[] | { name: string } | null }>)
    .map((d) => {
      let name = "";
      if (Array.isArray(d.officers)) {
        name = d.officers[0]?.name ?? "";
      } else if (d.officers && typeof d.officers === "object") {
        name = (d.officers as { name: string }).name ?? "";
      }
      return { role: d.role, name };
    })
    .filter((o) => Boolean(o.name));
}
