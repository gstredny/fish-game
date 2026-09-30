import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import vm from "node:vm";
import { allLines } from "../src/lines.js";

const folder = new URL("../voice/", import.meta.url);

// Fails, rather than skips, when the recordings are missing: run tools/make-voice.py (see README).
test("every line the game can say has a recording, and every recording is still used", () => {
  assert.ok(existsSync(new URL("manifest.json", folder)), "voice/manifest.json is missing: record the voice (README)");
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", folder), "utf8"));
  const lines = allLines();
  for (const line of lines) {
    assert.ok(manifest.clips[line], `no recording for: ${line}`);
    assert.ok(existsSync(new URL(manifest.clips[line], folder)), `voice/${manifest.clips[line]} is missing`);
  }
  assert.deepEqual(Object.keys(manifest.clips).sort(), [...lines].sort(), "recordings for lines the game no longer says");
  const files = readdirSync(folder).filter(file => file.endsWith(".mp3"));
  assert.deepEqual(files.sort(), Object.values(manifest.clips).sort(), "voice/ holds only the clips in the manifest");
});

// Runs sw.js with fake caches, the way a browser would. `saved` makes a fresh response per path.
async function worker(saved) {
  const listeners = {};
  const cache = { addAll: async requests => { cache.added.push(...requests.map(request => request.url)); }, added: [],
    match: async url => saved[String(url).replace(/^\.\//, "")]?.() };
  const context = { self: { addEventListener: (type, listener) => { listeners[type] = listener; }, skipWaiting() {},
    location: { origin: "https://fish.example" } },
  caches: { open: async () => cache, match: async request => saved[new URL(request.url).pathname.slice(1)]?.() ?? null },
  Request: class { constructor(url) { this.url = url; } }, Response, URL, fetch: async () => new Response("network") };
  vm.runInNewContext(readFileSync(new URL("../sw.js", import.meta.url), "utf8"), context);
  return { listeners, cache };
}

test("installing the offline game saves every recording in the manifest", async () => {
  const manifest = () => new Response(JSON.stringify({ clips: { "Hi!": "a1.mp3", "Bye!": "b2.mp3" } }));
  const { listeners, cache } = await worker({ "voice/manifest.json": manifest });
  let done;
  listeners.install({ waitUntil: promise => { done = promise; } });
  await done;
  assert.ok(cache.added.includes("./voice/a1.mp3") && cache.added.includes("./voice/b2.mp3"));
  assert.ok(cache.added.includes("./voice/manifest.json"));
});

test("a saved recording is served in pieces when Safari asks for a range", async () => {
  const bytes = new Uint8Array(100).map((_, index) => index);
  const { listeners } = await worker({ "voice/a1.mp3": () => new Response(bytes, { headers: { "Content-Type": "audio/mpeg" } }) });
  const ask = async range => {
    let reply;
    const headers = new Headers(range ? { range } : {});
    listeners.fetch({ request: { method: "GET", url: "https://fish.example/voice/a1.mp3", headers },
      respondWith: promise => { reply = promise; } });
    return reply;
  };
  const probe = await ask("bytes=0-1");
  assert.equal(probe.status, 206);
  assert.equal(probe.headers.get("Content-Range"), "bytes 0-1/100");
  assert.deepEqual([...new Uint8Array(await probe.arrayBuffer())], [0, 1]);
  const rest = await ask("bytes=10-");
  assert.equal(rest.headers.get("Content-Range"), "bytes 10-99/100");
  assert.equal((await rest.arrayBuffer()).byteLength, 90);
  const tail = await ask("bytes=-5");
  assert.deepEqual([...new Uint8Array(await tail.arrayBuffer())], [95, 96, 97, 98, 99]);
  let reply;
  listeners.fetch({ request: { method: "GET", url: "https://fish.example/voice/a1.mp3", headers: new Headers() },
    respondWith: promise => { reply = promise; } });
  assert.equal((await reply).status, 200, "without a range, the whole saved file");
});
