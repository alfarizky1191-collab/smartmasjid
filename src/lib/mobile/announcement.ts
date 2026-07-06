import { supabase } from "@/lib/supabase/client";
import type { AnnouncementRow } from "./types";

/**
 * Fetch up to 5 latest announcements for a mosque.
 * Newest first, scoped to the given mosque_id for multi-tenant isolation.
 */
export async function getAnnouncements(mosqueId: string): Promise<AnnouncementRow[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, mosque_id, title, created_at")
    .eq("mosque_id", mosqueId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data) return [];
  return data as AnnouncementRow[];
}
