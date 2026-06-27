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
  if (!mosque) return { title: "Masjid Tidak Ditemukan | SmartMasjid" };

  const description = `${mosque.address} — ${mosque.city}, ${mosque.province}`;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://smartmasjid.id"}/masjid/${slug}`;

  return {
    title: `${mosque.name} | SmartMasjid`,
    description,
    openGraph: {
      title: mosque.name,
      description,
      url,
      images: mosque.logo_url ? [mosque.logo_url] : [],
    },
    twitter: { card: "summary", title: mosque.name, description },
    alternates: { canonical: url },
  };
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
