"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

const STORAGE_KEY = "smartmasjid-pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type InstallMode = "android" | "ios" | null;

function getInstallMode(): InstallMode {
  if (typeof window === "undefined") return null;
  // Already installed as PWA
  if (window.matchMedia("(display-mode: standalone)").matches) return null;
  if ((window.navigator as any).standalone === true) return null;

  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  if (isIOS) return "ios";

  // Android / Chrome — check for beforeinstallprompt handled externally
  return "android";
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function saveDismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors
  }
}

/**
 * PWA install prompt bottom sheet.
 * - Android: listens for `beforeinstallprompt`, shows native prompt on tap.
 * - iOS: shows Safari share instruction (iOS doesn't support beforeinstallprompt).
 * - Never shown again for 7 days after dismiss.
 */
export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<InstallMode>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isDismissed()) return;

    const installMode = getInstallMode();
    if (!installMode) return;

    if (installMode === "android") {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setMode("android");
        setTimeout(() => setShow(true), 3000); // delay so page loads first
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }

    if (installMode === "ios") {
      setMode("ios");
      setTimeout(() => setShow(true), 3000);
    }
  }, []);

  // Slide-in on mount
  useEffect(() => {
    if (show) {
      requestAnimationFrame(() => setAnimating(true));
    }
  }, [show]);

  const dismiss = () => {
    setAnimating(false);
    saveDismiss();
    setTimeout(() => setShow(false), 350);
  };

  const handleInstall = async () => {
    if (mode === "android" && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        saveDismiss();
      }
      setDeferredPrompt(null);
      setAnimating(false);
      setTimeout(() => setShow(false), 350);
    }
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[998] bg-black/40 transition-opacity duration-300 ${
          animating ? "opacity-100" : "opacity-0"
        }`}
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[999]
          bg-white rounded-t-3xl shadow-2xl
          transition-transform duration-350 ease-out
          ${animating ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Install SmartMasjid"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 transition-colors"
          aria-label="Tutup"
        >
          <X size={15} strokeWidth={2.5} className="text-slate-500" />
        </button>

        <div className="px-6 pt-2 pb-6">
          {/* App icon + title */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
              <span className="text-2xl">🕌</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Install SmartMasjid Mobile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Akses lebih cepat langsung dari Home Screen
              </p>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex gap-2 flex-wrap mb-5">
            {["⚡ Akses cepat", "📴 Bisa offline", "🔔 Notifikasi"].map((f) => (
              <span
                key={f}
                className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100"
              >
                {f}
              </span>
            ))}
          </div>

          {mode === "android" && (
            <>
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 active:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-200"
              >
                <Download size={18} strokeWidth={2.5} />
                Install Sekarang
              </button>
              <button
                onClick={dismiss}
                className="w-full mt-3 text-slate-400 text-sm font-semibold py-2 active:text-slate-600 transition-colors"
              >
                Nanti saja
              </button>
            </>
          )}

          {mode === "ios" && (
            <>
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                <div className="flex items-start gap-3">
                  <Share size={18} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Cara install di iPhone:</p>
                    <ol className="text-xs text-slate-500 mt-1.5 space-y-1 list-decimal list-inside">
                      <li>Tap tombol Share di Safari</li>
                      <li>Pilih &quot;Add to Home Screen&quot;</li>
                      <li>Tap &quot;Add&quot;</li>
                    </ol>
                  </div>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="w-full bg-slate-100 active:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-colors"
              >
                Mengerti
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
