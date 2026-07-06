import { supabase } from "@/lib/supabase/client";
import type { EventRow } from "./types";

/**
 * Fetch up to 5 upcoming events (today and future) for a mosque.
 * Scoped by mosque_id for multi-tenant isolation.
 */
export async function getUpcomingEvents(mosqueId: string): Promise<EventRow[]> {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const { data, error } = await supabase
    .from("events")
    .select("id, mosque_id, title, speaker, event_date, event_time, location")
    .eq("mosque_id", mosqueId)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(5);

  if (error || !data) return [];
  return data as EventRow[];
}
