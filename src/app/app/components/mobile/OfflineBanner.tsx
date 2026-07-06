"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Offline indicator banner.
 * - Shows when the device goes offline.
 * - Shows a brief "back online" confirmation when reconnecting.
 * - Listens to SW postMessage for accurate state.
 */
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      // Hide "back online" toast after 3s
      setTimeout(() => setJustReconnected(false), 3000);
    };

    // SW postMessage fallback
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "ONLINE") handleOnline();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  if (!isOffline && !justReconnected) return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-[100]
        flex items-center justify-center gap-2 px-4 py-2.5
        text-xs font-semibold text-white
        transition-all duration-300
        ${isOffline
          ? "bg-red-500/95 backdrop-blur-sm"
          : "bg-emerald-500/95 backdrop-blur-sm"
        }
      `}
      style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
      role="status"
      aria-live="polite"
    >
      {isOffline ? (
        <>
          <WifiOff size={13} strokeWidth={2.5} />
          Anda sedang offline — Menampilkan data terakhir yang tersimpan
        </>
      ) : (
        <>
          <Wifi size={13} strokeWidth={2.5} />
          Kembali online — Memperbarui data...
        </>
      )}
    </div>
  );
}
