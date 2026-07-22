"use client";

/**
 * usePushNotification
 *
 * Handles the full push notification subscribe/unsubscribe flow:
 * 1. Check browser support
 * 2. Request Notification permission
 * 3. Subscribe via PushManager with VAPID public key
 * 4. Insert subscription directly to Supabase (no API route needed)
 * 5. Persist subscription state in localStorage
 * 6. Unsubscribe: call PushManager.unsubscribe() + delete from Supabase
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const STORAGE_KEY = "push_subscribed_mosque";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

export type PushStatus = "idle" | "loading" | "subscribed" | "denied" | "error" | "unsupported";

export function usePushNotification(mosque_id: string | null | undefined) {
  const [status, setStatus] = useState<PushStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // ── Hydrate from localStorage & PushManager ─────────────────────────────
  useEffect(() => {
    if (!isSupported || !mosque_id) return;

    const hydrate = async () => {
      try {
        // Check notification permission first
        if (Notification.permission === "denied") {
          setStatus("denied");
          setHydrated(true);
          return;
        }

        // Get Service Worker registration
        const reg = await getRegistration();
        if (!reg) {
          console.warn("[push] Service Worker not ready during hydration");
          setHydrated(true);
          return;
        }

        // Check if already subscribed in PushManager (most reliable source)
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          console.log("[push] Found existing subscription in PushManager");
          setStatus("subscribed");
          // Update localStorage to match
          localStorage.setItem(STORAGE_KEY, mosque_id);
          setHydrated(true);
          return;
        }

        // No active subscription
        setStatus("idle");
        localStorage.removeItem(STORAGE_KEY);
        setHydrated(true);
      } catch (err) {
        console.error("[push] Hydration error:", err);
        setStatus("idle");
        setHydrated(true);
      }
    };

    hydrate();
  }, [isSupported, mosque_id]);

  // ── Subscribe ─────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!isSupported) { setStatus("unsupported"); return; }
    if (!mosque_id) {
      console.error("[push] mosque_id is missing");
      setErrorMsg("Masjid ID tidak ditemukan");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      console.error("[push] VAPID public key not configured");
      setStatus("error");
      setErrorMsg("VAPID key tidak dikonfigurasi");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("denied");
        setErrorMsg("Izin notifikasi ditolak");
        return;
      }
      if (permission !== "granted") {
        setStatus("idle");
        setErrorMsg("Izin notifikasi tidak diberikan");
        return;
      }

      // 2. Get SW registration
      const reg = await getRegistration();
      if (!reg) {
        console.error("[push] Service Worker not ready");
        setErrorMsg("Service Worker tidak aktif");
        setStatus("error");
        return;
      }

      // 3. Subscribe via PushManager
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      console.log("[push] PushManager subscribed, mosque_id:", mosque_id);

      // 4. Save to Supabase from browser (anon key, RLS allows insert)
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          mosque_id,
          endpoint: subJson.endpoint ?? "",
          p256dh: subJson.keys?.p256dh ?? "",
          auth: subJson.keys?.auth ?? "",
          user_agent: navigator.userAgent,
        },
        { onConflict: "mosque_id,endpoint" }
      );

      if (error) {
        console.error("[push] Supabase insert error:", error.message, error.code, error.details);
        setErrorMsg(`Database error: ${error.message}`);
        // Still unsubscribe from browser if DB fails
        try {
          await sub.unsubscribe();
        } catch (e) {
          console.error("[push] Failed to unsubscribe after DB error:", e);
        }
        setStatus("error");
        return;
      }

      // 5. Persist in localStorage
      localStorage.setItem(STORAGE_KEY, mosque_id);
      setStatus("subscribed");
      setErrorMsg("");
      console.log("[push] Subscribed successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[push] Subscribe error:", msg);
      setErrorMsg(`Error: ${msg}`);
      setStatus("error");
    }
  }, [isSupported, mosque_id]);

  // ── Unsubscribe ───────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!mosque_id) return;
    setStatus("loading");

    try {
      const reg = await getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Delete from Supabase first
          const { error } = await supabase
            .from("push_subscriptions")
            .delete()
            .eq("mosque_id", mosque_id)
            .eq("endpoint", sub.endpoint);

          if (error) {
            console.warn("[push] Failed to delete from DB:", error.message);
            // Still try to unsubscribe from browser even if DB fails
          }

          // Unsubscribe from PushManager
          try {
            await sub.unsubscribe();
          } catch (e) {
            console.error("[push] PushManager unsubscribe error:", e);
          }
        }
      }

      localStorage.removeItem(STORAGE_KEY);
      setStatus("idle");
      setErrorMsg("");
    } catch (err) {
      console.error("[push] Unsubscribe error:", err);
      setStatus("error");
      setErrorMsg("Gagal menonaktifkan notifikasi");
    }
  }, [mosque_id]);

  return {
    isSupported,
    isSubscribed: status === "subscribed",
    isLoading: status === "loading",
    isDenied: status === "denied",
    isHydrated: hydrated,
    status,
    errorMsg,
    subscribe,
    unsubscribe,
  };
}
