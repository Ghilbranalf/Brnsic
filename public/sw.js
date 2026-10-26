// Brnsic PWA Service Worker v2.4
// Provides offline caching and background media support

const CACHE_NAME = "brnsic-cache-v2.4";
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

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache static image and font assets dynamically
        if (
          response &&
          response.status === 200 &&
          (event.request.url.endsWith(".png") ||
            event.request.url.endsWith(".jpg") ||
            event.request.url.endsWith(".woff") ||
            event.request.url.endsWith(".woff2"))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback for offline navigation
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
