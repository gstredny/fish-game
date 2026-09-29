// Draw-your-own-fish check in a real browser: draws a fish, checks the saved drawing is
// clipped to the fish shape, swims to shark form on a computer and a sideways phone,
// fills the ocean with an older drawing, and saves screenshots.
//
//   node tools/browser-check.mjs [screenshot-folder]
//
// Needs Playwright with Chromium. Set PLAYWRIGHT_MODULE to its path when it is
// installed globally, e.g. PLAYWRIGHT_MODULE=/usr/lib/node_modules/playwright/index.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { KINDS } from "../src/species.js";

let playwright;
try {
  playwright = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch (error) {
  console.error(`browser-check FAILED: cannot load Playwright (${error.message}).`);
  console.error("Install it (npm i --no-save playwright && npx playwright install chromium) or set PLAYWRIGHT_MODULE.");
  process.exit(2);
}
const { chromium, devices } = playwright;

const root = new URL("..", import.meta.url).pathname;
const shots = process.argv[2] || join(tmpdir(), "little-fish-check");
mkdirSync(shots, { recursive: true });
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

// Points on the saved picture, in fish-size units (head right, body centre at 0,0).
const OUTSIDE = [[0.95, -0.75], [1.07, 0], [-1.6, 0]];
const RED_INSIDE = [0.3, 0];
const BLUE_INSIDE = [-0.3, 0.3];
const BARE_INSIDE = [0.5, 0.35];
const CREAM = [255, 246, 226, 255];
const RED = [255, 90, 95, 255];

// Every animal counts as met, so first-meeting fact cards don't pause this check;
// tools/browser-learn.mjs checks the cards.
const MET_ALL = `try { localStorage.setItem("little-fish-met-v1", ${JSON.stringify(JSON.stringify(KINDS))}); } catch {}`;

async function openGame(context) {
  await context.addInitScript(MET_ALL);
  const page = await context.newPage();
  // Expose the game's state to this check without a test hook in the shipped code.
  await page.route("**/src/main.js", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nwindow.littleFish = { world, art, input };\n` });
  });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => message.type() === "error" && errors.push(message.text()));
  await page.goto(base);
  await page.waitForFunction(() => window.littleFish);
  return { page, errors };
}

async function stroke(page, points) {
  const box = await page.locator("#sketch").boundingBox();
  const at = ([x, y]) => [box.x + (x + 1.7) / 2.8 * box.width, box.y + (y + 0.9) / 1.8 * box.height];
  await page.mouse.move(...at(points[0]));
  await page.mouse.down();
  for (let index = 1; index < points.length; index++) {
    const [fromX, fromY] = points[index - 1];
    const [toX, toY] = points[index];
    for (let step = 1; step <= 12; step++) {
      await page.mouse.move(...at([fromX + (toX - fromX) * step / 12, fromY + (toY - fromY) * step / 12]));
    }
  }
  await page.mouse.up();
}

async function screenPixel(page, [x, y]) {
  return page.evaluate(([x, y]) => {
    const sketch = document.querySelector("#sketch");
    return [...sketch.getContext("2d").getImageData(
      Math.round((x + 1.7) / 2.8 * sketch.width), Math.round((y + 0.9) / 1.8 * sketch.height), 1, 1).data];
  }, [x, y]);
}

async function layerPixel(page, which, [x, y]) {
  return page.evaluate(([which, x, y]) => {
    const art = window.littleFish.art;
    const layers = which === "player" ? art.player : art.npc[0];
    return [...layers.body.getContext("2d").getImageData(
      Math.round((x + 1.7) / 2.8 * layers.body.width), Math.round((y + 0.9) / 1.8 * layers.body.height), 1, 1).data];
  }, [which, x, y]);
}

async function savedPixels(page, points) {
  return page.evaluate(async points => {
    const [drawing] = JSON.parse(localStorage.getItem("little-fish-drawings"));
    const image = new Image();
    image.src = drawing;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return points.map(([x, y]) => [...context.getImageData(
      Math.round((x + 1.7) / 2.8 * image.width), Math.round((y + 0.9) / 1.8 * image.height), 1, 1).data]);
  }, points);
}

// Two fingers at once, as real touch input. CDP's touchEnd lists the touches that lift.
async function twoFingers(page) {
  const box = await page.locator("#sketch").boundingBox();
  const at = ([x, y], id) => ({ x: box.x + (x + 1.7) / 2.8 * box.width, y: box.y + (y + 0.9) / 1.8 * box.height, id });
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, touchPoints) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints });
  await touch("touchStart", [at([-0.6, -0.3], 0)]);
  await touch("touchStart", [at([-0.6, -0.3], 0), at([0.6, 0.3], 1)]);
  await touch("touchMove", [at([-0.62, -0.3], 0), at([0.58, 0.3], 1)]);
  await touch("touchEnd", [at([-0.62, -0.3], 0)]);
  for (let step = 1; step <= 12; step++) await touch("touchMove", [at([0.58 - step * 0.1, 0.3], 1)]);
  await touch("touchEnd", [at([-0.62, 0.3], 1)]);
}

const visible = (page, selector) => page.evaluate(selector => {
  const node = document.querySelector(selector);
  const box = node.getBoundingClientRect();
  return !node.hidden && box.width > 0 && box.height > 0;
}, selector);
const fits = (page, selector) => page.evaluate(selector => {
  const box = document.querySelector(selector).getBoundingClientRect();
  return box.width > 0 && box.height > 0 && box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight && box.right <= innerWidth;
}, selector);

// Steers through the same input the arrow pad feeds: chase the nearest snack,
// swerve away from anything bigger.
async function swimToShark(page, label) {
  const deadline = Date.now() + 240_000;
  let retries = 0;
  await page.evaluate(() => {
    window.botTimer = setInterval(() => {
      const { world, input } = window.littleFish;
      if (world.phase !== "playing") return;
      let steerX = 0;
      let steerY = 0;
      let best = null;
      for (const creature of world.creatures) {
        const dx = creature.x - world.player.x;
        const dy = creature.y - world.player.y;
        const gap = Math.hypot(dx, dy) || 1;
        if (creature.tier > world.stage + 1 && gap < 260) {
          steerX -= dx / gap * (260 - gap) / 60;
          steerY -= dy / gap * (260 - gap) / 60;
        } else if (creature.tier <= world.stage && (!best || gap < best.gap)) {
          best = { dx, dy, gap };
        }
      }
      if (best) {
        steerX += best.dx / best.gap;
        steerY += best.dy / best.gap;
      }
      input.pad = { x: steerX, y: steerY };
    }, 40);
  });
  while (Date.now() < deadline) {
    const phase = await page.evaluate(() => window.littleFish.world.phase);
    if (phase === "won") break;
    if (phase === "gameover") {
      retries++;
      await page.click("#restart-button");
    }
    await page.waitForTimeout(250);
  }
  await page.evaluate(() => clearInterval(window.botTimer));
  const state = await page.evaluate(() => ({ stage: window.littleFish.world.stage, phase: window.littleFish.world.phase }));
  assert.deepEqual(state, { stage: 4, phase: "won" }, `${label}: did not reach shark form in time`);
  return retries;
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const results = [];
try {
  for (const [label, options, hintText] of [
    ["desktop", { viewport: { width: 1280, height: 800 } }, "Move the mouse where you want to swim · Arrow keys work too"],
    ["phone", devices["iPhone 13 landscape"], "Hold an arrow to swim"]
  ]) {
    const browserContext = await browser.newContext({ ...options, serviceWorkers: "block" });
    const { page, errors } = await openGame(browserContext);

    assert.match(await page.textContent("#intro .primary-button"), /Dive in/, `${label}: diving in is always the big button`);
    assert.match(await page.textContent("#draw-button"), /Draw my fish/, `${label}: first visit should offer drawing`);
    await page.click("#draw-button");
    assert.equal(await visible(page, "#sketch"), true);
    await page.screenshot({ path: join(shots, `${label}-1-draw-empty.png`) });
    if (options.hasTouch) {
      await twoFingers(page);
      assert.deepEqual(await screenPixel(page, [0, 0]), CREAM, `${label}: two fingers drew a line between them`);
      assert.deepEqual(await screenPixel(page, [0, 0.3]), RED, `${label}: the second finger stopped drawing when the first lifted`);
      await page.click("#clear-button");
      assert.deepEqual(await screenPixel(page, [0, 0.3]), CREAM, `${label}: Start over left paint behind`);
    }

    await stroke(page, [[-1.7, -0.75], [1.1, -0.75]]);
    await stroke(page, [[-1.7, 0], [1.1, 0]]);
    await page.click('#crayons [aria-label="Blue"]');
    await stroke(page, [[0.95, -0.9], [0.95, 0.9]]);
    await stroke(page, [[-0.3, -0.9], [-0.3, 0.9]]);
    await page.screenshot({ path: join(shots, `${label}-2-draw-painted.png`) });
    for (const point of OUTSIDE) {
      assert.equal((await screenPixel(page, point))[3], 0, `${label}: paint shows outside the fish on the drawing page at ${point}`);
    }
    await page.click("#swim-button");
    await page.waitForFunction(() => document.querySelector("#overlay").hidden);

    const [outside1, outside2, outside3, red, blue, bare] = await savedPixels(page,
      [...OUTSIDE, RED_INSIDE, BLUE_INSIDE, BARE_INSIDE]);
    for (const [index, pixel] of [outside1, outside2, outside3].entries()) {
      assert.equal(pixel[3], 0, `${label}: paint leaked outside the fish at ${OUTSIDE[index]} (rgba ${pixel})`);
    }
    assert.deepEqual(red, RED, `${label}: red stroke missing inside the fish`);
    assert.deepEqual(blue, [58, 155, 255, 255], `${label}: blue stroke missing inside the fish`);
    assert.deepEqual(bare, CREAM, `${label}: unpainted fish should be cream`);

    assert.equal(await page.evaluate(() => Boolean(window.littleFish.art.player)), true, `${label}: drawing not loaded as the player`);
    assert.equal(await visible(page, "#stage-art"), true, `${label}: HUD should show the child's fish`);
    assert.equal(await page.textContent("#hint"), hintText, `${label}: wrong swim hint`);
    assert.equal(await visible(page, "#hint"), true, `${label}: hint should show at the start`);
    assert.equal(await visible(page, "#pad"), Boolean(options.hasTouch), `${label}: arrow pad shows only on touch screens`);

    const hudBox = await page.locator(".growth-card").boundingBox();
    await page.evaluate(box => {
      const { world } = window.littleFish;
      world.creatures.push({ x: world.camera.x + box.x + box.width / 2 - innerWidth / 2,
        y: world.camera.y + box.y + box.height / 2 - innerHeight / 2, tier: 2, direction: 1, wobble: 0, art: null });
    }, hudBox);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.querySelector("#hud").classList.contains("see-through")), true,
      `${label}: HUD should fade when a big fish is behind it`);
    await page.screenshot({ path: join(shots, `${label}-3-hud-see-through.png`) });
    await page.evaluate(() => {
      const { world } = window.littleFish;
      world.creatures = world.creatures.filter(creature => creature.tier <= world.stage);
    });
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => document.querySelector("#hud").classList.contains("see-through")), false,
      `${label}: HUD should return once the big fish leaves`);

    // Swim one way for two seconds: the hint should step aside.
    await page.evaluate(() => { window.littleFish.world.invulnerable = 99; window.littleFish.input.pad = { x: 1, y: 0 }; });
    await page.waitForTimeout(2000);
    const hintAfterSwim = await page.evaluate(() => ({ phase: window.littleFish.world.phase, hidden: document.querySelector("#hint").hidden }));
    await page.evaluate(() => { window.littleFish.world.invulnerable = 0; window.littleFish.input.pad = null; });
    assert.deepEqual(hintAfterSwim, { phase: "playing", hidden: true }, `${label}: hint should hide once the player swims away`);

    const started = Date.now();
    const retries = await swimToShark(page, label);
    const seconds = Math.round((Date.now() - started) / 1000);
    assert.equal(await visible(page, "#won-art"), true, `${label}: win screen should show the child's shark`);
    assert.equal(await fits(page, "#won-art"), true, `${label}: the shark portrait should be on screen`);
    await page.screenshot({ path: join(shots, `${label}-4-won.png`) });
    await page.click("#continue-button");
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(shots, `${label}-5-shark.png`) });

    await page.goto(base);
    await page.waitForFunction(() => window.littleFish && !document.querySelector("#intro-art").hidden);
    assert.match(await page.textContent("#intro .primary-button"), /Dive in/, `${label}: return visit should offer diving in`);
    assert.equal(await fits(page, "#intro-art"), true, `${label}: the child's fish should show on the start screen`);
    await page.screenshot({ path: join(shots, `${label}-6-intro-saved.png`) });
    await page.click("#draw-button");
    await page.click('#crayons [aria-label="Green"]');
    await stroke(page, [[-1.5, -0.4], [0.9, -0.4], [0.9, 0.3], [-1.5, 0.3]]);
    await page.click("#swim-button");
    await page.waitForFunction(() => document.querySelector("#overlay").hidden);
    assert.deepEqual(await layerPixel(page, "player", [0, 0.3]), [63, 207, 122, 255], `${label}: the newest drawing should be the player`);
    assert.deepEqual(await layerPixel(page, "npc", [0.3, 0]), RED, `${label}: the older drawing should swim in the ocean`);
    assert.equal(await page.evaluate(() => window.littleFish.world.artCount), 1, `${label}: the older drawing should join the ocean`);
    // Freeze the swim, park one big drawn fish in open water, and look for its red stripe on the ocean canvas.
    const oceanPixel = await page.evaluate(async () => {
      const { world } = window.littleFish;
      world.phase = "frozen";
      const spot = { x: innerWidth * 0.78, y: innerHeight * 0.3 };
      world.creatures = [{ x: world.camera.x + spot.x - innerWidth / 2, y: world.camera.y + spot.y - innerHeight / 2,
        tier: 4, direction: 1, wobble: 0, art: 0 }];
      await new Promise(resolve => setTimeout(resolve, 150));
      const canvas = document.querySelector("#ocean");
      const ratio = canvas.width / innerWidth;
      const pixel = [...canvas.getContext("2d").getImageData(Math.round((spot.x + 3) * ratio), Math.round(spot.y * ratio), 1, 1).data];
      world.phase = "playing";
      return pixel;
    });
    assert.ok(oceanPixel[0] > 200 && oceanPixel[1] < 140 && oceanPixel[2] < 140,
      `${label}: the older drawing should be painted in the ocean (saw rgba ${oceanPixel})`);
    // Fish near the start are plankton, so refresh the ocean until new arrivals include drawn fish.
    const countDrawn = () => page.evaluate(() => window.littleFish.world.creatures.filter(creature => creature.art === 0).length);
    let drawnFish = await countDrawn();
    for (let tries = 0; tries < 6 && !drawnFish; tries++) {
      await page.evaluate(() => { window.littleFish.world.creatures = []; });
      await page.waitForTimeout(200);
      drawnFish = await countDrawn();
    }
    assert.ok(drawnFish > 0, `${label}: no drawn fish swam into the ocean`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(shots, `${label}-7-drawn-ocean.png`) });

    assert.deepEqual(errors, [], `${label}: page errors`);
    results.push(`${label}: mask ok, HUD fade ok, shark in ${seconds}s (${retries} retries), ${drawnFish} drawn fish in the ocean`);
    await browserContext.close();
  }

  // Sideways phones (with and without browser bars), small iPhones, and a short laptop window.
  for (const [width, height, device] of [[844, 390, "iPhone 13 landscape"], [844, 330, "iPhone 13 landscape"],
    [667, 375, "iPhone SE landscape"], [932, 430, "iPhone 14 Pro Max landscape"], [568, 320, "iPhone SE landscape"], [1280, 600, null]]) {
    const browserContext = await browser.newContext({ ...(device ? devices[device] : {}), viewport: { width, height }, serviceWorkers: "block" });
    const { page, errors } = await openGame(browserContext);
    await page.click("#draw-button");
    const sketch = await page.locator("#sketch").boundingBox();
    const size = `${width}x${height}`;
    const scrolls = await page.evaluate(() => { const draw = document.querySelector("#draw"); return draw.scrollHeight > draw.clientHeight + 1; });
    assert.ok(await fits(page, "#swim-button") && await fits(page, "#clear-button") && await fits(page, "#sketch") && !scrolls,
      `${size}: drawing panel does not fit the screen`);
    assert.ok(sketch.width >= 200, `${size}: drawing space is too small (${Math.round(sketch.width)}px wide)`);
    await page.screenshot({ path: join(shots, `fit-${size}-draw.png`) });
    await stroke(page, [[-1.2, 0], [0.8, 0]]);
    await page.click("#swim-button");
    await page.waitForFunction(() => document.querySelector("#overlay").hidden);
    await page.goto(base);
    await page.waitForFunction(() => window.littleFish && !document.querySelector("#intro-art").hidden);
    assert.ok(await fits(page, "#intro h1") && await fits(page, "#start-button") && await fits(page, "#draw-button") &&
      await fits(page, "#intro-art"), `${size}: start screen with a saved fish does not fit`);
    await page.screenshot({ path: join(shots, `fit-${size}-intro.png`) });
    await page.click("#start-button");
    await page.evaluate(() => { const { world } = window.littleFish; world.stage = 3; world.bites = 8; world.creatures = [{ ...world.player, tier: 3, wobble: 0, art: null }]; });
    await page.waitForFunction(() => !document.querySelector("#won").hidden);
    const portraitShown = await visible(page, "#won-art");
    // The portrait may sit in the panel's side padding but never over its text or buttons.
    const coversText = await page.evaluate(() => {
      const art = document.querySelector("#won-art").getBoundingClientRect();
      return [...document.querySelectorAll("#won h2, #won p, #won button")].some(node => {
        const box = node.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(node);
        const text = node.tagName === "P" ? range.getBoundingClientRect() : box;
        return art.right > text.left && art.left < text.right && art.bottom > text.top && art.top < text.bottom &&
          [...range.getClientRects()].some(line => art.right > line.left + 2 && art.left < line.right && art.bottom > line.top && art.top < line.bottom);
      });
    });
    assert.ok(width < 620 || portraitShown, `${size}: the shark portrait should show`);
    assert.ok((!portraitShown || (await fits(page, "#won-art") && !coversText)) && await fits(page, "#continue-button") &&
      await fits(page, "#win-restart-button"), `${size}: win screen does not fit, or the portrait covers its words`);
    await page.screenshot({ path: join(shots, `fit-${size}-won.png`) });
    assert.deepEqual(errors, [], `${size}: page errors`);
    results.push(`${size}: drawing panel (${Math.round(sketch.width)}px drawing space), start screen and win screen fit${portraitShown ? " with the shark portrait" : ""}`);
    await browserContext.close();
  }
} finally {
  await browser.close();
  server.close();
}
console.log(results.join("\n"));
console.log(`browser-check passed. Screenshots: ${shots}`);
