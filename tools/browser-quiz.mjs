// Pick the answer, on a sideways phone (844x390 and 568x320 touch) and a computer (1280x800): a new
// animal's card shows three names to pick from; the right one earns a star and, when the card closes,
// one size bigger (a damselfish becomes a lionfish); a wrong one shows the right name and no star.
// Same server/Chrome setup as browser-play.mjs (launch Chrome with --mute-audio).
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { WHAT_ANIMAL } from "../src/lines.js";
import { cardSpeech } from "../src/species.js";
const CLIP_TEXT = Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL("../voice/manifest.json", import.meta.url))).clips)
  .map(([text, file]) => [file, text]));

const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const OUT = process.env.OUT || "screenshots/quiz";
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

// A new animal right next to the fish, once the next card may open.
const meet = async tier => {
  await evaluate(`(() => { const w = __game.world; w.friends = []; w.time = Math.max(w.time, w.nextCardAt) + 0.1;
    w.creatures = [{ x: w.player.x + 70, y: w.player.y, tier: ${tier}, direction: 1, wobble: 0 }]; })()`);
  await waitFor("__game.world.phase === 'meeting'", "the new animal's card");
  await sleep(200);
  assert.equal(await text("#card-kicker"), WHAT_ANIMAL);
  assert.equal(await text("#card-name"), "?");
};
const choices = () => evaluate("[...document.querySelectorAll('#card-choices [data-pick]')].map(button => button.dataset.pick)");
const allFit = async selectors => { for (const selector of selectors) assert.ok(await fitsOnScreen(selector), `${selector} fits`); };
const freshSwim = async () => {
  await evaluate("localStorage.clear()");
  await reload();
  await tapButton("#start-button");
  await sleep(400);
};

// 1. Phone: the question, a right pick, and the fish one size bigger.
await waitFor("Boolean(window.__game)", "game loaded");
await freshSwim();
assert.equal(await text("#stage-name"), "Little damselfish");
assert.equal(await text("#stars"), "⭐ 0");
await meet(0);
const offered = await choices();
assert.equal(offered.length, 3);
assert.ok(offered.includes("plankton"));
await allFit(["#card-photo", ...offered.map(kind => `[data-pick="${kind}"]`), "#card-close"]);
await shot("01-question-phone");
await tapButton('[data-pick="plankton"]');
assert.match(await text("#card-kicker"), /^That's right!/);
assert.equal(await text("#card-name"), "Plankton");
assert.ok(!(await visible("#card-choices")));
assert.equal(await text("#stars"), "⭐ 1");
assert.equal((await spoken()).at(-1), cardSpeech("plankton"));
await allFit(["#card-close", "#card-name"]);
await shot("02-right-phone");
await tapButton("#card-close");
await waitFor("__game.world.stage === 1", "one size bigger");
await sleep(300);
assert.equal(await text("#stage-name"), "Lionfish");
await allFit(["#stars", "#hearts"]);
await shot("03-lionfish-phone");

// 2. A wrong pick: the right name, no star, the same size.
await meet(1);
const wrong = (await choices()).find(kind => kind !== "damselfish");
await tapButton(`[data-pick="${wrong}"]`);
assert.equal(await text("#card-kicker"), "Good try!");
assert.equal(await text("#card-name"), "Damselfish");
assert.equal(await text("#stars"), "⭐ 1");
await shot("04-wrong-phone");
await tapButton("#card-close");
await sleep(300);
assert.equal(await evaluate("__game.world.stage"), 1);

// 3. A star lasts across a reload.
await reload();
await tapButton("#start-button");
await sleep(300);
assert.equal(await text("#stars"), "⭐ 1");

// 4. A short phone and a computer: the question and the answer fit.
for (const [name, width, height, mobile] of [["short-phone", 568, 320, true], ["computer", 1280, 800, false]]) {
  await size(width, height, mobile);
  await freshSwim();
  await meet(0);
  await allFit(["#card-photo", ...(await choices()).map(kind => `[data-pick="${kind}"]`), "#card-close"]);
  await shot(`05-question-${name}`);
  await tapButton('[data-pick="plankton"]');
  await allFit(["#card-close", "#card-name"]);
  await shot(`06-right-${name}`);
}

assert.deepEqual(errors, [], "no page errors");
console.log("quiz check passed");
page.close();
await browser.send("Target.closeTarget", { targetId });
browser.close();
