import test from "node:test";
import assert from "node:assert/strict";
import { REEF_KEY } from "../src/reef-save.js";
import { openGame } from "./app-fixture.js";

function storageWith(reef = { pending: 0, corals: [] }) {
  let value = JSON.stringify(reef);
  return { getItem: () => value, setItem: (key, data) => { assert.equal(key, REEF_KEY); value = data; } };
}

test("the real app saves the mission reward, plants by touch, reloads, and shows shelter", async () => {
  const storage = storageWith();
  let app = await openGame(storage);
  try {
    app.click("start-button");
    Object.assign(app.world.mission, { id: "tuna", need: 2 });
    Object.assign(app.world, { stage: 3, bites: 8,
      creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
    app.frame(16);
    assert.equal(app.world.phase, "mission");
    assert.equal(app.nodes.get("mission").hidden, false);
    assert.equal(app.nodes.get("won").hidden, true, "becoming a shark is not the end any more");
    app.click("mission-go");
    app.world.creatures = [0, 1].map(() => ({ ...app.world.player, tier: 4, wobble: 0 }));
    app.frame(32);
    assert.equal(app.world.phase, "won");
    assert.equal(app.nodes.get("won").hidden, false);
    assert.equal(JSON.parse(storage.getItem(REEF_KEY)).pending, 1);
    app.click("win-plant-button");
    assert.equal(app.world.phase, "planting");
    app.nodes.get("ocean").emit("pointerdown", { clientX: 275, clientY: 502, pointerId: 1, pointerType: "touch" });
    assert.equal(app.world.phase, "won", "after planting, the swim is still over");
    assert.equal(app.nodes.get("won").hidden, false);
    assert.equal(app.nodes.get("win-plant-button").hidden, true, "nothing left to plant");
    assert.equal(app.nodes.get("win-restart-button").className, "primary-button");
    const corals = JSON.parse(storage.getItem(REEF_KEY)).corals;
    assert.equal(corals.length, 1);
    assert.equal(app.input.pointer, null, "planting touch does not steer the shark");
    app.close();
    app = await openGame(storage);
    app.click("start-button");
    assert.equal(app.world.stage, 0);
    assert.deepEqual(app.world.reef.corals, corals);
    Object.assign(app.world.player, corals[0]);
    app.world.invulnerable = 0;
    app.world.creatures = [{ ...app.world.player, tier: 4, wobble: 0 }];
    app.frame(16);
    assert.equal(app.world.hearts, 3);
    assert.equal(app.nodes.get("reef-status").textContent, "Safe in your coral");
  } finally { app.close(); }
});

test("saved unplanted coral can be canceled, then planted with Enter", async () => {
  const storage = storageWith({ pending: 1, corals: [] });
  const app = await openGame(storage);
  try {
    app.click("start-button");
    assert.equal(app.nodes.get("plant-button").hidden, false);
    app.click("plant-button");
    app.key("Escape");
    assert.equal(app.world.phase, "playing");
    assert.equal(app.world.reef.pending, 1);
    app.click("plant-button");
    app.key("Enter");
    assert.equal(app.world.phase, "playing");
    assert.equal(JSON.parse(storage.getItem(REEF_KEY)).corals.length, 1);
    assert.equal(app.nodes.get("cancel-plant-button").hidden, true);
  } finally { app.close(); }
});

test("overlapping placement keeps the reward and the placement controls open", async () => {
  const app = await openGame(storageWith({ pending: 1, corals: [{ x: 0, y: 0 }] }));
  try {
    app.click("start-button");
    app.click("plant-button");
    app.nodes.get("ocean").emit("pointerdown", { clientX: 345, clientY: 422 });
    assert.equal(app.world.phase, "planting");
    assert.equal(app.world.reef.pending, 1);
    assert.equal(app.world.reef.corals.length, 1);
    assert.equal(app.nodes.get("toast").textContent, "Choose a little more space");
    app.click("cancel-plant-button");
    assert.equal(app.world.phase, "playing");
  } finally { app.close(); }
});

test("the app reports when planted coral cannot be saved on this device", async () => {
  const storage = storageWith({ pending: 1, corals: [] });
  storage.setItem = () => { throw new Error("storage full"); };
  const app = await openGame(storage);
  try {
    app.click("start-button");
    app.click("plant-button");
    app.key("Enter");
    assert.equal(app.world.reef.corals.length, 1);
    assert.equal(app.nodes.get("reef-status").textContent, "Reef stays for this visit");
    assert.equal(app.nodes.get("toast").textContent, "Your coral is planted!");
  } finally { app.close(); }
});
