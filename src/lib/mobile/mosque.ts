import { supabase } from "@/lib/supabase/client";
import type { MosqueRow } from "./types";

/**
 * Fetch a single mosque by its slug.
 * Returns null when not found or on error.
 */
export async function getMosqueBySlug(slug: string): Promise<MosqueRow | null> {
  const { data, error } = await supabase
    .from("mosques")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as MosqueRow;
}

/**
 * Search mosques by name, city, province, or slug.
 * Used in onboarding search + MosqueSearchSheet.
 * Multi-tenant safe: returns public data only.
 */
export async function searchMosques(query: string, limit = 10): Promise<MosqueRow[]> {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from("mosques")
    .select("id, slug, name, logo_url, city, province, address")
    .or(
      `name.ilike.%${q}%,city.ilike.%${q}%,province.ilike.%${q}%,slug.ilike.%${q}%`
    )
    .limit(limit);

  if (error || !data) return [];
  return data as MosqueRow[];
}

/**
 * Get popular / recently-registered mosques for the onboarding picker.
 * Ordered by created_at descending — shows newest registered first.
 */
export async function getPopularMosques(limit = 10): Promise<MosqueRow[]> {
  const { data, error } = await supabase
    .from("mosques")
    .select("id, slug, name, logo_url, city, province, address")
    .not("slug", "is", null)
    .not("name", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as MosqueRow[];
}
