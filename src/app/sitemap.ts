import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: mosques } = await supabase
    .from("mosques")
    .select("slug")
    .not("slug", "is", null);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/register`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/app`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/masjid`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const mosqueRoutes: MetadataRoute.Sitemap = (mosques ?? []).map(({ slug }) => ({
    url: `${SITE_URL}/m/${encodeURIComponent(slug)}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...mosqueRoutes];
}
