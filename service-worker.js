importScripts("./previous-results.js");

const CACHE_NAME = "wild-creek-field-survey-pwa-v19";
const previousResults = self.PREVIOUS_RESULTS_DATA || { basePath: "./previous-results/", records: {} };

function previousResultImageUrl(page) {
  if (!page || !page.image) return "";
  if (/^(https?:)?\/\//.test(page.image) || page.image.startsWith("./") || page.image.startsWith("/")) {
    return page.image;
  }
  return `${previousResults.basePath || "./previous-results/"}${page.image}`;
}

const PREVIOUS_RESULT_ASSETS = Object.values(previousResults.records || {})
  .flatMap((record) => record.pages || [])
  .map(previousResultImageUrl)
  .filter((url) => url && !/^(https?:)?\/\//.test(url));

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./app.js?v=19",
  "./data.js",
  "./previous-results.js",
  "./previous-results.js?v=18",
  "./manifest.json",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => Promise.all(PREVIOUS_RESULT_ASSETS.map((asset) => cache.add(asset).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
