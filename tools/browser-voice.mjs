// Checks the recorded voice in a real browser: tapping Dive in plays the sardine line's clip, not the
// device's voice, and once the offline cache is in, the clip still plays with the network switched off
// (the service worker answers the browser's range requests).
//
// With the local server running (python3 -m http.server 8778):
//   node tools/browser-voice.mjs          (PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs if global)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { growLine } from "../src/species.js";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const { clips } = JSON.parse(readFileSync(new URL("../voice/manifest.json", import.meta.url)));

const browser = await chromium.launch({ args: ["--autoplay-policy=user-gesture-required"] });
const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
await context.addInitScript(() => {
  window.__robot = [];
  window.__played = [];
  if (window.speechSynthesis) speechSynthesis.speak = line => { if (line.text.trim()) window.__robot.push(line.text); };
  const Real = window.Audio;
  window.Audio = function (...args) {
    const audio = new Real(...args);
    window.__audio = audio;
    audio.addEventListener("playing", () => window.__played.push(audio.src.split("/voice/").pop()));
    return audio;
  };
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const heard = file => page.waitForFunction(file => window.__played.includes(file), file, { timeout: 8000 });

try {
  for (const online of [true, false]) {
    if (!online) {
      // The first visit's service worker must have saved every clip before the network goes away.
      await page.waitForFunction(async count => {
        const keys = await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).length));
        return (await navigator.serviceWorker.ready).active && keys.some(saved => saved >= count);
      }, Object.keys(clips).length, { timeout: 30000 });
      await context.setOffline(true);
      await page.evaluate(() => localStorage.clear());
    }
    await page.goto(GAME);
    await page.waitForSelector("#start-button");
    await page.waitForTimeout(500);
    await page.click("#start-button");
    await heard(clips[growLine(0)]);
    const label = online ? "online" : "offline";
    assert.deepEqual(await page.evaluate(() => window.__robot), [], `${label}: the device voice stays quiet`);
    assert.equal(await page.evaluate(() => window.__audio.error), null, `${label}: the clip decoded`);
    console.log(`${label}: Dive in played ${clips[growLine(0)]} (${growLine(0)})`);
  }
  assert.deepEqual(errors, []);
  console.log("browser-voice: PASS");
} finally {
  await browser.close();
}
