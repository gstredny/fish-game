// Zones check on a sideways phone (844x390 touch): the start screen asks where to swim and every
// place fits, picking the reef is remembered and fills the swim with reef animals and the reef's
// water, the HUD and mission card name the reef's forms, Home leads back to the start screen, the
// Ocean book is grouped by place, and a saved drawing can be swapped for a real fish. Also checks
// the start screen and book fit the shortest phones. Same server/Chrome setup as browser-play.mjs.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { growLine } from "../src/species.js";
import { KINDS, ZONE_IDS, ZONES, zoneKinds } from "../src/zones.js";
import { DRAWINGS_KEY } from "../src/gallery.js";
const CLIP_TEXT = Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL("../voice/manifest.json", import.meta.url))).clips)
  .map(([text, file]) => [file, text]));

const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const OUT = process.env.OUT || "screenshots/zones";
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
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
const backdropLoaded = file => evaluate(`new Promise(done => { const image = new Image(); image.onload = () => done(true); image.onerror = () => done(false); image.src = ${JSON.stringify(file)}; })`);

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

// 1. The start screen asks where to swim; every place fits; a new device sees what is new.
for (const id of ZONE_IDS) assert.ok(await fitsOnScreen(`.zone-button[data-zone="${id}"]`), `the ${id} button fits`);
assert.ok(await fitsOnScreen("#start-button") && await fitsOnScreen("#level-big") && await fitsOnScreen("#intro-book-button"), "start buttons fit");
assert.equal(await evaluate("document.querySelector('.zone-button[aria-pressed=\"true\"]').dataset.zone"), "open");
assert.equal(await evaluate("document.querySelectorAll('.zone-new').length"), ZONE_IDS.length, "every place has new animals for a new device");
for (const zone of Object.values(ZONES)) assert.ok(await backdropLoaded(zone.backdrop), `${zone.backdrop} loads`);
await shot("01-start-screen");

// 2. Picking the reef is remembered, and its water shows behind the start screen.
await tapButton('.zone-button[data-zone="reef"]');
await sleep(300);
assert.equal(await evaluate("localStorage.getItem('little-fish-zone-v1')"), "reef");
assert.equal(await evaluate("__game.world.zone.id"), "reef");
await sleep(600);
await shot("02-reef-picked");
await reload();
assert.equal(await evaluate("document.querySelector('.zone-button[aria-pressed=\"true\"]').dataset.zone"), "reef", "remembered");

// 3. A reef swim: the welcome line, reef forms in the HUD, reef animals only, the mission card.
await tapButton("#start-button");
await sleep(500);
assert.deepEqual(await spoken(), [growLine(ZONES.reef, 0)]);
assert.equal(await text("#stage-name"), "Little damselfish");
const kinds = await evaluate("[...new Set(__game.world.friends.map(friend => friend.kind))]");
for (const kind of kinds) assert.ok([...ZONES.reef.friends, ZONES.reef.giant].includes(kind), `${kind} does not live on the reef`);
await evaluate("__game.world.invulnerable = 999");
await sleep(1200);
await shot("03-reef-swim");
for (const [stage, name] of [[1, "Lionfish"], [2, "Grouper"], [3, "Reef shark"]]) {
  await evaluate(`(() => { const w = __game.world; w.stage = ${stage}; w.events.push({ type: "grow" }); })()`);
  await sleep(150);
  assert.equal(await text("#stage-name"), name);
}
await shot("04-reef-shark");
await evaluate(`(() => { const w = __game.world; w.mission.id = "hunt"; w.mission.need = 2; w.stage = 3; w.bites = 99;
  w.creatures = [{ ...w.player, tier: 3, direction: 1, wobble: 0 }]; })()`);
await waitFor("__game.world.phase === 'mission'", "the mission card opens");
await sleep(400);
assert.equal(await text("#mission-kicker"), "You're a tiger shark!");
assert.equal(await text("#mission-goal"), "Eat 2 reef sharks");
assert.ok(await fitsOnScreen("#mission-go") && await fitsOnScreen("#mission-goal"), "the mission card fits");
await shot("05-reef-mission");
await tapButton("#mission-go");
await sleep(200);
assert.equal(await text("#stage-name"), "Tiger shark");

// 4. Home from the pause screen goes back to the start screen.
await tapButton("#pause-button");
await sleep(300);
assert.ok(await fitsOnScreen("#paused-home-button") && await fitsOnScreen("#paused-book-button"), "Home and the book fit on the pause screen");
await shot("06-pause-home");
await tapButton("#paused-home-button");
await sleep(300);
assert.ok(await visible("#intro"), "Home shows the start screen");
assert.equal(await evaluate("__game.world.phase"), "ready");
assert.ok(!await visible("#hud"));

// 5. The Ocean book is grouped by place.
await tapButton("#intro-book-button");
await sleep(300);
assert.equal(await text("#book-count"), `You've met 0 of ${KINDS.length} ocean animals`);
assert.equal(await evaluate("document.querySelectorAll('.book-zone').length"), ZONE_IDS.length);
for (const zone of Object.values(ZONES)) {
  assert.equal(await evaluate(`document.querySelectorAll('.book-zone:nth-child(${ZONE_IDS.indexOf(zone.id) + 1}) .book-tile').length`),
    zoneKinds(zone).length, `${zone.id}'s section shows its animals`);
}
await shot("07-book-by-zone");
await tapButton("#book-close");
await sleep(200);

// 6. With a drawing saved, "Swim as a real fish" swaps the drawing out, and back.
await evaluate(`localStorage.setItem(${JSON.stringify(DRAWINGS_KEY)}, JSON.stringify([${JSON.stringify(PIXEL)}]))`);
await reload();
await waitFor("!document.querySelector('#plain-button').hidden", "the fish switch shows");
assert.ok(await fitsOnScreen("#plain-button"), "the fish switch fits");
assert.ok(await visible("#intro-art"));
await shot("08-drawing-saved");
await tapButton("#plain-button");
await sleep(200);
assert.equal(await text("#plain-button"), "Swim as my drawing");
assert.ok(!await visible("#intro-art") && await visible("#intro-mark"), "the start screen shows the built-in fish");
assert.equal(await evaluate("localStorage.getItem('little-fish-plain-v1')"), "on");
await shot("09-real-fish");
await tapButton("#start-button");
await sleep(300);
assert.ok(!await visible("#stage-art"), "the HUD shows the built-in fish too");
await tapButton("#pause-button");
await sleep(200);
await tapButton("#paused-home-button");
await sleep(200);
await tapButton("#plain-button");
await sleep(200);
assert.ok(await visible("#intro-art"), "and back to the drawing");
await evaluate(`localStorage.removeItem(${JSON.stringify(DRAWINGS_KEY)})`);

// 7. The start screen and the book fit the shortest sideways phones.
for (const [width, height] of [[844, 340], [667, 375], [568, 320]]) {
  await size(width, height);
  await reload();
  for (const id of ZONE_IDS) assert.ok(await fitsOnScreen(`.zone-button[data-zone="${id}"]`), `${width}x${height}: the ${id} button fits`);
  assert.ok(await fitsOnScreen("#start-button") && await fitsOnScreen("#draw-button") && await fitsOnScreen("#level-big") &&
    await fitsOnScreen("#intro-book-button") && await fitsOnScreen("#intro-voice-button"), `${width}x${height}: start buttons fit`);
  await shot(`10-start-${width}x${height}`);
  await tapButton("#intro-book-button");
  await sleep(300);
  assert.ok(await fitsOnScreen("#book-close") && await fitsOnScreen("#book-title"), `${width}x${height}: the book fits`);
  await shot(`11-book-${width}x${height}`);
  await tapButton("#book-close");
  await sleep(200);
}

console.log("errors:", errors.length ? errors : "none");
assert.equal(errors.length, 0, "no page errors");
page.close();
browser.close();
console.log("browser-zones: OK");
