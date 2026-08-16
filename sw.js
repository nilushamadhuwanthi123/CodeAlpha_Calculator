/* ==========================================================================
   NEXORA — Service Worker
   Caches the application shell so the calculator keeps working offline.
   ========================================================================== */
const CACHE_NAME = "nexora-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./js/vendor/math.js",
  "./js/vendor/lucide.js",
  "./js/storage.js",
  "./js/state.js",
  "./js/utils.js",
  "./js/toast.js",
  "./js/theme.js",
  "./js/onboarding.js",
  "./js/calculator.js",
  "./js/scientific.js",
  "./js/graphing.js",
  "./js/equations.js",
  "./js/matrix.js",
  "./js/statistics.js",
  "./js/converters.js",
  "./js/finance.js",
  "./js/formulas.js",
  "./js/study.js",
  "./js/assistant.js",
  "./js/history.js",
  "./js/dashboard.js",
  "./js/settings.js",
  "./js/commandcenter.js",
  "./js/router.js",
  "./js/app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
