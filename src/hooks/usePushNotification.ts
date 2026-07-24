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
 *
 * Fix log:
 * - mosque_id null race-condition: subscribe/unsubscribe now read mosque_id
 *   from a ref that is always in sync, so stale closures can no longer
 *   silently abort the flow.
 * - Notification.requestPermission() returning "default" (user dismissed
 *   without answering) is now surfaced as a distinct branch with a
 *   retry-friendly path back to "idle".
 * - iOS Safari: PushManager / applicationServerKey subscribe errors are
 *   caught and reported instead of silently failing.
 * - hydration: check existing subscription via PushManager (most reliable),
 *   fallback to localStorage for cache invalidation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  || "BIE1ipi2UxbLc2G9JRgIu4JqtPY10iyBikgVj2Gox_miNRxVR6iu3Z8Unq6Y65SZAl7Z4gd7QHfG6oRTPpX6PmY";
const STORAGE_KEY = "push_subscribed_mosque";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  // Sanitasi: trim whitespace, newlines, null bytes yang mungkin masuk dari env
  const cleaned = base64String.trim().replace(/[\n\r\0]/g, "");
  
  // Tambahkan padding base64 jika perlu
  const padding = "=".repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding).replace(/-/g, "+").replace(/_/g, "/");
  
  try {
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
      bytes[i] = rawData.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    // Jika atob gagal, log error dan throw kembali dengan pesan yang lebih jelas
    console.error("[push] urlBase64ToUint8Array failed:", err);
    console.error("[push] Key length:", cleaned.length, "Key sample:", cleaned.substring(0, 20) + "...");
    throw new Error("VAPID key tidak valid atau rusak. Hubungi admin.");
  }
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    // Try getRegistration first — faster and doesn't hang
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) return existing;

    // If no registration found, register fresh
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    // Wait briefly for it to activate
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    return reg;
  } catch {
    return null;
  }
}

export type PushStatus =
  | "idle"
  | "loading"
  | "subscribed"
  | "denied"
  | "error"
  | "unsupported";

export function usePushNotification(mosque_id: string | null | undefined) {
  const [status, setStatus] = useState<PushStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  // Keep a ref always in sync so subscribe/unsubscribe callbacks never
  // capture a stale closure value of mosque_id.
  const mosque_id_ref = useRef(mosque_id);
  useEffect(() => {
    mosque_id_ref.current = mosque_id;
  }, [mosque_id]);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // ── Hydrate from PushManager (most reliable) ──────────────────────────
  useEffect(() => {
    if (!isSupported || !mosque_id) return;

    const hydrate = async () => {
      try {
        if (Notification.permission === "denied") {
          setStatus("denied");
          setHydrated(true);
          return;
        }

        const reg = await getRegistration();
        if (!reg) {
          console.warn("[push] Service Worker not ready during hydration");
          setHydrated(true);
          return;
        }

        // Check PushManager directly — most reliable source of truth
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          console.log("[push] Found existing subscription in PushManager");
          setStatus("subscribed");
          // Keep localStorage in sync
          localStorage.setItem(STORAGE_KEY, mosque_id);
          setHydrated(true);
          return;
        }

        // No active subscription — clear stale localStorage
        localStorage.removeItem(STORAGE_KEY);
        setStatus("idle");
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
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }

    // Always read from ref so we never use a stale closure value.
    const id = mosque_id_ref.current;
    if (!id) {
      console.error("[push] mosque_id is missing — cannot subscribe");
      setErrorMsg("Data masjid belum siap. Coba lagi sebentar.");
      setStatus("error");
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error("[push] VAPID public key not configured");
      setStatus("error");
      setErrorMsg("Konfigurasi server notifikasi belum lengkap.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    // 1. Request permission — on mobile the dialog may not appear if already
    //    dismissed before. Safari on iOS requires a user-gesture context.
    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch (err) {
      // Some browsers (old Safari) throw if called outside a user gesture.
      console.error("[push] requestPermission threw:", err);
      setErrorMsg("Izin notifikasi gagal. Pastikan Anda menekan tombol ini secara langsung.");
      setStatus("error");
      return;
    }

    if (permission === "denied") {
      setStatus("denied");
      setErrorMsg("Izin notifikasi ditolak");
      return;
    }

    if (permission !== "granted") {
      // User dismissed the prompt without choosing — stay idle so they can retry.
      console.warn("[push] Permission not granted (dismissed or default):", permission);
      setErrorMsg("Izin notifikasi belum diberikan. Ketuk tombol lagi dan pilih 'Izinkan'.");
      setStatus("idle");
      return;
    }

    // 2. Get SW registration
    const reg = await getRegistration();
    if (!reg) {
      console.error("[push] Service Worker not ready");
      setErrorMsg("Service Worker tidak aktif. Muat ulang halaman dan coba lagi.");
      setStatus("error");
      return;
    }

    try {
      // 3. Subscribe via PushManager
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      console.log("[push] PushManager subscribed, mosque_id:", id);

      // 4. Save directly to Supabase from browser (anon key, RLS allows insert)
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          mosque_id: id,
          endpoint: subJson.endpoint ?? "",
          p256dh: subJson.keys?.p256dh ?? "",
          auth: subJson.keys?.auth ?? "",
          user_agent: navigator.userAgent,
        },
        { onConflict: "mosque_id,endpoint" }
      );

      if (error) {
        console.error("[push] Supabase insert error:", error.message, error.code, error.details);
        setErrorMsg(`Gagal menyimpan: ${error.message} (${error.code})`);
        try {
          await sub.unsubscribe();
        } catch (e) {
          console.error("[push] Failed to unsubscribe after DB error:", e);
        }
        setStatus("error");
        return;
      }

      // 5. Persist and update state
      localStorage.setItem(STORAGE_KEY, id);
      setStatus("subscribed");
      setErrorMsg("");
      console.log("[push] Subscribed successfully for mosque_id:", id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[push] Subscribe error:", msg);
      setErrorMsg(`Error: ${msg}`);
      setStatus("error");
    }
  }, [isSupported]); // mosque_id intentionally omitted — read from ref

  // ── Unsubscribe ───────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    const id = mosque_id_ref.current;
    if (!id) return;

    setStatus("loading");

    try {
      const reg = await getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const { error } = await supabase
            .from("push_subscriptions")
            .delete()
            .eq("mosque_id", id)
            .eq("endpoint", sub.endpoint);

          if (error) {
            console.warn("[push] Failed to delete from DB:", error.message);
            // Still try to unsubscribe from browser even if DB fails
          }

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
  }, []); // mosque_id intentionally omitted — read from ref

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
