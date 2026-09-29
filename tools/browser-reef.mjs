// Real-browser reef smoke test. Same server/Chrome setup as browser-play.mjs.
// A test-only response hook exposes game state; the last pre-shark bite is a fixture.
// Planting, reload, restart, and swimming use real mouse/touch/keyboard input.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const GAME = process.env.GAME || "http://127.0.0.1:8778/";
const CDP = process.env.CDP || "http://127.0.0.1:9444";
const OUT = process.env.OUT || "screenshots/reef";
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
mkdirSync(OUT, { recursive: true });

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const promise = pending.get(message.id);
      if (!promise) return;
      pending.delete(message.id);
      message.error ? promise.reject(new Error(message.error.message)) : promise.resolve(message.result);
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

async function checkReef(browser, mode) {
  const width = mode === "phone" ? 844 : 1024, height = mode === "phone" ? 390 : 700;
  const { browserContextId } = await browser.send("Target.createBrowserContext");
  let page;
  try {
    const { targetId } = await browser.send("Target.createTarget", { url: "about:blank", browserContextId });
    const targets = await (await fetch(`${CDP}/json/list`)).json();
    page = await connect(targets.find(target => target.id === targetId).webSocketDebuggerUrl);
    const errors = [];
    page.on("Runtime.exceptionThrown", error => errors.push(error.exceptionDetails.text));
    page.on("Fetch.requestPaused", async ({ requestId }) => {
      try {
        const result = await page.send("Fetch.getResponseBody", { requestId });
        const source = result.base64Encoded ? Buffer.from(result.body, "base64").toString() : result.body;
        const body = Buffer.from(source + "\nwindow.__reefGame = { world, input };\n").toString("base64");
        await page.send("Fetch.fulfillRequest", { requestId, responseCode: 200,
          responseHeaders: [{ name: "Content-Type", value: "text/javascript" }], body });
      } catch (error) { errors.push(error.message); }
    });
    const evaluate = async expression => {
      const result = await page.send("Runtime.evaluate", { expression, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async expression => {
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) { if (await evaluate(expression)) return; await sleep(50); }
      throw new Error(`Timed out: ${expression}`);
    };
    const shot = async name => {
      const result = await page.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(`${OUT}/${mode}-${name}.png`, Buffer.from(result.data, "base64"));
    };
    const click = async (x, y) => {
      if (mode === "phone") {
        await page.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
        await page.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      } else {
        await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
        await page.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
        await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
      }
    };
    const clickButton = async selector => {
      const point = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      await click(point.x, point.y);
    };
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    await page.send("Network.setBypassServiceWorker", { bypass: true });
    await page.send("Fetch.enable", { patterns: [{ urlPattern: "*/src/main.js", requestStage: "Response" }] });
    await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: mode === "phone" });
    if (mode === "phone") await page.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    await page.send("Page.navigate", { url: GAME });
    await waitFor("Boolean(window.__reefGame)");
    await clickButton("#start-button");
    await evaluate(`(() => { const w = __reefGame.world; w.stage = 3; w.bites = 8; w.creatures = [{ ...w.player, tier: 3, wobble: 0 }]; __reefGame.input.pointer = null; })()`);
    await waitFor("!document.querySelector('#won').hidden");
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('little-fish-reef-v1')).pending"), 1);
    await shot("earned");
    await clickButton("#win-plant-button");
    await waitFor("__reefGame.world.phase === 'planting'");
    await shot("planting");
    await click(width / 2 + 80, height / 2 + 80);
    await waitFor("__reefGame.world.reef.corals.length === 1");
    const saved = await evaluate("JSON.parse(localStorage.getItem('little-fish-reef-v1'))");
    assert.equal(saved.pending, 0);
    await shot("planted");
    await page.send("Page.reload", { ignoreCache: true });
    await waitFor("Boolean(window.__reefGame) && !document.querySelector('#intro').hidden");
    await clickButton("#start-button");
    assert.equal(await evaluate("__reefGame.world.stage"), 0);
    assert.deepEqual(await evaluate("__reefGame.world.reef"), saved);
    await evaluate("__reefGame.input.pointer = null; __reefGame.world.creatures = []");
    await shot("reloaded-sprat");
    // Swim from the spawn beside coral into its shelter, with actual keyboard input.
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await waitFor("__reefGame.world.sheltered");
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    const meetShark = "(() => { const w = __reefGame.world; w.invulnerable = 0; w.creatures = [{ ...w.player, tier: 4, wobble: 0 }]; })()";
    await evaluate(meetShark);
    await sleep(100);
    assert.equal(await evaluate("__reefGame.world.hearts"), 3);
    assert.equal(await evaluate("document.querySelector('#reef-status').textContent"), "Safe in your coral");
    await shot("sheltered");
    await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await waitFor("!__reefGame.world.sheltered");
    await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await evaluate(meetShark);
    await waitFor("__reefGame.world.hearts === 2");
    await shot("outside-shelter");
    await clickButton("#pause-button");
    await page.send("Emulation.setDeviceMetricsOverride", { width: height, height: width, deviceScaleFactor: 1, mobile: mode === "phone" });
    await shot("turned");
    assert.deepEqual(errors, []);
    console.log(`${mode}: earn → plant → reload → sprat → shelter → leave: PASS; console errors: 0; screenshots: 7`);
  } finally {
    page?.close();
    await browser.send("Target.disposeBrowserContext", { browserContextId });
  }
}

const version = await (await fetch(`${CDP}/json/version`, { signal: AbortSignal.timeout(5000) })).json();
const browser = await connect(version.webSocketDebuggerUrl);
try {
  await checkReef(browser, "desktop");
  await checkReef(browser, "phone");
} finally { browser.close(); }
