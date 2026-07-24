import type { Metadata, Viewport } from "next";
import Script from "next/script";
import AppShell      from "./components/mobile/AppShell";
import InstallPrompt from "./components/mobile/InstallPrompt";
import OfflineBanner from "./components/mobile/OfflineBanner";
import { ThemeProvider } from "@/lib/themes/ThemeProvider";

// ─── PWA Metadata ─────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "SmartMasjid Mobile",
    template: "%s — SmartMasjid",
  },
  description: "Portal Jamaah SmartMasjid — Jadwal Sholat, Pengumuman & Donasi",
  manifest: "/manifest.webmanifest",
  applicationName: "SmartMasjid Mobile",
  keywords: ["masjid", "sholat", "jadwal", "pengumuman", "donasi", "islam"],
  authors: [{ name: "SmartMasjid" }],

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SmartMasjid",
  },

  openGraph: {
    type: "website",
    siteName: "SmartMasjid Mobile",
    title: "SmartMasjid Mobile",
    description: "Portal Jamaah SmartMasjid",
  },

  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },

  icons: {
    icon:     [{ url: "/icons/icon-192.svg", type: "image/svg+xml", sizes: "any" }],
    apple:    [{ url: "/icons/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" }],
    shortcut: "/icons/icon-192.svg",
  },

  other: {
    "mobile-web-app-capable":    "yes",
    "msapplication-TileColor":   "#059669",
    "msapplication-tap-highlight": "no",
  },
};

// ─── Viewport ─────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)",  color: "#059669" },
  ],
};

// ─── Layout ───────────────────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {/* Offline banner — fixed top, shows only when offline */}
      <OfflineBanner />

      {/* AppShell — hides nav + padding on /app/select-mosque */}
      <AppShell>{children}</AppShell>

      {/* Install prompt — shows after 3s, remembers dismissal */}
      <InstallPrompt />

      {/* Service Worker registration — after page is interactive */}
      <Script
        id="sw-register"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then(function(reg) {
                    // Force check for update immediately on load
                    reg.update();
                    // Then check every 30 minutes
                    setInterval(function() { reg.update(); }, 30 * 60 * 1000);

                    // When new SW is found, tell it to skip waiting immediately
                    reg.addEventListener('updatefound', function() {
                      var newWorker = reg.installing;
                      if (!newWorker) return;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed') {
                          // Tell the new SW to activate immediately (skip waiting)
                          newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                      });
                    });
                  })
                  .catch(function(err) {
                    console.warn('[SW] Registration failed:', err);
                  });

                // When SW_UPDATED message received (new SW activated), reload page
                navigator.serviceWorker.addEventListener('message', function(event) {
                  if (event.data && event.data.type === 'SW_UPDATED') {
                    console.log('[SW] Updated to', event.data.version, '— reloading...');
                    window.location.reload();
                  }
                });

                // Also reload if controller changes (new SW took control)
                var refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                  }
                });
              });
            }
          `,
        }}
      />
    </ThemeProvider>
  );
}
