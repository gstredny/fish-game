// Update check in a real browser: a phone that already has the game shows a new version on
// the first open after it goes live, not the second. Serves this folder as the "old" version,
// then a copy with a new cache name and a marked title as the "new" one.
//
//   node tools/browser-update.mjs
//
// Needs Playwright with Chromium (see tools/browser-check.mjs).
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { cpSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";

let playwright;
try {
  playwright = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch (error) {
  console.error(`browser-update FAILED: cannot load Playwright (${error.message}).`);
  process.exit(2);
}

const current = new URL("..", import.meta.url).pathname;
const next = mkdtempSync(join(tmpdir(), "little-fish-next-"));
for (const folder of ["src", "icons", "art", "voice"]) cpSync(join(current, folder), join(next, folder), { recursive: true });
for (const file of ["index.html", "style.css", "manifest.json", "sw.js"]) cpSync(join(current, file), join(next, file));
writeFileSync(join(next, "sw.js"), readFileSync(join(next, "sw.js"), "utf8").replace(/const CACHE = "[^"]+"/, 'const CACHE = "little-fish-next"'));
writeFileSync(join(next, "index.html"), readFileSync(join(next, "index.html"), "utf8").replace("<title>", "<title>NEXT "));

let root = current;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg" };
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, "http://x").pathname)).replace(/^\/+/, "") || "index.html";
  const file = join(root, path);
  try {
    if (!file.startsWith(root) || !statSync(file).isFile()) throw new Error("not found");
    // What GitHub Pages sends.
    response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "max-age=600" });
    response.end(readFileSync(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await playwright.chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  // The first visit installs the game for offline play.
  await page.goto(base);
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  assert.ok(!(await page.title()).startsWith("NEXT"));

  // A new version goes live; the child opens the game once.
  root = next;
  await page.goto(base);
  const updated = await page.waitForFunction(() => document.title.startsWith("NEXT"), null, { timeout: 20000 })
    .then(() => true, () => false);
  assert.ok(updated, "the first open after an update should show the new version");
  await context.close();

  console.log("browser-update passed: the first open after an update shows the new version.");

} finally {
  await browser.close();
  server.close();
  rmSync(next, { recursive: true, force: true });
}
