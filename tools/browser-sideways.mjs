// Sideways phone check (844x390 touch): the fish itself swims to a held finger, the ocean scrolls
// only near an edge, snacks are easy to catch with a visible +1, growing explains itself, upright
// asks to turn, and every panel fits. Same server/Chrome setup as browser-play.mjs.
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

await tapButton("#start-button");
await sleep(300);
await evaluate("__game.world.invulnerable = 999");
const start = await fishOnScreen();
await touch("touchStart", 422 + 180, 195 - 70);
await sleep(1500);
const held = await fishOnScreen();
console.log("2. finger held right-up of the fish:", JSON.stringify({ start, held }));
await shot("02-fish-swam-to-finger");

await touch("touchMove", 30, 195);
await sleep(2500);
const edge = await fishOnScreen();
console.log("3. finger held at the left edge (ocean should scroll):", JSON.stringify(edge));
await shot("03-edge-scroll");
await touch("touchEnd");

// A child puts a finger on the nearest snack, again and again, for 20 seconds.
const eatStart = Date.now(); let lastBites = (await fishOnScreen()).bites; let eaten = 0; let popShot = false;
await touch("touchStart", 422, 195);
while (Date.now() - eatStart < 20000) {
  const snack = await evaluate(`(() => { const w = __game.world; let best = null;
    for (const c of w.creatures) { if (c.tier > w.stage) continue;
      const x = c.x - w.camera.x + innerWidth / 2, y = c.y - w.camera.y + innerHeight / 2;
      if (x < 10 || x > innerWidth - 10 || y < 70 || y > innerHeight - 10) continue;
      const d = Math.hypot(c.x - w.player.x, c.y - w.player.y);
      if (!best || d < best.d) best = { x, y, d }; }
    return best; })()`);
  if (snack) await touch("touchMove", snack.x, snack.y);
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
console.log("4. finger-on-snack for up to 20 s:", JSON.stringify({ seconds: ((Date.now() - eatStart) / 1000).toFixed(1), stage: afterEating.stage, bites: afterEating.bites }));

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
for (const height of [390, 340]) {
  await size(844, height);
  await page.send("Page.reload", { ignoreCache: true });
  for (let wait = 0; wait < 50 && !(await evaluate("Boolean(window.__game)")); wait++) await sleep(100);
  await sleep(300);
  const introFits = await fitsOnScreen("#start-button");
  await tapButton("#start-button");
  await sleep(200);
  await evaluate(`(() => { const w = __game.world; w.stage = 3; w.bites = 8; w.creatures = [{ ...w.player, tier: 3, wobble: 0 }]; })()`);
  await sleep(300);
  const wonFits = await fitsOnScreen("#won .text-button") && await fitsOnScreen("#continue-button");
  await shot(`08-won-844x${height}`);
  console.log(`8. 844x${height}: intro button fits: ${introFits}; win panel buttons fit: ${wonFits}`);
}

console.log("errors:", errors.length ? errors.join("\n") : "none");
page.close();
await browser.send("Target.disposeBrowserContext", { browserContextId });
browser.close();
