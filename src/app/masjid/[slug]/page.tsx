import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import type {
  MosquePublic,
  Announcement,
  Event,
  OfficerSchedule,
  QrisSettings,
  Donation,
  Slide,
} from "@/components/public/types";

import Hero from "@/components/public/Hero";
import QuickMenu from "@/components/public/QuickMenu";
import PrayerSection from "@/components/public/PrayerSection";
import AnnouncementSection from "@/components/public/AnnouncementSection";
import EventSection from "@/components/public/EventSection";
import OfficerSection from "@/components/public/OfficerSection";
import DonationSection from "@/components/public/DonationSection";
import SlideCarousel from "@/components/public/SlideCarousel";
import LocationSection from "@/components/public/LocationSection";
import Footer from "@/components/public/Footer";
import { SITE_URL } from "@/lib/site";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = { params: Promise<{ slug: string }> };

async function getMosque(slug: string): Promise<MosquePublic | null> {
  const { data } = await supabase
    .from("mosques")
    .select("id, name, slug, city, province, address, logo_url, latitude, longitude")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mosque = await getMosque(slug);
  if (!mosque) {
    return {
      title: "Masjid Tidak Ditemukan | SmartMasjid",
      robots: { index: false, follow: false },
    };
  }

  const url = `${SITE_URL}/masjid/${encodeURIComponent(mosque.slug)}`;
  const title = `${mosque.name} — Jadwal Sholat & Informasi Masjid | SmartMasjid`;
  const description = `Jadwal sholat, profil, lokasi, pengumuman, kegiatan, dan informasi ${mosque.name} di ${mosque.city}, ${mosque.province}. Lihat informasi masjid di SmartMasjid.`;
  const image = mosque.logo_url || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      mosque.name,
      `jadwal sholat ${mosque.name}`,
      `masjid ${mosque.city}`,
      `masjid ${mosque.province}`,
      "SmartMasjid",
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
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
    alternates: {
      canonical: url,
      languages: { "id-ID": url },
    },
  };
}

function MosqueJsonLd({ mosque }: { mosque: MosquePublic }) {
  const url = `${SITE_URL}/masjid/${encodeURIComponent(mosque.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Mosque",
    name: mosque.name,
    url,
    description: `Profil dan informasi ${mosque.name} di ${mosque.city}, ${mosque.province}.`,
    image: mosque.logo_url || `${SITE_URL}/og-image.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: mosque.address || undefined,
      addressLocality: mosque.city || undefined,
      addressRegion: mosque.province || undefined,
      addressCountry: "ID",
    },
    ...(mosque.latitude != null && mosque.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: mosque.latitude,
            longitude: mosque.longitude,
          },
        }
      : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "SmartMasjid",
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function MosquePortalPage({ params }: Props) {
  const { slug } = await params;
  const mosque = await getMosque(slug);
  if (!mosque) notFound();

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const mosqueId = mosque.id;

  const [
    { data: announcements },
    { data: events },
    { data: schedules },
    { data: qrisData },
    { data: donations },
    { data: slides },
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, is_active, created_at")
      .eq("mosque_id", mosqueId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, speaker, event_date, event_time, location, description")
      .eq("mosque_id", mosqueId)
      .gte("event_date", today)
      .order("event_date", { ascending: true }),
    supabase
      .from("officer_schedules")
      .select("id, schedule_date, role, officers(id, name)")
      .eq("mosque_id", mosqueId)
      .eq("schedule_date", today),
    supabase
      .from("qris_settings")
      .select("id, image_url")
      .eq("mosque_id", mosqueId)
      .single(),
    supabase
      .from("donations")
      .select("id, donor_name, amount, created_at")
      .eq("mosque_id", mosqueId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("slides")
      .select("id, image_url")
      .eq("mosque_id", mosqueId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <MosqueJsonLd mosque={mosque} />
      <Hero mosque={mosque} />
      <QuickMenu />
      <PrayerSection city={mosque.city} />
      <SlideCarousel slides={(slides as Slide[]) ?? []} />
      <AnnouncementSection announcements={(announcements as Announcement[]) ?? []} />
      <EventSection events={(events as Event[]) ?? []} />
      <OfficerSection schedules={(schedules as unknown as OfficerSchedule[]) ?? []} />
      <DonationSection
        qris={(qrisData as QrisSettings) ?? null}
        donations={(donations as Donation[]) ?? []}
      />
      <LocationSection mosque={mosque} />
      <Footer />
    </div>
  );
}
