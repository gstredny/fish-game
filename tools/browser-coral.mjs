// Coral and the question first, on a sideways phone (844x390 touch) and a computer (1280x800): a
// mission about an animal never met asks "What animal is this?" before the mission names it, a bump
// by a never-met hunter opens its card instead of the Watch out! line, finishing a level earns a coral,
// and Your coral shows the shelf from the win screen and the start screen. Same server/Chrome setup
// as browser-play.mjs.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { WHAT_ANIMAL } from "../src/lines.js";
import { cardSpeech, hurtLine } from "../src/species.js";
import { missionLine } from "../src/missions.js";
import { ZONES } from "../src/zones.js";
const CLIP_TEXT = Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL("../voice/manifest.json", import.meta.url))).clips)
  .map(([text, file]) => [file, text]));

const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const OUT = process.env.OUT || "screenshots/coral";
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
await waitFor("Boolean(window.__game)", "game loaded");
await sleep(300);

// 1. A bump by a hunter never met (the lionfish, on the reef) opens its card: no line names it first.
await tapButton("#start-button");
await sleep(500);
await evaluate(`(() => { const w = __game.world; w.invulnerable = 0; w.friends = []; w.creatures = [{ ...w.player, tier: 2, wobble: 0 }]; })()`);
await waitFor("__game.world.phase === 'meeting'", "the stranger's card");
await sleep(200);
assert.equal(await text("#card-kicker"), WHAT_ANIMAL);
assert.equal(await text("#card-name"), "?");
assert.equal(await evaluate("__game.world.hearts"), 2);
let said = await spoken();
assert.equal(said.at(-1), WHAT_ANIMAL);
assert.ok(!said.includes(hurtLine(ZONES.reef, "lionfish", 0)), "no Watch out! line before the question");
await shot("01-bump-asks-first");
await tapButton("#card-close");
assert.equal(await text("#card-name"), "Lionfish");
assert.equal((await spoken()).at(-1), cardSpeech("lionfish"));
await tapButton("#card-close");
assert.equal(await evaluate("__game.world.phase"), "playing");

// 2. The mission's animal (the reef shark, never met) is asked about before the mission names it.
await evaluate(`(() => { const w = __game.world;
  w.mission = { id: "hunt", zone: "reef", need: 2, have: 0, active: false, done: false, seen: new Set(), target: null, wait: 0 };
  Object.assign(w, { stage: 3, bites: 99, friends: [], creatures: [{ ...w.player, tier: 3, wobble: 0 }] }); })()`);
await waitFor("__game.world.phase === 'mission'", "the biggest form");
await sleep(200);
assert.ok(await visible("#card") && !(await visible("#mission")), "the card comes before the mission card");
assert.equal(await text("#card-kicker"), WHAT_ANIMAL);
said = await spoken();
assert.ok(!said.some(line => /reef shark/i.test(line)), "nothing has said reef shark yet");
assert.ok(await fitsOnScreen("#card-close") && await fitsOnScreen("#card-photo"), "the question card fits");
await shot("02-mission-asks-first");
await tapButton("#card-close");
assert.equal(await text("#card-name"), "Reef shark");
assert.equal(await text("#card-close"), "Your mission");
await tapButton("#card-close");
assert.ok(await visible("#mission"), "then the mission card");
assert.equal(await text("#mission-goal"), "Eat 2 reef sharks");
assert.equal((await spoken()).at(-1), missionLine(await evaluate("({ id: 'hunt', zone: 'reef', need: 2 })")));
await shot("03-then-the-mission");

// 3. Finishing the level earns a coral; the shelf shows it from the win screen and the start screen.
await tapButton("#mission-go");
await evaluate("__game.world.creatures = [0, 1].map(() => ({ ...__game.world.player, tier: 4, wobble: 0 }))");
await waitFor("__game.world.phase === 'won'", "the swim ends");
await sleep(300);
assert.match(await text("#won-text"), /earned a coral/);
assert.ok(await fitsOnScreen("#won-coral-button"), "See your coral fits");
await tapButton("#won-coral-button");
assert.ok(await visible("#coral"), "the coral shelf");
assert.equal(await text("#coral-count"), "1 of 4 corals · one for every level you finish");
assert.equal(await evaluate("document.querySelectorAll('.coral-tile').length"), 4);
assert.equal(await evaluate("document.querySelectorAll('.coral-tile canvas').length"), 1, "one coral painted");
assert.equal(await evaluate("document.querySelectorAll('.coral-tile.locked').length"), 3);
assert.ok(await fitsOnScreen("#coral-close"), "Back fits");
await shot("04-coral-shelf-phone");
await tapButton("#coral-close");
assert.ok(await visible("#won"));
await tapButton("#won-home-button");
assert.ok(await fitsOnScreen("#intro-coral-button"), "Your coral fits on the start screen");
await tapButton("#intro-coral-button");
assert.ok(await visible("#coral"));
await tapButton("#coral-close");
assert.ok(await visible("#intro"));

// 4. A computer screen, with every coral earned.
await evaluate(`localStorage.setItem('little-fish-levels-v1', '["reef","open","deep","bottom"]')`);
await size(1280, 800, false);
await reload();
await tapButton("#intro-coral-button");
assert.equal(await evaluate("document.querySelectorAll('.coral-tile canvas').length"), 4);
await shot("05-coral-shelf-computer");

assert.deepEqual(errors, [], "no page errors");
console.log("coral check passed");
page.close();
await browser.send("Target.closeTarget", { targetId });
browser.close();
