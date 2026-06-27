import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartMasjid - Mosque Management System",
  description: "Modern, comprehensive mosque management platform for prayer times, donations, events, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth"
    >
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
