const CACHE = "little-fish-v10";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./src/main.js",
  "./src/world.js",
  "./src/rules.js",
  "./src/paint.js",
  "./src/steering.js",
  "./src/camera.js",
  "./src/pad.js",
  "./src/art.js",
  "./src/gallery.js",
  "./src/sketchpad.js",
  "./src/sound.js",
  "./src/reef.js",
  "./src/reef-save.js",
  "./src/reef-paint.js",
  "./art/ocean.webp",
  "./manifest.json",
  "./icons/fish.svg",
  "./icons/fish-192.png",
  "./icons/fish-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(file, { cache: "reload" })))));
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
