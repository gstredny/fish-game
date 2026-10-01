// Keep your size, on a sideways phone (844x390 touch) and a computer (1280x800): losing all hearts as a
// lionfish says you keep your size, Try again starts as a lionfish with three hearts, and a reload keeps it.
// Same server/Chrome setup as browser-play.mjs (launch Chrome with --mute-audio).
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
const CLIP_TEXT = Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL("../voice/manifest.json", import.meta.url))).clips)
  .map(([text, file]) => [file, text]));

const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const OUT = process.env.OUT || "screenshots/keep-size";
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
  const result = await page.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression, what = expression) => {
  for (let wait = 0; wait < 100; wait++) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${what}`);
};
const shot = async name => {
  const result = await page.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(result.data, "base64"));
  console.log("  shot", `${OUT}/${name}.png`);
};
const size = (width, height, mobile = true) => page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile });
const touch = (type, x, y) => page.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
const tapButton = async selector => {
  const r = await evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); node.scrollIntoView({ block: "center" });
    const r = node.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await touch("touchStart", r.x, r.y);
  await touch("touchEnd");
  await sleep(150);
};
const fitsOnScreen = selector => evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; })()`);
const visible = selector => evaluate(`!document.querySelector(${JSON.stringify(selector)}).hidden`);
const text = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent`);
const spoken = async () => (await evaluate("window.__spoken.filter(line => line.trim())")).map(line => CLIP_TEXT[line] ?? line);
const reload = async () => {
  await page.send("Page.reload", { ignoreCache: true });
  await waitFor("Boolean(window.__game) && !document.querySelector('#intro').hidden", "game loaded");
  await sleep(200);
};
await page.send("Page.enable"); await page.send("Runtime.enable");
await page.send("Network.setBypassServiceWorker", { bypass: true });
await page.send("Fetch.enable", { patterns: [{ urlPattern: "*/src/main.js", requestStage: "Response" }] });
await page.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await page.send("Page.addScriptToEvaluateOnNewDocument", { source:
  `window.__spoken = []; if (window.speechSynthesis) speechSynthesis.speak = line => window.__spoken.push(line.text);
  HTMLMediaElement.prototype.play = function () {
    if (!this.src.startsWith("data:")) {
      window.__spoken.push(this.src.split("/voice/").pop());
      setTimeout(() => this.dispatchEvent(new Event("ended")), 60);
    }
    return Promise.resolve();
  };` });
await size(844, 390);
await page.send("Page.navigate", { url: GAME });

const reefMet = JSON.stringify(["plankton", "damselfish", "lionfish", "grouper", "reefshark", "tigershark", "orca"]);
for (const [name, width, height, mobile] of [["phone", 844, 390, true], ["computer", 1280, 800, false]]) {
  await size(width, height, mobile);
  await waitFor("Boolean(window.__game)", "game loaded");
  await evaluate(`localStorage.clear(); localStorage.setItem("little-fish-met-v1", '${reefMet}')`);
  await reload();
  await tapButton("#start-button");
  await sleep(300);
  await evaluate(`(() => { const w = __game.world; w.stage = 1; w.hearts = 1; w.invulnerable = 0; w.friends = [];
    w.creatures = [{ ...w.player, tier: 3, wobble: 0 }]; })()`);
  await waitFor("!document.querySelector('#gameover').hidden", "the game-over screen");
  await sleep(300);
  assert.equal(await text("#gameover-text"), "You keep your size. You'll start again as a lionfish.");
  for (const selector of ["#gameover-text", "#restart-button", "#gameover-home-button"]) {
    assert.ok(await fitsOnScreen(selector), `${selector} fits`);
  }
  await shot(`01-gameover-${name}`);
  await tapButton("#restart-button");
  await sleep(300);
  assert.equal(await evaluate("__game.world.stage"), 1);
  assert.equal(await evaluate("__game.world.hearts"), 3);
  assert.equal(await text("#stage-name"), "Lionfish");
  await shot(`02-try-again-${name}`);
  await reload();
  await tapButton("#start-button");
  await sleep(300);
  assert.equal(await text("#stage-name"), "Lionfish", "a reload keeps the size");
}

assert.deepEqual(errors, [], "no page errors");
console.log("keep-size check passed");
page.close();
await browser.send("Target.closeTarget", { targetId });
browser.close();
