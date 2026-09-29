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
  return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; })()`);

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

// A finger on the water must not pull the fish under it (that hid the fish).
const beforeFinger = await fishOnScreen();
await touch("touchStart", beforeFinger.x + 150, beforeFinger.y + 60);
await sleep(1000);
const afterFinger = await fishOnScreen();
await touch("touchEnd");
console.log("3. finger held on the water:", JSON.stringify({ beforeFinger, afterFinger }));
assert.ok(Math.hypot(afterFinger.x - beforeFinger.x, afterFinger.y - beforeFinger.y) < 3, "a finger on the water should not move the fish");

const left = await padPoint(-1, 0);
await touch("touchStart", left.x, left.y);
await sleep(2500);
const edge = await fishOnScreen();
await touch("touchEnd");
console.log("3b. left arrow held (ocean should scroll):", JSON.stringify(edge));
await shot("03-edge-scroll");
assert.ok(edge.camera[0] < -50, "holding left should scroll the ocean");
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
  console.log(`8. 844x${height}: whole start screen fits: ${introFits}; win panel buttons fit: ${wonFits}`);
  assert.ok(introFits && wonFits, `844x${height}: start or win screen does not fit`);
}

console.log("errors:", errors.length ? errors.join("\n") : "none");
assert.deepEqual(errors, [], "page errors");
page.close();
await browser.send("Target.disposeBrowserContext", { browserContextId });
browser.close();
