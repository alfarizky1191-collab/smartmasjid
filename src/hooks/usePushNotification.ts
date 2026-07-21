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

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  // ── Hydrate from localStorage ─────────────────────────────────────────
  useEffect(() => {
    if (!isSupported || !mosque_id) return;

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === mosque_id) {
      getRegistration().then(async (reg) => {
        if (!reg) return;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setStatus("subscribed");
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setStatus("idle");
        }
      });
    }
  }, [isSupported, mosque_id]);

  // ── Subscribe ─────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!isSupported) { setStatus("unsupported"); return; }
    if (!mosque_id) {
      console.error("[push] mosque_id is missing");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      console.error("[push] VAPID public key not configured");
      setStatus("error");
      return;
    }

    setStatus("loading");

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission === "denied") { setStatus("denied"); return; }
    if (permission !== "granted") { setStatus("idle"); return; }

    // 2. Get SW registration
    const reg = await getRegistration();
    if (!reg) {
      console.error("[push] Service Worker not ready");
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
      console.log("[push] PushManager subscribed, mosque_id:", mosque_id);

      // 4. Save directly to Supabase from browser (anon key, RLS allows insert)
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          mosque_id,
          endpoint: subJson.endpoint,
          p256dh:   subJson.keys?.p256dh,
          auth:     subJson.keys?.auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: "mosque_id,endpoint" }
      );

      if (error) {
        console.error("[push] Supabase insert error:", error.message, error.code, error.details);
        await sub.unsubscribe();
        setStatus("error");
        return;
      }

      // 5. Persist
      localStorage.setItem(STORAGE_KEY, mosque_id);
      setStatus("subscribed");
      console.log("[push] Subscribed successfully");
    } catch (err) {
      console.error("[push] Subscribe error:", err);
      setStatus("error");
    }
  }, [isSupported, mosque_id]);

  // ── Unsubscribe ───────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!mosque_id) return;
    setStatus("loading");

    const reg = await getRegistration();
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("mosque_id", mosque_id)
          .eq("endpoint", sub.endpoint);

        await sub.unsubscribe().catch(() => {});
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setStatus("idle");
  }, [mosque_id]);

  return {
    isSupported,
    isSubscribed: status === "subscribed",
    isLoading:   status === "loading",
    isDenied:    status === "denied",
    status,
    subscribe,
    unsubscribe,
  };
}
