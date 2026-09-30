// Checks the recorded voice in a real browser: tapping Dive in plays the sardine line's clip, not the
// device's voice, and once the offline cache is in, the clip still plays with the network switched off
// (the service worker answers the browser's range requests).
// Then, for both levels, it acts like an iPhone that refuses the audio element outside a tap: lines
// said later (growing up) must still be heard as the recording, through Web Audio, and the device's
// robot voice must stay quiet. Little swimmer starts with Dive in as the very first tap; Big swimmer
// taps its level button first.
//
// With the local server running (python3 -m http.server 8778):
//   node tools/browser-voice.mjs          (PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs if global)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { goalFor } from "../src/rules.js";
import { growLine, KINDS } from "../src/species.js";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const { clips } = JSON.parse(readFileSync(new URL("../voice/manifest.json", import.meta.url)));

const browser = await chromium.launch({ args: ["--autoplay-policy=user-gesture-required"] });
const listen = strict => {
  window.__robot = [];
  window.__played = [];
  window.__webAudio = [];
  if (window.speechSynthesis) speechSynthesis.speak = line => { if (line.text.trim()) window.__robot.push(line.text); };
  const Real = window.Audio;
  window.Audio = function (...args) {
    const audio = new Real(...args);
    window.__audio = audio;
    audio.addEventListener("playing", () => { if (audio.src.includes("/voice/")) window.__played.push(audio.src.split("/voice/").pop()); });
    return audio;
  };
  // Stricter than an iPhone: the audio element plays only while a tap is being handled.
  if (strict) {
    let tapping = false;
    for (const type of ["pointerdown", "pointerup", "touchend", "click", "keydown"]) {
      window.addEventListener(type, () => { tapping = true; setTimeout(() => { tapping = false; }); }, true);
    }
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!tapping) return Promise.reject(new DOMException("refused", "NotAllowedError"));
      return play.call(this);
    };
  }
  const decode = AudioContext.prototype.decodeAudioData;
  AudioContext.prototype.decodeAudioData = function (bytes, ...rest) {
    window.__decoding = bytes.byteLength;
    return decode.call(this, bytes, ...rest);
  };
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...args) {
    if (this.buffer?.duration > 0.5) window.__webAudio.push(Math.round(this.buffer.duration * 10) / 10);
    return start.apply(this, args);
  };
};
const errors = [];

try {
  {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
    await context.addInitScript(listen, false);
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    const heard = file => page.waitForFunction(file => window.__played.includes(file), file, { timeout: 8000 });
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
    await context.close();
  }

  for (const level of ["little", "big"]) {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
    await context.addInitScript(listen, true);
    // Every animal counts as met, so no fact card opens (tools/browser-learn.mjs checks those).
    await context.addInitScript(kinds => localStorage.setItem("little-fish-met-v1", JSON.stringify(kinds)), KINDS);
    // The only test-time change: main.js also hands `world` to the page.
    await context.route("**/src/main.js", async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: `${await response.text()}\nwindow.__game = { world };\n` });
    });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(GAME);
    await page.waitForSelector("#start-button");
    await page.waitForTimeout(500);
    if (level === "big") await page.click("#level-big");
    await page.click("#start-button");
    await page.waitForFunction(() => window.__played.length > 0, null, { timeout: 8000 });
    assert.deepEqual(await page.evaluate(() => window.__played), [clips[growLine(0)]], `${level}: Dive in plays the clip inside the tap`);
    // Grow up with no tap: the line is said from the game loop, which this "iPhone" refuses.
    await page.evaluate(goal => {
      const { world } = window.__game;
      world.invulnerable = 99;
      world.bites = goal - 1;
      world.creatures = [{ x: world.player.x + 5, y: world.player.y, tier: 0, direction: 1, wobble: 0 }];
    }, goalFor(level, 0));
    await page.waitForFunction(() => window.__webAudio.length > 0, null, { timeout: 8000 });
    const decoded = await page.evaluate(() => window.__decoding);
    const file = readFileSync(new URL(`../voice/${clips[growLine(1)]}`, import.meta.url));
    assert.equal(decoded, file.byteLength, `${level}: Web Audio played the mackerel line's own recording`);
    assert.deepEqual(await page.evaluate(() => window.__robot), [], `${level}: the robot voice stays quiet`);
    console.log(`${level}: refused outside a tap, "${growLine(1)}" played through Web Audio (${await page.evaluate(() => window.__webAudio[0])} s)`);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log("browser-voice: PASS");
} finally {
  await browser.close();
}
