import test from "node:test";
import assert from "node:assert/strict";
import { openGame } from "./app-fixture.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries(saved));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

const CHROME_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1";
const SAFARI_26 = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1";
const SAFARI_18 = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

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
