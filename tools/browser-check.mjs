// Plays the game in a real browser: draws a fish, checks the saved drawing is
// clipped to the fish shape, swims to shark form, and saves screenshots.
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
  ".png": "image/png", ".svg": "image/svg+xml" };
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
const base = `http://127.0.0.1:${server.address().port}/?test`;

// Points on the saved picture, in fish-size units (head right, body centre at 0,0).
const OUTSIDE = [[0.95, -0.75], [1.07, 0], [-1.6, 0]];
const RED_INSIDE = [0.3, 0];
const BLUE_INSIDE = [-0.3, 0.3];
const BARE_INSIDE = [0.5, 0.35];

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

async function pixels(page, points) {
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

// Steers with the same pointer events a mouse sends: chase the nearest snack,
// swerve away from anything bigger.
async function swimToShark(page, label) {
  const deadline = Date.now() + 240_000;
  let retries = 0;
  await page.evaluate(() => {
    window.botTimer = setInterval(() => {
      const world = window.littleFish.world;
      if (world.phase !== "playing") return;
      const player = world.player;
      let steerX = 0;
      let steerY = 0;
      let best = null;
      for (const creature of world.creatures) {
        const dx = creature.x - player.x;
        const dy = creature.y - player.y;
        const gap = Math.hypot(dx, dy) || 1;
        if (creature.tier > world.stage && gap < 260) {
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
      const length = Math.hypot(steerX, steerY) || 1;
      document.querySelector("#ocean").dispatchEvent(new PointerEvent("pointermove", {
        pointerType: "mouse", bubbles: true,
        clientX: innerWidth / 2 + steerX / length * 120,
        clientY: innerHeight / 2 + steerY / length * 120
      }));
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
  for (const [label, options, touchText] of [
    ["desktop", { viewport: { width: 1280, height: 800 } }, "Move the mouse to swim · Arrow keys work too"],
    ["phone", devices["iPhone 13"], "Touch and hold to swim"]
  ]) {
    const browserContext = await browser.newContext(options);
    const page = await browserContext.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => message.type() === "error" && errors.push(message.text()));
    await page.goto(base);

    assert.match(await page.textContent("#intro .primary-button"), /Draw my fish/, `${label}: first visit should offer drawing`);
    await page.click("#draw-button");
    assert.equal(await page.isVisible("#sketch"), true);
    await page.screenshot({ path: join(shots, `${label}-1-draw-empty.png`) });

    await stroke(page, [[-1.7, -0.75], [1.1, -0.75]]);
    await stroke(page, [[-1.7, 0], [1.1, 0]]);
    await page.click('#crayons [aria-label="Blue"]');
    await stroke(page, [[0.95, -0.9], [0.95, 0.9]]);
    await stroke(page, [[-0.3, -0.9], [-0.3, 0.9]]);
    await page.screenshot({ path: join(shots, `${label}-2-draw-painted.png`) });
    await page.click("#swim-button");
    await page.waitForFunction(() => document.querySelector("#overlay").hidden);

    const [outside1, outside2, outside3, red, blue, bare] = await pixels(page,
      [...OUTSIDE, RED_INSIDE, BLUE_INSIDE, BARE_INSIDE]);
    for (const [index, pixel] of [outside1, outside2, outside3].entries()) {
      assert.equal(pixel[3], 0, `${label}: paint leaked outside the fish at ${OUTSIDE[index]} (rgba ${pixel})`);
    }
    assert.deepEqual(red, [255, 90, 95, 255], `${label}: red stroke missing inside the fish`);
    assert.deepEqual(blue, [58, 155, 255, 255], `${label}: blue stroke missing inside the fish`);
    assert.deepEqual(bare, [255, 246, 226, 255], `${label}: unpainted fish should be cream`);

    assert.equal(await page.evaluate(() => Boolean(window.littleFish.art.player)), true, `${label}: drawing not loaded as the player`);
    assert.equal(await page.isVisible("#stage-art"), true, `${label}: HUD should show the child's fish`);
    assert.equal(await page.textContent("#hint"), touchText, `${label}: wrong swim hint`);
    assert.equal(await page.isVisible("#hint"), true, `${label}: hint should show at the start`);

    const hudBox = await page.locator(".growth-card").boundingBox();
    await page.evaluate(box => {
      const world = window.littleFish.world;
      world.creatures.push({ x: world.player.x + box.x + box.width / 2 - innerWidth / 2,
        y: world.player.y + box.y + box.height / 2 - innerHeight / 2, tier: 2, direction: 1, wobble: 0, art: null });
    }, hudBox);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.querySelector("#hud").classList.contains("see-through")), true,
      `${label}: HUD should fade when a big fish is behind it`);
    await page.screenshot({ path: join(shots, `${label}-3-hud-see-through.png`) });
    await page.evaluate(() => {
      const world = window.littleFish.world;
      world.creatures = world.creatures.filter(creature => creature.tier <= world.stage);
    });
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => document.querySelector("#hud").classList.contains("see-through")), false,
      `${label}: HUD should return once the big fish leaves`);

    const started = Date.now();
    const retries = await swimToShark(page, label);
    const seconds = Math.round((Date.now() - started) / 1000);
    assert.equal(await page.isVisible("#hint"), false, `${label}: hint should hide once swimming`);
    assert.equal(await page.isVisible("#won-art"), true, `${label}: win screen should show the child's shark`);
    await page.screenshot({ path: join(shots, `${label}-4-won.png`) });
    await page.click("#continue-button");
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(shots, `${label}-5-shark.png`) });

    await page.goto(base);
    await page.waitForFunction(() => !document.querySelector("#intro-art").hidden);
    assert.match(await page.textContent("#intro .primary-button"), /Dive in/, `${label}: return visit should offer diving in`);
    await page.screenshot({ path: join(shots, `${label}-6-intro-saved.png`) });
    await page.click("#draw-button");
    await page.click('#crayons [aria-label="Green"]');
    await stroke(page, [[-1.5, -0.4], [0.9, -0.4], [0.9, 0.3], [-1.5, 0.3]]);
    await page.click("#swim-button");
    await page.waitForFunction(() => document.querySelector("#overlay").hidden);
    const drawnFish = await page.waitForFunction(() => {
      const world = window.littleFish.world;
      return world.artCount === 1 && window.littleFish.art.npc[0] &&
        world.creatures.filter(creature => creature.art === 0).length;
    }, null, { timeout: 15_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(shots, `${label}-7-drawn-ocean.png`) });

    assert.deepEqual(errors, [], `${label}: page errors`);
    results.push(`${label}: mask ok, HUD fade ok, shark in ${seconds}s (${retries} retries), ${await drawnFish.jsonValue()} drawn fish in the ocean`);
    await browserContext.close();
  }

  const landscape = await browser.newContext({ ...devices["iPhone 13 landscape"] });
  const page = await landscape.newPage();
  await page.goto(base);
  await page.click("#draw-button");
  const swim = await page.locator("#swim-button").boundingBox();
  const sketch = await page.locator("#sketch").boundingBox();
  const view = page.viewportSize();
  await page.screenshot({ path: join(shots, "landscape-draw.png") });
  assert.ok(swim.y + swim.height <= view.height && sketch.y >= 0, "landscape: drawing panel does not fit the screen");
  assert.ok(sketch.width >= 260, `landscape: drawing space is too small (${Math.round(sketch.width)}px wide)`);
  results.push(`landscape phone: drawing panel fits, drawing space ${Math.round(sketch.width)}px wide`);
  await landscape.close();
} finally {
  await browser.close();
  server.close();
}
console.log(results.join("\n"));
console.log(`browser-check passed. Screenshots: ${shots}`);
