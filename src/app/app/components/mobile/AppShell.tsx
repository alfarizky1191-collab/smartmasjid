"use client";

/**
 * AppShell — wraps main content + BottomNavigation.
 * On /app/select-mosque the shell is completely hidden so the page
 * renders fullscreen without any nav chrome.
 */

import { usePathname } from "next/navigation";
import BottomNavigation from "./BottomNavigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSelectMosque = pathname === "/app/select-mosque";

  if (isSelectMosque) {
    // Fullscreen — no bottom nav, no bottom padding, no shell wrapper
    return <>{children}</>;
  }

  return (
    <div
      className="relative min-h-screen antialiased"
      style={{
        background: "var(--pwa-bg)",
        color: "var(--pwa-text-primary)",
        WebkitOverflowScrolling: "touch",
      } as React.CSSProperties}
    >
      <div style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
}
