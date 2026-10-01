// Levels and save spots check on a sideways phone (844x390 touch) and a computer (1280x800): a new
// swimmer sees three spots and only the reef open, a locked place says so, a name can be typed,
// finishing a mission says Level complete! and Next swims the next place, the last level shows the
// end, the spot shows Finished!, and Erase asks first. Same server/Chrome setup as browser-play.mjs.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { levelDoneLine, LOCKED_LINE, OCEAN_DONE_LINE } from "../src/levels.js";
import { ZONE_IDS } from "../src/zones.js";
const CLIP_TEXT = Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL("../voice/manifest.json", import.meta.url))).clips)
  .map(([text, file]) => [file, text]));

const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const OUT = process.env.OUT || "screenshots/levels";
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
// Grows straight to the biggest form and finishes a hunt mission there.
const winSwim = async zone => {
  await evaluate(`(() => { const w = __game.world;
    w.mission = { id: "hunt", zone: ${JSON.stringify(zone)}, need: 2, have: 0, active: false, done: false, seen: new Set(), target: null, wait: 0 };
    Object.assign(w, { stage: 3, bites: 99, friends: [], creatures: [{ ...w.player, tier: 3, wobble: 0 }] }); })()`);
  await waitFor("__game.world.phase === 'mission'", "the mission card");
  // A mission animal never met is asked about first: "What animal is this?", "Tell me!", "Your mission".
  if (await visible("#card")) {
    await tapButton("#card-close");
    await tapButton("#card-close");
  }
  await tapButton("#mission-go");
  await evaluate("__game.world.creatures = [0, 1].map(() => ({ ...__game.world.player, tier: 4, wobble: 0 }))");
  await waitFor("['won', 'meeting'].includes(__game.world.phase) || !document.querySelector('#finished').hidden", "the swim ends");
  await sleep(300);
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

// 1. A new swimmer: three spots, only the reef open, everything fits.
await shot("01-new-swimmer");
for (const slot of ["1", "2", "3"]) assert.ok(await fitsOnScreen(`.player-button[data-player="${slot}"]`), `spot ${slot} fits`);
for (const id of ZONE_IDS) assert.ok(await fitsOnScreen(`.zone-button[data-zone="${id}"]`), `the ${id} button fits`);
for (const id of ["start-button", "level-big", "player-rename", "intro-book-button"]) assert.ok(await fitsOnScreen(`#${id}`), `#${id} fits`);
assert.equal(await text('.player-button[data-player="1"] .player-level'), "New swimmer");
assert.equal(await evaluate("document.querySelector('.zone-button[aria-pressed=\"true\"]').dataset.zone"), "reef");
assert.equal(await evaluate("document.querySelectorAll('.zone-button.locked').length"), ZONE_IDS.length - 1, "only the reef is open");
assert.equal(await evaluate("document.querySelectorAll('.zone-new').length"), 1, "only the open place counts new animals");

// 2. A locked place says so and is not picked.
await tapButton('.zone-button[data-zone="deep"]');
await sleep(300);
assert.equal(await evaluate("__game.world.zone.id"), "reef");
assert.deepEqual(await spoken(), [LOCKED_LINE]);

// 3. Typing a name.
await tapButton("#player-rename");
assert.ok(await visible("#name-box") && await fitsOnScreen("#name-input") && await fitsOnScreen("#name-save"), "the name box fits");
await evaluate("document.querySelector('#name-input').focus()");
await page.send("Input.insertText", { text: "Dora" });
await shot("02-name-box");
await tapButton("#name-save");
assert.equal(await text('.player-button[data-player="1"] .player-name'), "Dora");
assert.equal(await text('.player-button[data-player="1"] .player-level'), "Level 1 of 4");
assert.equal(await evaluate("localStorage.getItem('little-fish-name-v1')"), "Dora");

// 4. Finishing the reef: Level complete!, the next level is the big button, and it swims there.
await tapButton("#start-button");
await sleep(500);
await winSwim("reef");
assert.ok(await visible("#won"), "the win screen");
assert.equal(await text("#won-title"), "Level complete!");
assert.match(await text("#won-text"), /You finished the coral reef and earned a coral! Next stop: the open ocean\./);
assert.equal(await evaluate("document.querySelector('#won-next-button').className"), "primary-button");
assert.ok(await fitsOnScreen("#won-next-button") && await fitsOnScreen("#won-home-button") && await fitsOnScreen("#won-coral-button"), "win buttons fit");
assert.equal((await spoken()).at(-1), levelDoneLine("reef"));
assert.equal(await evaluate("localStorage.getItem('little-fish-levels-v1')"), '["reef"]');
await shot("03-level-complete");
await tapButton("#won-next-button");
await sleep(500);
assert.equal(await evaluate("__game.world.zone.id"), "open");
assert.equal(await evaluate("__game.world.phase"), "playing");
assert.equal(await text("#stage-name"), "Little sardine");
await tapButton("#pause-button");
await tapButton("#paused-home-button");
assert.equal(await text('.player-button[data-player="1"] .player-level'), "Level 2 of 4");
assert.equal(await evaluate("document.querySelectorAll('.zone-button.locked').length"), 2, "the open ocean is open now");
await shot("04-level-two");

// 5. The last level ends the ocean; the spot says Finished!
await evaluate(`localStorage.setItem('little-fish-levels-v1', '["reef","open","deep"]'); localStorage.setItem('little-fish-zone-v1', 'bottom')`);
await reload();
assert.equal(await evaluate("__game.world.zone.id"), "bottom");
await tapButton("#start-button");
await sleep(500);
await winSwim("bottom");
assert.ok(await visible("#finished"), "the end screen");
assert.ok(await fitsOnScreen("#finished-home-button") && await fitsOnScreen("#finished-book-button"), "end buttons fit");
assert.equal((await spoken()).at(-1), OCEAN_DONE_LINE);
await shot("05-the-end");
await tapButton("#finished-home-button");
assert.equal(await text('.player-button[data-player="1"] .player-level'), "Finished! ★");
assert.equal(await evaluate("document.querySelectorAll('.zone-button.locked').length"), 0, "every place is open");

// 6. Erase asks first; Keep keeps.
await tapButton("#player-erase");
assert.ok(await visible("#erase-ask") && await fitsOnScreen("#erase-yes"), "the erase question fits");
assert.match(await text("#erase-text"), /^Really erase Dora\?/);
await shot("06-erase-ask");
await tapButton("#erase-no");
assert.equal(await text('.player-button[data-player="1"] .player-name'), "Dora");
await tapButton("#player-erase");
await tapButton("#erase-yes");
assert.equal(await text('.player-button[data-player="1"] .player-name'), "Player 1");
assert.equal(await text('.player-button[data-player="1"] .player-level'), "New swimmer");
assert.equal(await evaluate("localStorage.getItem('little-fish-levels-v1')"), null);

// 7. A computer screen.
await size(1280, 800, false);
await reload();
for (const slot of ["1", "2", "3"]) assert.ok(await fitsOnScreen(`.player-button[data-player="${slot}"]`), `spot ${slot} fits on a computer`);
assert.ok(await fitsOnScreen("#start-button") && await fitsOnScreen("#player-rename"), "start buttons fit on a computer");
await shot("07-computer");

// 8. The shortest phones.
await size(568, 320);
await reload();
for (const slot of ["1", "2", "3"]) assert.ok(await fitsOnScreen(`.player-button[data-player="${slot}"]`), `spot ${slot} fits on a short phone`);
assert.ok(await fitsOnScreen("#start-button"), "Dive in fits on a short phone");
await shot("08-short-phone");

assert.deepEqual(errors, [], "no page errors");
console.log("levels check passed");
page.close();
await browser.send("Target.closeTarget", { targetId });
browser.close();
