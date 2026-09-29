const CACHE = "little-fish-v4";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./src/main.js",
  "./src/world.js",
  "./src/rules.js",
  "./src/paint.js",
  "./src/steering.js",
  "./src/reef.js",
  "./src/reef-save.js",
  "./src/reef-paint.js",
  "./manifest.json",
  "./icons/fish.svg",
  "./icons/fish-192.png",
  "./icons/fish-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
