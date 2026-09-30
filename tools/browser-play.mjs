// Real-input browser smoke test. Drives the game in headless Chrome over CDP with keyboard (desktop)
// or sideways touch (phone), then saves screenshots and prints HUD changes. No dependencies (Node 22+).
//
//   python3 -m http.server 8778 --bind 127.0.0.1 &
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//     --remote-debugging-port=9444 --user-data-dir=/tmp/fish-chrome about:blank &
//   node tools/browser-play.mjs desktop     # or: phone
import { mkdirSync, writeFileSync } from "node:fs";
import { KINDS } from "../src/zones.js";
// Every animal counts as met, so first-meeting fact cards don't pause these checks;
// tools/browser-learn.mjs checks the cards.
const MET_ALL = `try { localStorage.setItem("little-fish-met-v1", ${JSON.stringify(JSON.stringify(KINDS))}); } catch {}`;

const MODE = process.argv[2] || "desktop";
const OUT = process.env.OUT || "screenshots";
const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const sleep = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let nextId = 1;
const pending = new Map();
const errors = [];
ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === "Runtime.exceptionThrown") errors.push("EXC " + msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""));
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) errors.push(msg.params.type + " " + msg.params.args.map(a => a.value ?? a.description).join(" "));
  if (msg.method === "Log.entryAdded" && ["error", "warning"].includes(msg.params.entry.level)) errors.push("LOG " + msg.params.entry.text);
};
const send = (method, params = {}) => new Promise(resolve => { const id = nextId++; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expr => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
let shotCount = 0;
async function shot(name) {
  const { result } = await send("Page.captureScreenshot", { format: "png" });
  const file = `${OUT}/${MODE}-${String(++shotCount).padStart(2, "0")}-${name}.png`;
  writeFileSync(file, Buffer.from(result.data, "base64"));
  console.log("shot", file);
}
const KEYS = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Enter: 13, p: 80, Escape: 27 };
const keyDown = key => send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key.length === 1 ? "Key" + key.toUpperCase() : key, windowsVirtualKeyCode: KEYS[key], text: key === "Enter" ? "\r" : key.length === 1 ? key : undefined });
const keyUp = key => send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key.length === 1 ? "Key" + key.toUpperCase() : key, windowsVirtualKeyCode: KEYS[key] });
const tap = async (key, hold = 60) => { await keyDown(key); await sleep(hold); await keyUp(key); };
const touch = (type, points) => send("Input.dispatchTouchEvent", { type, touchPoints: points });
const centerOf = async selector => { const r = JSON.parse(await evaluate(`JSON.stringify(document.querySelector("${selector}").getBoundingClientRect())`)); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
const hud = () => evaluate(`JSON.stringify({
  stage: document.querySelector("#stage-name").textContent,
  growth: document.querySelector("#growth-text").textContent,
  hearts: document.querySelector("#hearts").textContent,
  toast: document.querySelector("#toast").classList.contains("visible") ? document.querySelector("#toast").textContent : "",
  overlay: document.querySelector("#overlay").hidden ? "" : ["intro","paused","won","gameover","mission"].find(p => !document.getElementById(p).hidden),
  size: innerWidth + "x" + innerHeight
})`);

await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
if (MODE === "phone") {
  await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 3, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
} else {
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
}
await send("Page.addScriptToEvaluateOnNewDocument", { source: MET_ALL });
await send("Page.navigate", { url: GAME });
await sleep(1500);
console.log("intro", await hud());
await shot("intro");

if (MODE === "desktop") {
  await tap("Enter");
  await sleep(600);
  console.log("started", await hud());
  await shot("playing-start");
  // Swim a box pattern for up to 60 s; log every HUD change; screenshot on growth / hurt / panel.
  const pattern = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
  let last = await hud(); const t0 = Date.now(); let step = 0; const events = [];
  while (Date.now() - t0 < 60000) {
    const key = pattern[step++ % pattern.length];
    await keyDown(key);
    for (let i = 0; i < 6; i++) {
      await sleep(400);
      const now = await hud();
      if (now !== last) {
        const a = JSON.parse(last), b = JSON.parse(now);
        const secs = ((Date.now() - t0) / 1000).toFixed(1);
        if (b.stage !== a.stage) { events.push(`${secs}s GREW -> ${b.stage}`); await shot("grew-" + b.stage.replace(/\W+/g, "-")); }
        else if (b.hearts !== a.hearts) { events.push(`${secs}s HURT -> ${b.hearts}`); await shot("hurt"); }
        else if (b.toast && b.toast !== a.toast) events.push(`${secs}s toast "${b.toast}"`);
        if (b.overlay) { events.push(`${secs}s overlay ${b.overlay}`); await shot("overlay-" + b.overlay); }
        last = now;
        if (b.overlay === "gameover" || b.overlay === "won" || b.overlay === "mission") break;
      }
    }
    await keyUp(key);
    if (JSON.parse(last).overlay) break;
  }
  console.log("events\n" + events.join("\n"));
  console.log("final", last);
  if (!JSON.parse(last).overlay) {
    await tap("p"); await sleep(300); console.log("paused", await hud()); await shot("paused");
    await tap("p"); await sleep(300); console.log("resumed", await hud());
  }
} else {
  const start = await centerOf("#start-button");
  await touch("touchStart", [start]); await touch("touchEnd", []);
  await sleep(600);
  console.log("after-tap-start", await hud());
  await shot("playing-start");
  // Phones steer with the arrow pad: hold the right arrow, then slide the thumb to the up arrow.
  const pad = await centerOf("#pad");
  await touch("touchStart", [{ x: pad.x + 45, y: pad.y }]);
  await sleep(1500); await shot("pad-right");
  await touch("touchMove", [{ x: pad.x, y: pad.y - 45 }]);
  await sleep(1500); await shot("pad-up");
  await touch("touchEnd", []);
  await sleep(400);
  console.log("after-touch", await hud());
  const pause = await centerOf("#pause-button");
  await touch("touchStart", [pause]); await touch("touchEnd", []);
  await sleep(400); console.log("paused", await hud()); await shot("paused");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await sleep(500); await shot("upright-turn-sideways");
}
console.log("console errors:", errors.length ? errors.join("\n") : "none");
await send("Page.close");
ws.close();
