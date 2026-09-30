import test from "node:test";
import assert from "node:assert/strict";
import { DRAWINGS_KEY } from "../src/gallery.js";
import { openGame } from "./app-fixture.js";

test("real-fish mode lets every saved drawing swim among the other fish", async () => {
  class Image { constructor() { this.width = 300; this.height = 220; } async decode() {} }
  for (const count of [1, 2]) {
    const saved = Array.from({ length: count }, (_, i) => `data:image/png;base64,AAAA${i}`);
    const data = new Map([[DRAWINGS_KEY, JSON.stringify(saved)], ["little-fish-plain-v1", "on"]]);
    const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
    const app = await openGame(storage, { Image });
    const random = Math.random;
    let seed = 17;
    try {
      for (let tick = 0; tick < 24; tick++) await Promise.resolve();
      Math.random = () => (seed = seed * 48271 % 2147483647) / 2147483647;
      app.click("start-button");
      assert.equal(app.nodes.get("stage-art").hidden, true);
      Object.assign(app.world, { stage: 1, invulnerable: 999 });
      const drawingsSeen = new Set();
      for (let frame = 1; frame <= 20; frame++) {
        app.world.creatures = [];
        app.frame(frame * 16);
        for (const creature of app.world.creatures) if (creature.art !== null) drawingsSeen.add(creature.art);
      }
      assert.deepEqual([...drawingsSeen].sort(), count === 1 ? [0] : [0, 1], "even the last saved drawing can spawn");
    } finally { Math.random = random; app.close(); }
  }
});
