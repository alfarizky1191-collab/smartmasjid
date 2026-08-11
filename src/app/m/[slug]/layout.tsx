import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

type MosqueSeo = {
  name: string;
  slug: string;
  city: string | null;
  province: string | null;
  address: string | null;
  logo_url: string | null;
};

async function getMosqueForSeo(slug: string): Promise<MosqueSeo | null> {
  const { data, error } = await supabase
    .from("mosques")
    .select("name, slug, city, province, address, logo_url")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as MosqueSeo;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mosque = await getMosqueForSeo(slug);

  if (!mosque) {
    return {
      title: "Masjid Tidak Ditemukan | SmartMasjid",
      robots: {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
    };
  }

  const encodedSlug = encodeURIComponent(mosque.slug);
  const url = `${SITE_URL}/m/${encodedSlug}`;
  const location = [mosque.city, mosque.province].filter(Boolean).join(", ");
  const locationText = location || "Indonesia";
  const title = `${mosque.name} — Jadwal Sholat & Informasi Masjid | SmartMasjid`;
  const description = `Jadwal sholat, profil, lokasi, pengumuman, kegiatan, dan informasi ${mosque.name} di ${locationText}. Lihat informasi masjid di SmartMasjid.`;
  const image = mosque.logo_url || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      mosque.name,
      `jadwal sholat ${mosque.name}`,
      `masjid ${mosque.city || "Indonesia"}`,
      `masjid ${mosque.province || "Indonesia"}`,
      "SmartMasjid",
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
    },
    alternates: {
      canonical: url,
      languages: { "id-ID": url },
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: "SmartMasjid",
      title,
      description,
      url,
      images: [
        {
          url: image,
          alt: `${mosque.name} — SmartMasjid`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function MosqueSlugLayout({ children }: Props) {
  return children;
}
