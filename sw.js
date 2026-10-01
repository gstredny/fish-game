const CACHE = "little-fish-v25";
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
  "./src/sound.js",
  "./src/reef.js",
  "./src/reef-save.js",
  "./src/reef-paint.js",
  "./src/animal-paint.js",
  "./src/species.js",
  "./src/photos.js",
  "./src/voice.js",
  "./src/ocean-book.js",
  "./src/players.js",
  "./src/levels.js",
  "./src/missions.js",
  "./src/lines.js",
  "./src/zones.js",
  "./src/species-reef.js",
  "./src/paint-reef-animals.js",
  "./src/species-deep.js",
  "./src/paint-deep-animals.js",
  "./src/species-bottom.js",
  "./src/paint-bottom-animals.js",
  "./art/ocean.webp",
  "./art/ocean-reef.webp",
  "./art/ocean-deep.webp",
  "./art/ocean-bottom.webp",
  "./art/animals/plankton.webp",
  "./art/animals/sardine.webp",
  "./art/animals/mackerel.webp",
  "./art/animals/squid.webp",
  "./art/animals/tuna.webp",
  "./art/animals/shark.webp",
  "./art/animals/seahorse.webp",
  "./art/animals/turtle.webp",
  "./art/animals/octopus.webp",
  "./art/animals/starfish.webp",
  "./art/animals/crab.webp",
  "./art/animals/parrotfish.webp",
  "./art/animals/clownfish.webp",
  "./art/animals/orca.webp",
  "./art/animals/dolphin.webp",
  "./art/animals/jellyfish.webp",
  "./art/animals/pufferfish.webp",
  "./art/animals/bluewhale.webp",
  "./art/animals/manta.webp",
  "./art/animals/lobster.webp",
  "./art/animals/urchin.webp",
  "./art/animals/hammerhead.webp",
  "./art/animals/whaleshark.webp",
  "./art/animals/narwhal.webp",
  "./art/animals/anglerfish.webp",
  "./art/animals/otter.webp",
  "./art/animals/penguin.webp",
  "./art/animals/flyingfish.webp",
  "./art/animals/manofwar.webp",
  "./art/animals/mantisshrimp.webp",
  "./art/animals/seacucumber.webp",
  "./art/animals/moray.webp",
  "./art/animals/horseshoecrab.webp",
  "./art/animals/damselfish.webp",
  "./art/animals/lionfish.webp",
  "./art/animals/grouper.webp",
  "./art/animals/reefshark.webp",
  "./art/animals/tigershark.webp",
  "./art/animals/coral.webp",
  "./art/animals/giantclam.webp",
  "./art/animals/marinesnow.webp",
  "./art/animals/deepshrimp.webp",
  "./art/animals/lanternfish.webp",
  "./art/animals/viperfish.webp",
  "./art/animals/giantsquid.webp",
  "./art/animals/spermwhale.webp",
  "./art/animals/hatchetfish.webp",
  "./art/animals/barreleye.webp",
  "./art/animals/vampiresquid.webp",
  "./art/animals/combjelly.webp",
  "./art/animals/oarfish.webp",
  "./art/animals/amphipod.webp",
  "./art/animals/snailfish.webp",
  "./art/animals/rattail.webp",
  "./art/animals/lizardfish.webp",
  "./art/animals/sleepershark.webp",
  "./art/animals/fangtooth.webp",
  "./art/animals/seapig.webp",
  "./art/animals/tripodfish.webp",
  "./art/animals/giantisopod.webp",
  "./art/animals/tubeworm.webp",
  "./art/animals/dumbooctopus.webp",
  "./voice/manifest.json",
  "./manifest.json",
  "./icons/fish.svg",
  "./icons/fish-192.png",
  "./icons/fish-512.png",
  "./icons/apple-touch-icon.png"
];

// The recorded voice clips are listed in voice/manifest.json, so they are cached from there, one by
// one: a clip that fails to download is spoken by the device's voice instead of stopping the update.
async function install() {
  const cache = await caches.open(CACHE);
  await cache.addAll(FILES.map(file => new Request(file, { cache: "reload" })));
  const manifest = await (await cache.match("./voice/manifest.json")).json();
  await Promise.allSettled(Object.values(manifest.clips).map(file => cache.add(new Request(`./voice/${file}`, { cache: "reload" }))));
}

self.addEventListener("install", event => {
  event.waitUntil(install());
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(respond(event.request));
});

async function respond(request) {
  const cached = await caches.match(request);
  if (!cached) return fetch(request);
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (!range) return cached;
  // Safari plays a saved voice clip only when asked-for bytes come back as a partial response.
  const body = await cached.arrayBuffer();
  const last = body.byteLength - 1;
  const from = range[1] ? Number(range[1]) : Math.max(0, last + 1 - Number(range[2]));
  const to = range[1] && range[2] ? Math.min(Number(range[2]), last) : last;
  if (!(range[1] || range[2]) || from > to) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${body.byteLength}` } });
  }
  return new Response(body.slice(from, to + 1), { status: 206, headers: {
    "Content-Type": cached.headers.get("Content-Type") ?? "audio/mpeg",
    "Content-Range": `bytes ${from}-${to}/${body.byteLength}`,
    "Content-Length": String(to - from + 1),
    "Accept-Ranges": "bytes"
  } });
}
