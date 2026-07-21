/**
 * SmartMasjid Mobile — Service Worker
 *
 * Strategy:
 * - Static assets (JS, CSS, fonts, icons): Cache-first
 * - API / Supabase requests:              Network-first, fallback to cache
 * - Aladhan prayer times API:             Network-first, fallback to cache
 * - Navigation (HTML pages):              Network-first, fallback to offline page
 *
 * Cache names are versioned so old caches are cleaned on SW update.
 */

const SW_VERSION = "v3";
const STATIC_CACHE  = `smartmasjid-static-${SW_VERSION}`;
const DYNAMIC_CACHE = `smartmasjid-dynamic-${SW_VERSION}`;
const API_CACHE     = `smartmasjid-api-${SW_VERSION}`;

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/app",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-maskable.svg",
  "/icons/apple-touch-icon.svg",
  "/offline",
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {
        // Silently fail — individual URLs may not exist yet
      })
    )
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // ── Aladhan prayer times API → Network-first, long cache ─────────────────
  if (url.hostname === "api.aladhan.com") {
    event.respondWith(networkFirst(request, API_CACHE, 60 * 60 * 24)); // 24h
    return;
  }

  // ── Supabase API → Network-first, short cache ─────────────────────────────
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(networkFirst(request, API_CACHE, 60 * 5)); // 5min
    return;
  }

  // ── Static assets (_next/static, icons, fonts) → Cache-first ─────────────
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Next.js page navigation → Network-first, offline fallback ─────────────
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match("/offline") || offlineFallback()
          )
        )
    );
    return;
  }

  // ── Everything else → Network-first ──────────────────────────────────────
  event.respondWith(networkFirst(request, DYNAMIC_CACHE, 60 * 60));
});

// ─── Background sync: refresh on reconnect ──────────────────────────────────
self.addEventListener("online", () => {
  self.clients.matchAll().then((clients) =>
    clients.forEach((client) =>
      client.postMessage({ type: "ONLINE" })
    )
  );
});

// ─── Push notifications ───────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }

  const title   = data.title   || "SmartMasjid";
  const body    = data.body    || "";
  const icon    = data.icon    || "/icons/icon-192.svg";
  const badge   = data.badge   || "/icons/icon-192.svg";
  const tag     = data.tag     || "smartmasjid-notification";
  const url     = data.url     || "/app";
  const renotify = data.renotify ?? true;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      renotify,
      requireInteraction: false,  // auto-dismiss after a while
      silent: false,              // play sound + vibrate
      data: { url },
      vibrate: [200, 100, 200],
    })
  );
});

// ─── Notification click handling ─────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback();
  }
}

async function networkFirst(request, cacheName, maxAgeSeconds = 300) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Check cache age if possible
      const dateHeader = cached.headers.get("date");
      if (dateHeader) {
        const age = (Date.now() - new Date(dateHeader).getTime()) / 1000;
        if (age < maxAgeSeconds) return cached;
      } else {
        return cached;
      }
    }
    return offlineFallback();
  }
}

function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>SmartMasjid — Offline</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#020617;color:#fff;font-family:system-ui,sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      min-height:100dvh;gap:16px;padding:24px;text-align:center}
    .icon{font-size:64px}
    h1{font-size:22px;font-weight:700;color:#34d399}
    p{font-size:14px;color:#94a3b8;line-height:1.6;max-width:300px}
    button{margin-top:12px;background:#059669;color:#fff;border:none;
      padding:12px 28px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer}
  </style>
</head>
<body>
  <div class="icon">📡</div>
  <h1>Anda sedang offline</h1>
  <p>Menampilkan data terakhir yang tersimpan.<br/>Koneksi internet tidak terdeteksi.</p>
  <button onclick="location.reload()">Coba Lagi</button>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
