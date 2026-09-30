import test from "node:test";
import assert from "node:assert/strict";
import { MET_KEY } from "../src/ocean-book.js";
import { REEF_KEY } from "../src/reef-save.js";
import { openGame } from "./app-fixture.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries(saved));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

const pickZone = (app, id) => app.nodes.get("zone-pick").emit("click", { target: { closest: () => ({ dataset: { zone: id } }) } });
const plankton = world => ({ x: world.player.x + 60, y: world.player.y, tier: 0, direction: 1, wobble: 0 });

function bookCount(app) {
  app.click("intro-book-button");
  const count = app.nodes.get("book-count").textContent;
  app.click("book-close");
  return count;
}

test("two players on one phone keep their own Ocean book, reef, level and place", async () => {
  // A save from before there were players: it stays Player 1's.
  const before = {
    [MET_KEY]: JSON.stringify(["sardine", "tuna"]),
    [REEF_KEY]: JSON.stringify({ pending: 1, corals: [{ x: 10, y: 20 }] }),
    "little-fish-level-v1": "big",
    "little-fish-zone-v1": "deep"
  };
  const storage = memoryStorage(before);
  let app = await openGame(storage);
  try {
    assert.match(bookCount(app), /^You've met 2 of/);
    assert.equal(app.world.zone.id, "deep");

    app.click("player-2");
    assert.match(bookCount(app), /^You've met 0 of/, "Player 2 starts with an empty Ocean book");
    assert.equal(app.world.zone.id, "open", "and the first place to swim");
    assert.deepEqual(app.world.reef, { pending: 0, corals: [] }, "and no coral");
    pickZone(app, "reef");
    app.click("start-button");
    assert.equal(app.world.level, "little", "and Little swimmer");
    Object.assign(app.world, { creatures: [plankton(app.world)], friends: [], time: 5.1 });
    app.frame(16);
    assert.equal(app.world.phase, "meeting", "Player 2 meets plankton for the first time");
    app.click("card-close");
    for (const [key, value] of Object.entries(before)) assert.equal(storage.getItem(key), value, `Player 1's ${key} is untouched`);
    app.close();

    app = await openGame(storage);
    assert.equal(app.world.zone.id, "reef", "the phone remembers Player 2 played last");
    assert.match(bookCount(app), /^You've met 1 of/);
    app.click("player-1");
    assert.match(bookCount(app), /^You've met 2 of/);
    assert.equal(app.world.zone.id, "deep");
    assert.deepEqual(app.world.reef.corals, [{ x: 10, y: 20 }]);
    app.click("start-button");
    assert.equal(app.world.level, "big");
  } finally { app.close(); }
});
