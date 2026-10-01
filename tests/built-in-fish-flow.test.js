import test from "node:test";
import assert from "node:assert/strict";
import { SPECIES } from "../src/species.js";
import { FORMS, goalFor } from "../src/rules.js";
import { ZONE_IDS, ZONES, formKind } from "../src/zones.js";
import { OPEN_SEA, openGame } from "./app-fixture.js";

test("old drawings and mode preferences never replace named animals across growth, Home or reload", async () => {
  for (const mode of ["on", "off"]) {
    const data = new Map([
      ["little-fish-drawings", '["data:image/png;base64,AAAA","data:image/png;base64,BBBB"]'],
      ["little-fish-plain-v1", mode],
      ...Object.entries(OPEN_SEA)
    ]);
    const reads = [];
    const storage = { getItem: key => { reads.push(key); return data.get(key) ?? null; },
      setItem: (key, value) => data.set(key, value) };
    let app = await openGame(storage);
    try {
      let frame = 0;
      for (const id of ZONE_IDS) {
        app.nodes.get("zone-pick").emit("click", { target: { closest: () => ({ dataset: { zone: id } }) } });
        for (const removed of ["draw-button", "plain-button", "draw", "sketch", "intro-art", "stage-art", "won-art"]) {
          assert.equal(app.nodes.has(removed), false, `${removed} is removed`);
        }
        app.click("start-button");
        assert.equal(app.world.phase, "playing", "Dive in starts immediately");
        app.world.nextCardAt = Infinity;
        app.world.invulnerable = 999;
        for (let stage = 0; stage < FORMS.length; stage++) {
          assert.equal(app.world.stage, stage);
          const name = SPECIES[formKind(ZONES[id], stage)].name;
          assert.equal(app.nodes.get("stage-name").textContent, stage ? name : `Little ${name.toLowerCase()}`);
          assert.ok(app.world.creatures.every(creature => creature.art == null), "NPCs use species artwork");
          if (stage === FORMS.length - 1) break;
          app.world.bites = goalFor(app.world.level, stage) - 1;
          app.world.creatures = [{ ...app.world.player, tier: stage, direction: 1, wobble: 0 }];
          app.world.friends = [];
          app.frame(++frame * 16);
        }
        app.click("mission-go");
        app.click("pause-button");
        app.click("paused-home-button");
        assert.equal(app.world.phase, "ready");
      }
      app.close();
      app = await openGame(storage);
      app.click("start-button");
      assert.equal(app.world.phase, "playing");
      assert.equal(app.world.zone.id, ZONE_IDS.at(-1), "the chosen zone survives reload");
      assert.ok(!reads.includes("little-fish-drawings"), "saved artwork is never loaded");
      assert.ok(!reads.includes("little-fish-plain-v1"), "the retired mode is never loaded");
    } finally { app.close(); }
  }
});
