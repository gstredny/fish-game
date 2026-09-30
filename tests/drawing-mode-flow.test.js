import test from "node:test";
import assert from "node:assert/strict";
import { DRAWINGS_KEY } from "../src/gallery.js";
import { openGame } from "./app-fixture.js";

test("saving a newly painted fish selects it even after choosing real-fish mode", async () => {
  const data = new Map([[DRAWINGS_KEY, '["data:image/png;base64,AAAA"]'], ["little-fish-plain-v1", "on"]]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  class Image { constructor() { this.width = 300; this.height = 220; } async decode() {} }
  let app = await openGame(storage, { Image });
  try {
    for (let tick = 0; tick < 24; tick++) await Promise.resolve();
    const createElement = document.createElement;
    document.createElement = tag => {
      const node = createElement(tag);
      if (tag === "canvas") node.toDataURL = () => "data:image/png;base64,BBBB";
      return node;
    };
    app.click("draw-button");
    const sketch = app.nodes.get("sketch");
    sketch.getBoundingClientRect = () => ({ left: 0, top: 0, width: 840, height: 540 });
    sketch.emit("pointerdown", { pointerId: 1, clientX: 420, clientY: 270 });
    sketch.emit("pointerup", { pointerId: 1 });
    app.click("swim-button");
    for (let tick = 0; tick < 24; tick++) await Promise.resolve();
    assert.equal(app.world.phase, "playing");
    assert.equal(JSON.parse(storage.getItem(DRAWINGS_KEY))[0], "data:image/png;base64,BBBB");
    assert.equal(app.nodes.get("stage-art").hidden, false, "Swim from the drawing screen selects the new fish");
    assert.equal(storage.getItem("little-fish-plain-v1"), "off", "drawing mode is remembered");
    app.close();
    app = await openGame(storage, { Image });
    for (let tick = 0; tick < 24; tick++) await Promise.resolve();
    assert.equal(app.nodes.get("intro-art").hidden, false, "the drawing is still selected after reloading");
  } finally { app.close(); }
});
