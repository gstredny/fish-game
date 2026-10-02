// Port-free, muted Chromium smoke. No shipped debug hooks or wall-clock waits.
// node tools/browser-puffer.mjs [screenshot-folder]
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = new URL("..", import.meta.url).pathname;
const shots = process.argv[2] || join(tmpdir(), "little-fish-puffer");
mkdirSync(shots, { recursive: true });
const base = "http://fish-game.test/";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg" };
const browser = await chromium.launch({ args: ["--mute-audio"] });
let passed = 0;
try {
  for (const [label, width, height, touch] of [
    ["desktop", 1280, 800, false], ["phone", 844, 390, true], ["small-phone", 568, 320, true]
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch,
      isMobile: touch, deviceScaleFactor: 1, serviceWorkers: "block" });
    try {
      await context.addInitScript(() => localStorage.setItem("little-fish-voice-v1", "off"));
      const page = await context.newPage();
      const errors = [], assets = new Map();
      let offline = false;
      page.on("pageerror", error => errors.push(error.message));
      // Static interception replaces a server. Only previously fetched bytes can load offline.
      // This offline fixture exercises cached application assets; native SW lifecycle is covered
      // by the Node tests, because service worker requests cannot use this port-free page route.
      await page.route(`${base}**`, async route => {
        const path = normalize(decodeURIComponent(new URL(route.request().url()).pathname)).replace(/^\/+/, "") || "index.html";
        if (offline) {
          const saved = assets.get(path);
          if (!saved) return route.abort("internetdisconnected");
          return route.fulfill(saved);
        }
        const file = join(root, path);
        if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) return route.fulfill({ status: 404 });
        let body = readFileSync(file);
        if (path === "src/main.js") {
          // Drive the actual frame function deterministically while retaining real browser input.
          // Playwright's own animation frames are left untouched for actionability checks.
          body = Buffer.from(body.toString().replaceAll("requestAnimationFrame(frame);", "window.__nextFrame = frame;") +
            "\nwindow.__game = { world, input, puffer }; window.__clock = 0;" +
            "window.__step = count => { for (let n = 0; n < count; n++) window.__nextFrame(window.__clock += 50); };\n");
        }
        const saved = { status: 200, contentType: types[extname(file)] || "application/octet-stream", body };
        assets.set(path, saved);
        await route.fulfill(saved);
      });
      const step = count => page.evaluate(count => window.__step(count), count);
      const tap = selector => touch ? page.locator(selector).tap() : page.locator(selector).click();
      const phase = () => page.evaluate(() => window.__game.puffer.state.phase);
      const fits = selector => page.locator(selector).evaluate(node => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
      });
      const shot = name => page.screenshot({ path: join(shots, `${label}-${name}.png`) });
      const clear = () => page.evaluate(() => {
        const input = window.__game.input;
        return input.keys.size === 0 && input.pointer === null && input.pad === null;
      });
      const world = () => page.evaluate(() => JSON.stringify(window.__game.world));
      const saves = () => page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
      await page.goto(base);
      await page.waitForFunction(() => window.__game);
      await step(1);
      await tap("#start-button");
      await page.evaluate(() => {
        const world = window.__game.world;
        world.nextCardAt = 0;
        world.creatures = [];
        world.friends = [{ kind: "pufferfish", ...world.player, size: 35, direction: 1, speed: 0, wobble: 0 }];
      });
      await step(1);
      assert.equal(await page.locator("#card-be").isVisible(), false, `${label}: quiz has no adventure shortcut`);
      await tap('[data-pick="pufferfish"]');
      await tap("#card-close");
      assert.equal(await page.evaluate(() => window.__game.world.stage), 1);
      await tap("#pause-button");
      await tap("#paused-book-button");
      await tap('.book-zone:first-child [data-kind="pufferfish"]');
      await tap("#card-be");
      const preserved = await world(), saved = await saves();
      assert.equal(await phase(), "intro");
      assert.equal(await page.locator("#pad").isVisible(), false);
      assert.equal(await page.locator("#puffer-puff").isVisible(), false);
      for (const selector of ["#puffer-go", "#puffer-dialog-back"]) assert.ok(await fits(selector), `${label}: ${selector} fits intro`);
      await step(1);
      await shot("intro");
      await tap("#puffer-go");
      for (const selector of ["#puffer-back", "#puffer-pause", "#puffer-puff"]) assert.ok(await fits(selector));
      if (touch) assert.ok(await fits("#pad"));
      await page.keyboard.down("ArrowRight");
      for (let n = 0; n < 800 && await phase() === "playing"; n++) await step(1);
      await page.keyboard.up("ArrowRight");
      assert.equal(await phase(), "retry", `${label}: a bump gives retry`);
      assert.ok(await clear());
      await shot("retry");
      await tap("#puffer-go");

      const cdp = touch ? await context.newCDPSession(page) : null;
      const padBox = touch ? await page.locator("#pad").boundingBox() : null;
      const first = touch ? { id: 1, x: padBox.x + padBox.width * 0.85, y: padBox.y + padBox.height / 2 } : null;
      if (touch) await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first] });
      else await page.keyboard.down("ArrowRight");
      for (let n = 0; n < 400; n++) {
        const ready = await page.evaluate(() => {
          const s = window.__game.puffer.state;
          return s.warned && Math.hypot(s.player.x - s.hunter.x, s.player.y - s.hunter.y) < 145;
        });
        if (ready) break;
        await step(1);
      }
      if (touch) {
        const puffBox = await page.locator("#puffer-puff").boundingBox();
        const second = { id: 2, x: puffBox.x + puffBox.width / 2, y: puffBox.y + puffBox.height / 2 };
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [first, second] });
        assert.ok(await page.evaluate(() => window.__game.puffer.state.puffLeft > 0), "second thumb puffs before lifting");
        assert.equal(await page.evaluate(() => window.__game.input.pad?.x), 1, "first thumb keeps steering");
        await step(6);
        await shot("puffed-two-thumbs");
        // CDP touchEnd lifts the listed points: lift only the Puff! thumb.
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [second] });
      } else {
        await page.keyboard.down("Space");
        await step(6);
        await page.keyboard.up("Space");
        await shot("puffed");
      }
      assert.equal(await page.evaluate(() => window.__game.puffer.state.defended), true);
      assert.equal(await page.evaluate(() => window.__game.puffer.state.hunter.phase), "retreating");
      const hunterX = await page.evaluate(() => window.__game.puffer.state.hunter.x);
      await step(12);
      assert.ok(await page.evaluate(x => window.__game.puffer.state.hunter.x > x, hunterX));
      for (let n = 0; n < 400 && await phase() === "playing"; n++) await step(1);
      if (touch) await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      else await page.keyboard.up("ArrowRight");
      assert.equal(await phase(), "won");
      assert.ok(await clear());
      await shot("shelter-success");
      assert.equal(await world(), preserved);
      assert.equal(await saves(), saved);
      await tap("#puffer-go");
      assert.equal(await phase(), "playing");
      assert.equal(await page.evaluate(() => window.__game.puffer.state.defended), false);
      await page.keyboard.down("ArrowLeft");
      await step(2);
      await page.keyboard.press("Escape");
      await page.keyboard.up("ArrowLeft");
      assert.equal(await phase(), "paused");
      assert.ok(await clear());
      const frozen = await page.evaluate(() => JSON.stringify(window.__game.puffer.state));
      await step(20);
      assert.equal(await page.evaluate(() => JSON.stringify(window.__game.puffer.state)), frozen);
      await shot("paused");
      await tap("#puffer-go");
      await tap("#puffer-back");
      assert.ok(await clear());
      assert.ok(await page.locator("#book").isVisible());
      assert.equal(await world(), preserved);
      assert.equal(await saves(), saved);
      await tap("#book-close");
      assert.ok(await page.locator("#paused").isVisible());
      assert.deepEqual(errors, []);
      console.log(`PASS ${label}: discovery, entry, retry, real ${touch ? "two-thumb" : "keyboard"} defence, shelter, replay, pause, exact return`);
      passed++;

      // Reload in network-offline mode using only the bytes already seen in this context.
      offline = true;
      await context.setOffline(true);
      await page.reload();
      await page.waitForFunction(() => window.__game);
      await step(1);
      await tap("#intro-book-button");
      await tap('.book-zone:first-child [data-kind="pufferfish"]');
      await tap("#card-be");
      await tap("#puffer-go");
      // Let one real frame pass so focus leaves the hidden dialog button, as it does for a child.
      await page.evaluate(() => new Promise(done => requestAnimationFrame(done)));
      await page.keyboard.press("Space");
      await step(6);
      assert.ok(await page.evaluate(() => window.__game.puffer.state.puff >= 0.55));
      await shot("cached-assets-offline");
      await tap("#puffer-back");
      assert.ok(await page.locator("#book").isVisible());
      assert.deepEqual(errors, []);
      console.log(`PASS ${label}: cached-asset offline reload, entry, puff, return (native SW lifecycle: Node tests)`);
      passed++;
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
console.log(`browser-puffer: ${passed} passed, 0 failed; screenshots: ${shots}`);
