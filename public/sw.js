// Brnsic PWA Service Worker v4.1 (Instant Live OTA Updates & Bulletproof Offline Fallback)
// Provides offline media fallback, prevents TypeError Response conversion, and instant asset cache invalidation

const CACHE_NAME = "brnsic-cache-v4.1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/app-icon.png",
  "/splash-logo.png",
  "/brnsic-loader-logo.png",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("Service worker precache item skipped:", url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass non-GET and API or external audio streaming requests directly to network
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("youtube.com") ||
    event.request.url.includes("googlevideo.com") ||
    event.request.url.includes("ytimg.com")
  ) {
    return;
  }

  // Network-First for HTML navigation so updates in installed APK/PWA are INSTANT!
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const rootCached = await caches.match("/");
          if (rootCached) return rootCached;
          const indexCached = await caches.match("/index.html");
          if (indexCached) return indexCached;
          return new Response(
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Brnsic Offline</title></head><body style='background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;'><div style='text-align:center;'><h2>Koneksi Internet Terputus</h2><p style='color:#888;'>Sambungkan kembali ke internet untuk memuat Brnsic.</p></div></body></html>",
            {
              headers: { "Content-Type": "text/html; charset=utf-8" },
              status: 200
            }
          );
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets (images, fonts, bundles)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cached immediately; update in background if online
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          })
          .catch(() => {});
        return cached;
      }

      // Not cached yet: fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (event.request.url.endsWith(".png") ||
              event.request.url.endsWith(".jpg") ||
              event.request.url.endsWith(".jpeg") ||
              event.request.url.endsWith(".webp") ||
              event.request.url.endsWith(".svg") ||
              event.request.url.endsWith(".woff") ||
              event.request.url.endsWith(".woff2") ||
              event.request.url.includes("_next/static") ||
              event.request.url.includes("manifest.json"))
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Guaranteed to return a valid Response object to prevent "TypeError: Failed to convert value to 'Response'"
          return new Response("", { status: 408, statusText: "Offline" });
        });
    })
  );
});
