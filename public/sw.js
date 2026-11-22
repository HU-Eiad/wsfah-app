// WSFA service worker.
// Privacy rule: only public, immutable static assets are cached. API responses and
// HTML pages (which can contain signed-in user data) are never stored, so nothing
// can leak between users sharing a device. Navigations are network-first with the
// pre-cached /offline page as the fallback.
const CACHE_NAME = "wsfa-v3";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/brand/wsfa-mark.svg", "/brand/banners/empty-state.svg"];

// Same-origin paths that are safe to serve cache-first (public, versioned or static).
const STATIC_PREFIXES = ["/_next/static/", "/brand/", "/icons/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          // credentials: "omit" so the offline page is the anonymous version.
          fetch(url, { credentials: "omit" })
            .then((res) => (res.ok && !res.redirected ? cache.put(url, res) : undefined))
            .catch(() => undefined)
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate: drop every older cache (earlier versions may hold pages or API data).
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch API calls or auth endpoints: always straight to the network.
  if (url.pathname.startsWith("/api/")) return;

  // Pages: network-first, never cached; offline page when the network is down.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) => cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
        )
      )
    );
    return;
  }

  // Static assets: cache-first.
  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok && response.type === "basic") {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
  }
  // Everything else: default browser behaviour (network, HTTP cache).
});
