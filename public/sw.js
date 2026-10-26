// Brnsic PWA Service Worker v2.7
// Provides offline caching and background media support

const CACHE_NAME = "brnsic-cache-v2.7";
const STATIC_ASSETS = [
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
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Service worker precache warning:", err);
      });
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
  // Pass non-GET and API or external requests directly to network
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
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match("/"));
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets (images, fonts, bundles)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (event.request.url.endsWith(".png") ||
              event.request.url.endsWith(".jpg") ||
              event.request.url.endsWith(".woff") ||
              event.request.url.endsWith(".woff2") ||
              event.request.url.includes("_next/static"))
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
