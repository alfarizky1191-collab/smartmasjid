import { supabase } from "@/lib/supabase/client";
import type { SlideRow } from "./types";

/**
 * Fetch slides for a mosque, newest first.
 * Reuses the same slides table used by TV Display — no duplication.
 */
export async function getSlides(mosqueId: string): Promise<SlideRow[]> {
  const { data, error } = await supabase
    .from("slides")
    .select("id, mosque_id, image_url, created_at")
    .eq("mosque_id", mosqueId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as SlideRow[];
}

/**
 * Fetch the mosque QRIS image URL.
 * Returns null if not configured.
 */
export async function getQrisImageUrl(mosqueId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("qris_settings")
    .select("image_url")
    .eq("mosque_id", mosqueId)
    .single();

  if (error || !data?.image_url) return null;
  return data.image_url as string;
}
