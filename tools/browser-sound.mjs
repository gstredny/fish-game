// Sound check in a real browser: sound stays off until a real tap or click, then snacks,
// growing, bumps, becoming the shark and game over each play their sound.
//
//   node tools/browser-sound.mjs
//
// Needs Playwright with Chromium (see tools/browser-check.mjs). Set PLAYWRIGHT_MODULE to use
// an installed copy.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

let playwright;
try {
  playwright = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch (error) {
  console.error(`browser-sound FAILED: cannot load Playwright (${error.message}).`);
  process.exit(2);
}
const { chromium, devices } = playwright;

const root = new URL("..", import.meta.url).pathname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, "http://x").pathname)).replace(/^\/+/, "") || "index.html";
  const file = join(root, path);
  try {
    if (!file.startsWith(root) || !statSync(file).isFile()) throw new Error("not found");
    response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    response.end(readFileSync(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/`;

// Counts every note the page plays and keeps hold of its audio engine.
const LISTEN = `(() => {
  window.__notes = 0;
  const makeNote = BaseAudioContext.prototype.createOscillator;
  BaseAudioContext.prototype.createOscillator = function () { window.__notes++; return makeNote.call(this); };
  const Real = window.AudioContext;
  window.AudioContext = class extends Real { constructor(...options) { super(...options); window.__audio = this; } };
})();`;

const browser = await chromium.launch();
const results = [];
try {
  for (const [label, options] of [["desktop", { viewport: { width: 1280, height: 800 } }], ["phone", devices["iPhone 13 landscape"]]]) {
    const context = await browser.newContext({ ...options, serviceWorkers: "block" });
    const page = await context.newPage();
    await page.addInitScript(LISTEN);
    await page.route("**/src/main.js", async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: `${await response.text()}\nwindow.littleFish = { world };\n` });
    });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => window.littleFish);

    // Nothing may sound before the child touches the game.
    await page.evaluate(() => {
      const { world } = window.littleFish;
      world.phase = "playing";
      world.creatures = [{ ...world.player, tier: 0, wobble: 0, art: null }];
    });
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__notes), 0, `${label}: sound played before any tap`);
    await page.evaluate(() => { window.littleFish.world.phase = "ready"; });

    if (options.hasTouch) await page.tap("#start-button");
    else await page.click("#start-button");
    const switchedOn = await page.waitForFunction(() => window.__audio?.state === "running", null, { timeout: 5000 })
      .then(() => true, () => false);
    assert.ok(switchedOn, `${label}: sound did not switch on after a tap`);

    const heard = {};
    const moment = async (name, setup, phase) => {
      const before = await page.evaluate(() => window.__notes);
      await page.evaluate(setup);
      if (phase) await page.waitForFunction(phase => window.littleFish.world.phase === phase, phase);
      await page.waitForTimeout(250);
      heard[name] = await page.evaluate(() => window.__notes) - before;
    };
    await moment("snack", () => {
      const { world } = window.littleFish;
      world.invulnerable = 99;
      world.creatures = [{ ...world.player, tier: 0, wobble: 0, art: null }];
    });
    await moment("grow", () => {
      const { world } = window.littleFish;
      world.bites = 5;
      world.creatures = [{ ...world.player, tier: 0, wobble: 0, art: null }];
    });
    await moment("bump", () => {
      const { world } = window.littleFish;
      world.invulnerable = 0;
      world.creatures = [{ ...world.player, tier: 3, wobble: 0, art: null }];
    });
    await moment("shark", () => {
      const { world } = window.littleFish;
      world.stage = 3;
      world.bites = 8;
      world.creatures = [{ ...world.player, tier: 3, wobble: 0, art: null }];
    }, "won");
    await page.click("#win-restart-button");
    await page.waitForFunction(() => window.littleFish.world.phase === "playing");
    await moment("game over", () => {
      const { world } = window.littleFish;
      world.hearts = 1;
      world.invulnerable = 0;
      world.creatures = [{ ...world.player, tier: 3, wobble: 0, art: null }];
    }, "gameover");

    console.log(`${label}: notes per moment ${JSON.stringify(heard)}`);
    assert.ok(heard.snack >= 1 && heard.snack <= 3, `${label}: a snack should go "nom"`);
    assert.ok(heard.grow >= 4, `${label}: growing should chime`);
    assert.ok(heard.bump >= 1 && heard.bump <= 2, `${label}: a bump should "bonk"`);
    assert.ok(heard.shark >= 7, `${label}: becoming the shark should play the fanfare`);
    assert.ok(heard["game over"] >= 3, `${label}: game over should play its tune`);
    assert.deepEqual(errors, [], `${label}: page errors`);
    results.push(`${label}: silent until tapped; nom, chime, bonk, fanfare and game-over tune all play`);
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(results.join("\n"));
console.log("browser-sound passed.");
