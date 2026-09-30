// Built-in species smoke check, including devices with old drawings saved.
// Exercises actual growth in every zone and inspects the renderer's species choice.
//   node tools/browser-check.mjs [screenshot-folder]
// Needs Playwright with Chromium; PLAYWRIGHT_MODULE can point to an installed copy.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { KINDS, ZONE_IDS, ZONES, formKind } from "../src/zones.js";
import { SPECIES } from "../src/species.js";
import { FORMS, goalFor } from "../src/rules.js";

let playwright;
try {
  playwright = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch (error) {
  console.error(`browser-check FAILED: cannot load Playwright (${error.message}).`);
  console.error("Install it (npm i --no-save playwright && npx playwright install chromium) or set PLAYWRIGHT_MODULE.");
  process.exit(2);
}
const { chromium } = playwright;

const root = new URL("..", import.meta.url).pathname;
const shots = process.argv[2] || join(tmpdir(), "little-fish-check");
mkdirSync(shots, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
const base = "http://fish-game.test/";

const oldDrawing = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const browser = await chromium.launch({ args: ["--mute-audio"] });
let passed = 0;
try {
  for (const [label, width, height, touch, mode] of [
    ["desktop", 1280, 800, false, "off"], ["phone", 844, 390, true, "on"],
    ["short-phone", 568, 320, true, "off"], ["short-laptop", 1280, 600, false, "on"]
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: touch,
      hasTouch: touch, deviceScaleFactor: 1, serviceWorkers: "block" });
    try {
      await context.addInitScript(({ drawing, known, mode }) => {
        localStorage.setItem("little-fish-drawings", JSON.stringify([drawing, drawing]));
        localStorage.setItem("little-fish-plain-v1", mode);
        localStorage.setItem("little-fish-met-v1", JSON.stringify(known));
        localStorage.setItem("little-fish-voice-v1", "off");
        window.__paintedKind = null;
      }, { drawing: oldDrawing, known: KINDS, mode });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      // Serve static files directly through interception; no listening port is needed.
      // The state/renderer hooks exist only in test responses, never in shipped files.
      await page.route(`${base}**`, async route => {
        const path = normalize(decodeURIComponent(new URL(route.request().url()).pathname)).replace(/^\/+/, "") || "index.html";
        const file = join(root, path);
        if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) return route.fulfill({ status: 404 });
        let body = readFileSync(file);
        if (path === "src/main.js") body = Buffer.from(`${body}\nwindow.__game = { world, input };\n`);
        if (path === "src/animal-paint.js") body = Buffer.from(body.toString().replace(
          'export function paintAnimal(context, kind, x, y, size, direction, time, role, extra = {}) {',
          'export function paintAnimal(context, kind, x, y, size, direction, time, role, extra = {}) { if (role === "player") window.__paintedKind = kind;'));
        await route.fulfill({ status: 200, contentType: types[extname(file)] || "application/octet-stream", body });
      });
      const tap = selector => touch ? page.locator(selector).tap() : page.locator(selector).click();
      const fits = selector => page.locator(selector).evaluate(node => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
      });
      const ready = () => page.waitForFunction(() => window.__game && !document.querySelector("#intro").hidden);
      await page.goto(base);
      await ready();
      assert.equal(await page.locator("#draw, #draw-button, #plain-button, #sketch, #intro-art, #stage-art, #won-art").count(), 0);
      for (const selector of ["#intro h1", "#start-button", "#level-big", "#intro-book-button", ...ZONE_IDS.map(id => `[data-zone="${id}"]`)]) {
        assert.ok(await fits(selector), `${label}: ${selector} fits`);
      }
      await page.screenshot({ path: join(shots, `${label}-start.png`) });
      if (label.startsWith("short-")) {
        assert.deepEqual(errors, []);
        console.log(`PASS ${label}: start screen fits, drawing controls absent`);
        passed++;
        continue;
      }
      for (const id of ZONE_IDS) {
        await tap(`[data-zone="${id}"]`);
        await tap("#start-button");
        await page.waitForFunction(() => window.__game.world.phase === "playing");
        await page.evaluate(() => {
          const w = window.__game.world;
          w.nextCardAt = Infinity;
          w.invulnerable = 999;
        });
        for (let stage = 0; stage < FORMS.length; stage++) {
          const kind = formKind(ZONES[id], stage);
          await page.waitForFunction(expected => window.__paintedKind === expected, kind);
          const name = SPECIES[kind].name;
          assert.equal(await page.locator("#stage-name").textContent(), stage ? name : `Little ${name.toLowerCase()}`);
          assert.equal(await page.evaluate(() => window.__game.world.creatures.every(c => c.art == null)), true);
          await page.screenshot({ path: join(shots, `${label}-${id}-${stage}-${kind}.png`) });
          if (stage === FORMS.length - 1) break;
          await page.evaluate(bites => {
            const w = window.__game.world;
            w.bites = bites;
            w.friends = [];
            w.creatures = [{ ...w.player, tier: w.stage, direction: 1, wobble: 0 }];
            window.__paintedKind = null;
          }, goalFor("little", stage) - 1);
          await page.waitForFunction(next => window.__game.world.stage === next, stage + 1);
          if (stage === FORMS.length - 2) {
            await page.waitForFunction(() => window.__game.world.phase === "mission");
            await tap("#mission-go");
          }
        }
        // Exercise steering with real input after growth, before returning Home.
        const startX = await page.evaluate(() => window.__game.world.player.x);
        if (touch) {
          const r = await page.locator("#pad").boundingBox();
          const controls = await context.newCDPSession(page);
          await controls.send("Input.dispatchTouchEvent", { type: "touchStart",
            touchPoints: [{ x: r.x + r.width * 0.85, y: r.y + r.height / 2 }] });
          await page.waitForFunction(x => window.__game.world.player.x > x + 5, startX);
          await controls.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
          await controls.detach();
        } else {
          await page.keyboard.down("ArrowRight");
          await page.waitForFunction(x => window.__game.world.player.x > x + 5, startX);
          await page.keyboard.up("ArrowRight");
        }
        await tap("#pause-button");
        await tap("#paused-home-button");
        await ready();
        console.log(`PASS ${label}/${id}: five matching species through growth, NPC artwork, steering, Home`);
        passed++;
      }
      await page.reload();
      await ready();
      await tap("#start-button");
      await page.waitForFunction(kind => window.__paintedKind === kind, formKind(ZONES[ZONE_IDS.at(-1)], 0));
      assert.equal(await page.locator("#draw-button, #plain-button").count(), 0);
      assert.deepEqual(errors, [], `${label}: no browser errors`);
    } finally { await context.close(); }
  }
  console.log(`browser-check: ${passed} passed, 0 failed, 0 skipped; screenshots: ${shots}`);
} finally {
  await browser.close();
}
