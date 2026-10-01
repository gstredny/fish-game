import test from "node:test";
import assert from "node:assert/strict";
import { ZONES } from "../src/zones.js";
import { OPEN_SEA, openGame } from "./app-fixture.js";

test("Home and zone previews do not make the next swim repeat its previous mission", async () => {
  const random = Math.random;
  Math.random = () => 0;
  try {
    for (const zone of Object.keys(ZONES)) {
      for (const exit of ["won", "paused", "gameover"]) {
        const data = new Map([...Object.entries(OPEN_SEA), ["little-fish-zone-v1", zone]]);
        const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
        const app = await openGame(storage);
        try {
          app.click("start-button");
          const previous = app.world.mission.id;
          if (exit === "won") {
            Object.assign(app.world, { stage: 3, bites: 99, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
            app.frame(16);
            app.click("mission-go");
            const tier = previous === "hunt" ? 4 : 3;
            app.world.creatures = Array.from({ length: app.world.mission.need }, () => ({ ...app.world.player, tier, wobble: 0 }));
            app.frame(32);
          } else if (exit === "gameover") {
            Object.assign(app.world, { hearts: 1, invulnerable: 0, friends: [], creatures: [{ ...app.world.player, tier: 2, wobble: 0 }] });
            app.frame(16);
          } else app.click("pause-button");
          assert.equal(app.world.phase, exit);
          app.click(`${exit}-home-button`);
          const pick = id => app.nodes.get("zone-pick").emit("click", { target: { closest: () => ({ dataset: { zone: id } }) } });
          if (exit === "paused") { pick(zone); pick(zone); }
          if (exit === "gameover") { pick(zone === "open" ? "deep" : "open"); pick(zone); }
          app.click("start-button");
          assert.notEqual(app.world.mission.id, previous, `${zone}: ${exit} and preview clicks must not lose the last swim`);
        } finally { app.close(); }
      }
    }
  } finally { Math.random = random; }
});
