// Sideways phone check (844x390 touch): the fish itself swims to a held finger, the ocean scrolls
// only near an edge, snacks are easy to catch with a visible +1, growing explains itself, upright
// asks to turn, and every panel fits. Same server/Chrome setup as browser-play.mjs.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const OUT = process.env.OUT || "screenshots/sideways";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
mkdirSync(OUT, { recursive: true });

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map(), listeners = new Map();
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const promise = pending.get(message.id);
      pending.delete(message.id);
      message.error ? promise?.reject(new Error(message.error.message)) : promise?.resolve(message.result);
    } else listeners.get(message.method)?.(message.params);
  };
  return {
    on: (event, callback) => listeners.set(event, callback),
    close: () => ws.close(),
    send: (method, params = {}) => new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    })
  };
}

const version = await (await fetch(`${CDP}/json/version`)).json();
const browser = await connect(version.webSocketDebuggerUrl);
const { browserContextId } = await browser.send("Target.createBrowserContext");
const { targetId } = await browser.send("Target.createTarget", { url: "about:blank", browserContextId });
const page = await connect((await (await fetch(`${CDP}/json/list`)).json()).find(t => t.id === targetId).webSocketDebuggerUrl);
const errors = [];
page.on("Runtime.exceptionThrown", error => errors.push(error.exceptionDetails.exception?.description || error.exceptionDetails.text));
page.on("Runtime.consoleAPICalled", call => { if (call.type === "error") errors.push(call.args.map(a => a.value ?? a.description).join(" ")); });
page.on("Fetch.requestPaused", async ({ requestId, responseStatusCode }) => {
  if (responseStatusCode !== 200) return page.send("Fetch.continueRequest", { requestId });
  const result = await page.send("Fetch.getResponseBody", { requestId });
  const source = result.base64Encoded ? Buffer.from(result.body, "base64").toString() : result.body;
  const body = Buffer.from(source + "\nwindow.__game = { world, input };\n").toString("base64");
  await page.send("Fetch.fulfillRequest", { requestId, responseCode: 200,
    responseHeaders: [{ name: "Content-Type", value: "text/javascript" }], body });
});
const evaluate = async expression => {
  const result = await page.send("Runtime.evaluate", { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const shot = async name => {
  const result = await page.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(result.data, "base64"));
  console.log("  shot", `${OUT}/${name}.png`);
};
const size = (width, height) => page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: true });
const touch = (type, x, y) => page.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
const tap = async (x, y) => { await touch("touchStart", x, y); await touch("touchEnd"); };
const tapButton = async selector => {
  const r = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await tap(r.x, r.y);
};
const fishOnScreen = () => evaluate(`(() => { const w = __game.world; return {
  x: Math.round(w.player.x - w.camera.x + innerWidth / 2), y: Math.round(w.player.y - w.camera.y + innerHeight / 2),
  camera: [Math.round(w.camera.x), Math.round(w.camera.y)], bites: w.bites, stage: w.stage, hearts: w.hearts, phase: w.phase }; })()`);
// A thumb on the arrow pad, pushed dx,dy (each -1..1) from its middle.
const padPoint = async (dx, dy) => {
  const r = await evaluate(`(() => { const r = document.querySelector("#pad").getBoundingClientRect(); return { x: r.x, y: r.y, size: r.width }; })()`);
  return { x: r.x + r.size / 2 + dx * r.size * 0.35, y: r.y + r.size / 2 + dy * r.size * 0.35 };
};
const padVisible = () => evaluate(`(() => { const pad = document.querySelector("#pad"); return !pad.hidden && getComputedStyle(pad).display !== "none"; })()`);
const fitsOnScreen = selector => evaluate(`(() => { const r = document.querySelector("${selector}").getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; })()`);

await page.send("Page.enable"); await page.send("Runtime.enable");
await page.send("Network.setBypassServiceWorker", { bypass: true });
await page.send("Fetch.enable", { patterns: [{ urlPattern: "*/src/main.js", requestStage: "Response" }] });
await page.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await size(844, 390);
await page.send("Page.navigate", { url: GAME });
await sleep(1500);
console.log("1. intro, sideways: start button fits:", await fitsOnScreen("#start-button"));
await shot("01-intro-sideways");

assert.equal(await padVisible(), false, "arrow pad should stay hidden on the start screen");
await tapButton("#start-button");
await sleep(300);
await evaluate("__game.world.invulnerable = 999; __game.world.creatures = []");
assert.equal(await padVisible(), true, "arrow pad should show while swimming");
const start = await fishOnScreen();
const upRight = await padPoint(0.7, -0.7);
await touch("touchStart", upRight.x, upRight.y);
await sleep(1000);
const held = await fishOnScreen();
const lit = await evaluate("document.querySelector('#pad').getAttribute('data-dir')");
console.log("2. thumb held on the up-right of the arrow pad:", JSON.stringify({ start, held, lit }));
await shot("02-arrow-pad-up-right");
assert.ok(held.x > start.x + 40 && held.y < start.y - 40, "the up-right arrow should swim the fish up and right");
assert.equal(lit, "1,-1", "the up and right arrows should light up");
await touch("touchEnd");
await sleep(150);
assert.equal(await evaluate("__game.input.pad"), null, "lifting the thumb should stop the arrows");

// Two thumbs on the pad: when the newer one lifts, the one still down keeps steering.
const right = await padPoint(1, 0), up = await padPoint(0, -1);
await page.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: right.x, y: right.y, id: 1 }] });
await page.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: right.x, y: right.y, id: 1 }, { x: up.x, y: up.y, id: 2 }] });
await sleep(150);
const bothDown = await evaluate("JSON.stringify(__game.input.pad)");
// touchEnd lists the touches that lift.
await page.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [{ x: up.x, y: up.y, id: 2 }] });
await sleep(150);
const oneLeft = await evaluate("JSON.stringify(__game.input.pad)");
await touch("touchEnd");
console.log("2b. two thumbs, newer lifts:", bothDown, "->", oneLeft);
assert.equal(bothDown, JSON.stringify({ x: 0, y: -1 }), "the newer thumb should steer");
assert.equal(oneLeft, JSON.stringify({ x: 1, y: 0 }), "the thumb still down should take over");
await sleep(150);

// A finger on the water must not pull the fish under it (that hid the fish).
const beforeFinger = await fishOnScreen();
await touch("touchStart", beforeFinger.x + 150, beforeFinger.y + 60);
await sleep(1000);
const afterFinger = await fishOnScreen();
await touch("touchEnd");
console.log("3. finger held on the water:", JSON.stringify({ beforeFinger, afterFinger }));
assert.ok(Math.hypot(afterFinger.x - beforeFinger.x, afterFinger.y - beforeFinger.y) < 3, "a finger on the water should not move the fish");

const left = await padPoint(-1, 0);
const cameraBefore = (await fishOnScreen()).camera[0];
await touch("touchStart", left.x, left.y);
let edge = await fishOnScreen();
for (let wait = 0; wait < 60 && edge.camera[0] > cameraBefore - 40; wait++) { await sleep(100); edge = await fishOnScreen(); }
await touch("touchEnd");
console.log("3b. left arrow held (ocean should scroll):", JSON.stringify(edge));
await shot("03-edge-scroll");
assert.ok(edge.camera[0] <= cameraBefore - 40, "holding left should scroll the ocean");

// Opened from the iPhone home screen, the notch pushes the pad inward; swimming
// down-left must scroll the ocean rather than tuck the fish under the pad.
await page.send("Emulation.setSafeAreaInsetsOverride", { insets: { left: 47, right: 47, bottom: 21 } });
await sleep(300);
const downLeft = await padPoint(-0.7, 0.7);
await touch("touchStart", downLeft.x, downLeft.y);
let closest = Infinity;
for (let sample = 0; sample < 20; sample++) {
  await sleep(150);
  closest = Math.min(closest, await evaluate(`(() => { const w = __game.world, pad = document.querySelector("#pad").getBoundingClientRect();
    const x = w.player.x - w.camera.x + innerWidth / 2, y = w.player.y - w.camera.y + innerHeight / 2;
    return Math.hypot(x - pad.left - pad.width / 2, y - pad.top - pad.height / 2) - pad.width / 2; })()`));
}
await shot("03c-down-left-with-notch");
await touch("touchEnd");
await page.send("Emulation.setSafeAreaInsetsOverride", { insets: {} });
console.log("3c. down-left with a notch: closest gap between fish centre and pad edge:", Math.round(closest));
assert.ok(closest >= 16, "the fish swam under the arrow pad");
await evaluate("__game.world.invulnerable = 999");

// A child steers at the nearest snack with the arrows, for up to 20 seconds.
const eatStart = Date.now(); let lastBites = (await fishOnScreen()).bites; let eaten = 0; let popShot = false;
let thumb = await padPoint(1, 0);
await touch("touchStart", thumb.x, thumb.y);
while (Date.now() - eatStart < 20000) {
  const aim = await evaluate(`(() => { const w = __game.world; let best = null;
    for (const c of w.creatures) { if (c.tier > w.stage) continue;
      const d = Math.hypot(c.x - w.player.x, c.y - w.player.y);
      if (!best || d < best.d) best = { dx: (c.x - w.player.x) / d, dy: (c.y - w.player.y) / d, d }; }
    return best; })()`);
  if (aim) {
    thumb = await padPoint(aim.dx, aim.dy);
    await touch("touchMove", thumb.x, thumb.y);
  }
  await sleep(120);
  const now = await fishOnScreen();
  if (now.stage > 0 || now.bites > lastBites) {
    eaten += now.stage > 0 && now.bites < lastBites ? now.bites + 1 : now.bites - lastBites;
    if (!popShot) { await shot("04-plus-one-and-gulp"); popShot = true; }
  }
  lastBites = now.bites;
  if (now.stage > 0) break;
}
await touch("touchEnd");
const afterEating = await fishOnScreen();
console.log("4. arrows chasing snacks for up to 20 s:", JSON.stringify({ seconds: ((Date.now() - eatStart) / 1000).toFixed(1), stage: afterEating.stage, bites: afterEating.bites }));
assert.equal(afterEating.stage, 1, "a child using the arrows should grow within 20 seconds");

// Growth message: one bite short, snack right at the mouth.
await evaluate(`(() => { const w = __game.world; w.stage = 0; w.bites = 5; w.creatures = [{ x: w.player.x + 10, y: w.player.y, tier: 0, direction: 1, wobble: 0 }]; })()`);
await sleep(250);
console.log("5. grow message:", JSON.stringify(await evaluate("document.querySelector('#toast').textContent")));
await shot("05-grow-message");

await tapButton("#pause-button");
await sleep(300);
assert.equal(await padVisible(), false, "arrow pad should hide while paused");
await tapButton("#resume-button");
await sleep(300);
assert.equal(await padVisible(), true, "arrow pad should come back after resuming");

await size(390, 844);
await sleep(500);
console.log("6. turned upright: phase =", await evaluate("__game.world.phase"),
  "| turn-sideways screen showing:", await evaluate("getComputedStyle(document.querySelector('.rotate')).display !== 'none'"));
await shot("06-turn-sideways");
await size(844, 390);
await sleep(500);
console.log("7. back sideways: paused panel button fits:", await fitsOnScreen("#resume-button"));
await shot("07-back-sideways-paused");

// Safari with its bars showing leaves a shorter sideways screen.
for (const height of [390, 340, 330]) {
  await size(844, height);
  await page.send("Page.reload", { ignoreCache: true });
  for (let wait = 0; wait < 50 && !(await evaluate("Boolean(window.__game)")); wait++) await sleep(100);
  await sleep(300);
  const introFits = await fitsOnScreen("#start-button") && await fitsOnScreen("#intro h1") && await fitsOnScreen("#intro-foot");
  await tapButton("#start-button");
  await sleep(200);
  await evaluate(`(() => { const w = __game.world; w.stage = 3; w.bites = 8; w.creatures = [{ ...w.player, tier: 3, wobble: 0 }]; })()`);
  await sleep(300);
  const wonFits = await fitsOnScreen("#won .text-button") && await fitsOnScreen("#continue-button");
  await shot(`08-won-844x${height}`);
  assert.equal(await padVisible(), false, "arrow pad should hide on the win screen");
  if (height === 390) {
    await tapButton("#win-plant-button");
    await sleep(300);
    assert.equal(await evaluate("__game.world.phase"), "planting");
    assert.equal(await padVisible(), false, "arrow pad should hide while planting coral");
  }
  console.log(`8. 844x${height}: whole start screen fits: ${introFits}; win panel buttons fit: ${wonFits}`);
  assert.ok(introFits && wonFits, `844x${height}: start or win screen does not fit`);
}

// A touchscreen laptop reports a mouse as its main pointer; its first touch should bring up the arrows.
await size(1280, 800);
const { identifier } = await page.send("Page.addScriptToEvaluateOnNewDocument", { source:
  "const realMatch = window.matchMedia.bind(window); window.matchMedia = q => q.includes('coarse') ? { matches: false, media: q, addEventListener() {}, removeEventListener() {} } : realMatch(q);" });
await page.send("Page.reload", { ignoreCache: true });
for (let wait = 0; wait < 50 && !(await evaluate("Boolean(window.__game)")); wait++) await sleep(100);
await sleep(300);
await evaluate("document.querySelector('#start-button').click()");
await sleep(300);
const padBeforeTouch = await padVisible();
await tap(900, 300);
await sleep(200);
const padAfterTouch = await padVisible();
await page.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
console.log("9. touchscreen laptop: pad before a touch:", padBeforeTouch, "after:", padAfterTouch);
assert.ok(!padBeforeTouch && padAfterTouch, "a touch on a mouse-first screen should bring up the arrow pad");

console.log("errors:", errors.length ? errors.join("\n") : "none");
assert.deepEqual(errors, [], "page errors");
page.close();
await browser.send("Target.disposeBrowserContext", { browserContextId });
browser.close();
