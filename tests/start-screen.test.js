import test from "node:test";
import assert from "node:assert/strict";
import { DRAWINGS_KEY } from "../src/gallery.js";
import { openGame } from "./app-fixture.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries(saved));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

const CHROME_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1";
const SAFARI_26 = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const SAFARI_18 = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

test("Dive in is always the big button; drawing is the smaller one", async () => {
  for (const [saved, drawText] of [[{}, "Draw my fish"], [{ [DRAWINGS_KEY]: '["data:image/png;base64,AAAA"]' }, "Draw a new fish"]]) {
    const app = await openGame(memoryStorage(saved));
    try {
      assert.equal(app.nodes.get("start-button").className, "primary-button");
      assert.match(app.nodes.get("start-button").innerHTML, /^Dive in/);
      assert.equal(app.nodes.get("draw-button").className, "secondary-button");
      assert.match(app.nodes.get("draw-button").innerHTML, new RegExp(`^${drawText}`));
    } finally { app.close(); }
  }
});

test("an iPhone browser gets an arrow at Share and the steps as pictures", async () => {
  const cases = [
    { navigator: { userAgent: CHROME_IPHONE }, guide: true, more: false, safari: false },
    { navigator: { userAgent: SAFARI_26 }, guide: true, more: true, safari: true },
    { navigator: { userAgent: SAFARI_18 }, guide: true, more: false, safari: true },
    { navigator: { userAgent: SAFARI_26, standalone: true }, guide: false },
    { navigator: { userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/141.0" }, guide: false }
  ];
  for (const expected of cases) {
    const app = await openGame(memoryStorage(), { navigator: expected.navigator });
    try {
      const guide = app.nodes.get("install-guide");
      assert.equal(!guide.hidden, expected.guide, `guide for ${expected.navigator.userAgent}`);
      if (!expected.guide) continue;
      assert.equal(!app.nodes.get("install-more").hidden, expected.more, "Safari 26 shows ••• first");
      assert.equal(guide.classList.contains("safari"), expected.safari);
      assert.doesNotMatch(String(app.nodes.get("intro-foot").innerHTML ?? ""), /Share/, "no written instructions");
    } finally { app.close(); }
  }
});
