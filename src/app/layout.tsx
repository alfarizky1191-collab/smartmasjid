import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SmartMasjid — Platform Digital Masjid Modern Indonesia",
    template: "%s | SmartMasjid",
  },
  description:
    "SmartMasjid adalah platform manajemen masjid digital untuk Indonesia. Dashboard admin, tampilan TV, jadwal sholat real-time, donasi QRIS, pengumuman, dan aplikasi mobile jamaah — gratis untuk semua masjid.",
  keywords: [
    "smartmasjid",
    "aplikasi masjid",
    "manajemen masjid digital",
    "jadwal sholat",
    "tv display masjid",
    "donasi masjid qris",
    "dashboard masjid",
    "masjid digital indonesia",
    "pengumuman masjid",
    "software masjid",
  ],
  authors: [{ name: "SmartMasjid", url: SITE_URL }],
  creator: "SmartMasjid",
  publisher: "SmartMasjid",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "SmartMasjid",
    title: "SmartMasjid — Platform Digital Masjid Modern Indonesia",
    description:
      "Dashboard admin, tampilan TV, jadwal sholat real-time, donasi QRIS, dan aplikasi mobile untuk masjid Indonesia — gratis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SmartMasjid — Platform Digital Masjid Modern",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartMasjid — Platform Digital Masjid Modern Indonesia",
    description:
      "Dashboard admin, tampilan TV, jadwal sholat real-time, donasi QRIS, dan aplikasi mobile untuk masjid Indonesia — gratis.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: SITE_URL,
    languages: { "id-ID": SITE_URL },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: "/icons/apple-touch-icon.svg",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SmartMasjid",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android, iOS",
  description:
    "Platform digital manajemen masjid modern untuk Indonesia. Dashboard admin, TV display, jadwal sholat, donasi QRIS, dan aplikasi mobile.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
  publisher: {
    "@type": "Organization",
    name: "SmartMasjid",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
