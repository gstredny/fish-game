// Plays the real game to the shark and through an "eat tuna" mission in headless Chrome. A seek-food /
// avoid-predator controller feeds the game's real pointer input; a screenshot is saved at every growth,
// at the mission card and at the win panel. LEVEL=big plays Big swimmer.
// The only test-time change is one line appended to main.js in flight (exposes `world` and `input`).
// Same setup as tools/browser-play.mjs, then:  node tools/browser-autoplay.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { KINDS } from "../src/zones.js";
// Every animal counts as met, so first-meeting fact cards don't pause these checks;
// tools/browser-learn.mjs checks the cards.
const MET_ALL = `try { localStorage.setItem("little-fish-met-v1", ${JSON.stringify(JSON.stringify(KINDS))}); } catch {}`;

const OUT = process.env.OUT || "screenshots";
const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const W = 1024, H = 700;
const LEVEL = process.env.LEVEL || "little";
mkdirSync(OUT, { recursive: true });

// A fresh browser context so the game's service worker cannot serve main.js from cache.
const version = await (await fetch(`${CDP}/json/version`)).json();
const bws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise(r => bws.onopen = r);
let bid = 1; const bpending = new Map();
bws.onmessage = ({ data }) => { const m = JSON.parse(data); if (m.id && bpending.has(m.id)) { bpending.get(m.id)(m); bpending.delete(m.id); } };
const bsend = (method, params = {}) => new Promise(res => { const id = bid++; bpending.set(id, res); bws.send(JSON.stringify({ id, method, params })); });
const { result: { browserContextId } } = await bsend("Target.createBrowserContext");
const { result: { targetId } } = await bsend("Target.createTarget", { url: "about:blank", browserContextId });
const list = await (await fetch(`${CDP}/json/list`)).json();
const ws = new WebSocket(list.find(t => t.id === targetId).webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let nextId = 1; const pending = new Map(); const errors = [];
ws.onmessage = async ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Runtime.exceptionThrown") errors.push("EXC " + msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""));
  if (msg.method === "Fetch.requestPaused") {
    const { requestId, request } = msg.params;
    if (!request.url.endsWith("/src/main.js")) return send("Fetch.continueRequest", { requestId });
    const { result } = await send("Fetch.getResponseBody", { requestId });
    const body = Buffer.from(result.body, "base64").toString() + "\nwindow.__game = { world, input };\n";
    await send("Fetch.fulfillRequest", { requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "text/javascript" }], body: Buffer.from(body).toString("base64") });
  }
};
const send = (method, params = {}) => new Promise(resolve => { const id = nextId++; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expr, awaitPromise = false) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise })).result?.result?.value;
let n = 0;
async function shot(name) {
  const { result } = await send("Page.captureScreenshot", { format: "png" });
  const file = `${OUT}/auto-${String(++n).padStart(2, "0")}-${name}.png`;
  writeFileSync(file, Buffer.from(result.data, "base64")); console.log("shot", file);
}
const hud = () => evaluate(`JSON.stringify({ stage: __game.world.stage, name: document.querySelector("#stage-name").textContent, bites: __game.world.bites, hearts: __game.world.hearts, phase: __game.world.phase, t: __game.world.time.toFixed(1), overlay: document.querySelector("#overlay").hidden ? "" : ["intro","paused","won","gameover","mission"].find(p => !document.getElementById(p).hidden) })`);

await send("Page.enable"); await send("Runtime.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Response" }] });
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", { source: MET_ALL });
await send("Page.navigate", { url: GAME });
await sleep(1500);
console.log("hooked:", await evaluate(`typeof window.__game`));
await evaluate(`document.querySelector("#level-${LEVEL}").click()`);
await evaluate(`document.querySelector("#start-button").click()`);
await sleep(300);
// Every swim picks a mission; this one eats tuna, which the controller below knows how to do.
await evaluate(`Object.assign(__game.world.mission, { id: "hunt", need: ${LEVEL === "big" ? 4 : 2} })`);
console.log("level:", await evaluate("__game.world.level"));
// Controller: every 40 ms, steer toward the nearest edible creature (not a schoolmate of your own kind)
// and away from nearby predators,
// written into the real pointer input: a finger held 200 px ahead of the fish on screen.
await evaluate(`(() => {
  const g = window.__game;
  window.__ctl = setInterval(() => {
    const w = g.world; if (w.phase !== "playing") { g.input.pointer = null; return; }
    let dx = 0, dy = 0, food = null, best = Infinity;
    for (const c of w.creatures) {
      const ox = c.x - w.player.x, oy = c.y - w.player.y, d = Math.hypot(ox, oy) || 1;
      if (c.tier > w.stage + 1) { if (d < 260) { dx -= ox / d * (260 - d) / 40; dy -= oy / d * (260 - d) / 40; } }
      else if (c.tier <= w.stage && d < best) { best = d; food = c; }
    }
    if (food) { const ox = food.x - w.player.x, oy = food.y - w.player.y, d = Math.hypot(ox, oy) || 1; dx += ox / d; dy += oy / d; }
    const len = Math.hypot(dx, dy) || 1;
    g.input.pointer = { x: ${W / 2} + w.player.x - w.camera.x + dx / len * 200, y: ${H / 2} + w.player.y - w.camera.y + dy / len * 200 };
  }, 40);
})()`);
let last = await hud(); const t0 = Date.now(); const events = [];
await shot("stage0");
while (Date.now() - t0 < 150000) {
  await sleep(250);
  const now = await hud(); if (now === last) continue;
  const a = JSON.parse(last), b = JSON.parse(now); const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (b.stage !== a.stage) { events.push(`${secs}s grew -> ${b.name} (game clock ${b.t}s)`); await sleep(150); await shot("stage" + b.stage); }
  if (b.hearts !== a.hearts) events.push(`${secs}s hurt -> hearts ${b.hearts}`);
  if (b.overlay && b.overlay !== a.overlay) { events.push(`${secs}s overlay ${b.overlay}`); await shot("overlay-" + b.overlay); }
  last = now;
  if (b.overlay === "mission") { await sleep(400); await evaluate(`document.querySelector("#mission-go").click()`); }
  if (b.overlay === "won" || b.overlay === "gameover") break;
}
console.log("events\n" + events.join("\n")); console.log("final", last);
console.log("console errors:", errors.length ? errors.join("\n") : "none");
await send("Page.close"); ws.close(); bws.close();
