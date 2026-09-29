// Learning check on a sideways phone (844x390 touch): the Ocean book starts empty, a first meeting
// pauses the swim for a spoken photo card, a sea-bed animal is met by swimming low, a known animal
// gets a name tag, every photo loads, and the card and book fit short screens. Also saves a
// "zoo" screenshot of every animal drawing. Same server/Chrome setup as browser-play.mjs.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { cardSpeech, growLine, KINDS, SPECIES } from "../src/species.js";
import { PHOTOS } from "../src/photos.js";
import { SEA_FRIENDS } from "../src/rules.js";

const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const OUT = process.env.OUT || "screenshots/learn";
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
  const r = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await touch("touchStart", r.x, r.y);
  await touch("touchEnd");
};
const fitsOnScreen = selector => evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; })()`);
const visible = selector => evaluate(`!document.querySelector(${JSON.stringify(selector)}).hidden`);
const spoken = () => evaluate("window.__spoken.filter(line => line.trim())"); // minus the silent wake-up line
const reload = async () => {
  await page.send("Page.reload", { ignoreCache: true });
  await waitFor("Boolean(window.__game) && !document.querySelector('#intro').hidden", "game loaded");
  await sleep(200);
};

await page.send("Page.enable"); await page.send("Runtime.enable");
await page.send("Network.setBypassServiceWorker", { bypass: true });
await page.send("Fetch.enable", { patterns: [{ urlPattern: "*/src/main.js", requestStage: "Response" }] });
await page.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
// Record every line the game speaks.
await page.send("Page.addScriptToEvaluateOnNewDocument", { source:
  "window.__spoken = []; if (window.speechSynthesis) speechSynthesis.speak = line => window.__spoken.push(line.text);" });
await size(844, 390);
await page.send("Page.navigate", { url: GAME });
await waitFor("Boolean(window.__game)", "game loaded");
await sleep(300);

// 1. Every photo in the book loads.
const photoWidths = await evaluate(`Promise.all(${JSON.stringify(KINDS.map(kind => PHOTOS[kind].file))}.map(src =>
  new Promise(done => { const image = new Image(); image.onload = () => done(image.naturalWidth); image.onerror = () => done(0); image.src = src; })))`);
console.log("1. photo widths:", photoWidths.join(" "));
assert.ok(photoWidths.every(width => width > 0), "every animal photo should load");

// 2. An empty Ocean book on a new device.
assert.ok(await fitsOnScreen("#intro-book-button"), "the Ocean book button fits on the start screen");
await tapButton("#intro-book-button");
await sleep(300);
assert.equal(await evaluate("document.querySelector('#book-count').textContent"), `You've met 0 of ${KINDS.length} ocean animals`);
assert.equal(await evaluate("document.querySelectorAll('.book-tile.locked').length"), KINDS.length);
await shot("01-empty-book");
await tapButton("#book-close");
await sleep(200);

// 3. Dive in: the first line says what a sardine eats. Then plankton close by opens its card.
await tapButton("#start-button");
await sleep(300);
assert.deepEqual(await spoken(), [growLine(0)]);
await evaluate(`(() => { const w = __game.world; w.invulnerable = 999; w.time = 5.2; w.friends = [];
  w.creatures = [{ x: w.player.x + 70, y: w.player.y, tier: 0, direction: 1, wobble: 0 }]; })()`);
await waitFor("__game.world.phase === 'meeting'", "the plankton card opens");
await sleep(400);
assert.equal(await evaluate("document.querySelector('#card-name').textContent"), "Plankton");
assert.ok(await evaluate("document.querySelector('#card-photo').naturalWidth > 0"), "the card photo loaded");
assert.equal((await spoken()).at(-1), cardSpeech("plankton"));
assert.ok(await fitsOnScreen("#card-close") && await fitsOnScreen("#card-photo"), "the card fits 844x390");
await shot("02-first-meeting-card");
const frozen = await evaluate("JSON.stringify(__game.world.player)");
await sleep(500);
assert.equal(await evaluate("JSON.stringify(__game.world.player)"), frozen, "the swim waits while the card is open");
await tapButton("#card-close");
await sleep(300);
assert.equal(await evaluate("__game.world.phase"), "playing");
assert.equal(await evaluate("!document.querySelector('#pad').hidden"), true, "the arrow pad comes back");

// 4. A sea-bed animal: swim low beside a crab.
await evaluate(`(() => { const w = __game.world; w.nextCardAt = 0; w.creatures = [];
  w.player.y = w.camera.y + innerHeight * 0.24;
  w.friends = [{ kind: "crab", size: 18, speed: 0, floor: true, x: w.player.x + 40, y: 0, direction: 1, wobble: 0 }]; })()`);
await waitFor("__game.world.phase === 'meeting'", "the crab card opens");
await sleep(300);
assert.equal(await evaluate("document.querySelector('#card-name').textContent"), "Crab");
await shot("03-crab-card");
await tapButton("#card-close");
await sleep(300);

// 5. An animal met before: a name tag and one short line.
await evaluate(`(() => { const w = __game.world; w.greeted.clear(); w.friends = [];
  w.creatures = [{ x: w.player.x + 90, y: w.player.y - 30, tier: 0, direction: 1, wobble: 0 }]; })()`);
await waitFor("__game.world.labels.length === 1", "a name tag");
assert.equal(await evaluate("__game.world.phase"), "playing", "no card for an animal met before");
assert.match((await spoken()).at(-1), /^Plankton! /);
await shot("04-name-tag");

// 6. The book now holds the two animals met; its cards replay.
await tapButton("#pause-button");
await sleep(200);
await tapButton("#paused-book-button");
await sleep(300);
assert.equal(await evaluate("document.querySelector('#book-count').textContent"), `You've met 2 of ${KINDS.length} ocean animals`);
await shot("05-book-two-met");
await tapButton('.book-tile[data-kind="crab"]');
await sleep(300);
assert.equal(await evaluate("document.querySelector('#card-kicker').textContent"), "Ocean book");
assert.equal((await spoken()).at(-1), cardSpeech("crab"));
await tapButton("#card-close");
await sleep(200);
assert.ok(await visible("#book"), "back to the book");
await tapButton("#book-close");
await sleep(200);
assert.ok(await visible("#paused"), "back to the pause screen");

// 7. Card and book fit sideways phones with the browser bars showing, even for the wordiest card.
const WORDIEST = KINDS.map(kind => [kind, [...SPECIES[kind].facts, SPECIES[kind].eats, SPECIES[kind].eatenBy].join(" ").length])
  .sort((first, second) => second[1] - first[1])[0][0];
await evaluate(`localStorage.setItem("little-fish-met-v1", JSON.stringify(["plankton", "crab", "${WORDIEST}"]))`);
for (const [width, height] of [[844, 390], [844, 340], [844, 330], [667, 375], [568, 320]]) {
  await size(width, height);
  await reload();
  await tapButton("#intro-book-button");
  await sleep(300);
  const bookFits = await fitsOnScreen("#book-close") && await fitsOnScreen("#book-title") &&
    await fitsOnScreen('.book-tile[data-kind="clownfish"]');
  await shot(`06-book-${width}x${height}`);
  await tapButton(`.book-tile[data-kind="${WORDIEST}"]`);
  await sleep(400);
  const cardFits = await fitsOnScreen("#card-close") && await fitsOnScreen("#card-hear") && await fitsOnScreen("#card-name");
  await shot(`07-card-${width}x${height}`);
  console.log(`7. ${width}x${height}: book fits: ${bookFits}; card fits: ${cardFits}`);
  assert.ok(bookFits && cardFits, `${width}x${height}: the book or card does not fit`);
  await tapButton("#card-close");
  await sleep(200);
  await tapButton("#book-close");
  await sleep(200);
  assert.ok(await fitsOnScreen("#start-button") && await fitsOnScreen("#intro-book-button") &&
    await fitsOnScreen("#intro-voice-button"), `${width}x${height}: start buttons fit`);
}

// 8. The zoo: every animal drawing, as a squid (so snacks, schoolmates and hunters all show).
for (const [label, width, height, mobile] of [["desktop", 1280, 800, false], ["phone", 844, 390, true]]) {
  await size(width, height, mobile);
  await reload();
  await evaluate(`localStorage.setItem("little-fish-met-v1", ${JSON.stringify(JSON.stringify(KINDS))})`);
  await reload();
  await evaluate("document.querySelector('#start-button').click()");
  await sleep(200);
  await evaluate(`(() => { const w = __game.world; w.stage = 2; w.invulnerable = 999; w.player.direction = 1;
    const x = w.player.x, y = w.player.y, s = innerWidth / 1280;
    w.creatures = [0, 1, 2, 3, 4, 5].map((tier, i) => ({ x: x + (-470 + i * 190) * s, y: y - 150 * s + (i % 2) * 60 * s, tier, direction: 1, wobble: i }));
    w.friends = [
      { kind: "turtle", size: 34, speed: 0, floor: false, x: x - 380 * s, y: y + 110 * s, direction: 1, wobble: 0 },
      { kind: "parrotfish", size: 24, speed: 0, floor: false, x: x + 330 * s, y: y + 110 * s, direction: -1, wobble: 1 },
      ...${JSON.stringify(SEA_FRIENDS.filter(friend => friend.floor))}.map((friend, i) =>
        ({ ...friend, speed: 0, x: x + (-440 + i * 220) * s, y: 0, direction: 1, wobble: i }))]; })()`);
  await evaluate("__game.world.phase = 'paused'");
  await sleep(300);
  await evaluate("document.querySelector('#overlay').hidden = true");
  await sleep(200);
  await shot(`08-zoo-${label}`);
}
for (let stage = 0; stage < 5; stage++) {
  await evaluate(`(() => { const w = __game.world; w.stage = ${stage}; })()`);
  await sleep(150);
  await shot(`09-player-stage-${stage}`);
}

console.log("errors:", errors.length ? errors : "none");
assert.deepEqual(errors, []);
console.log("learn: book → first card → sea bed → name tag → book replay → fits → zoo: PASS");
page.close();
browser.close();
