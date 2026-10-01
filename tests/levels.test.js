import test from "node:test";
import assert from "node:assert/strict";
import { allDone, currentLevel, isOpen, LEVELS_KEY, levelDoneLine, levelNumber, loadBeaten, nextLevel,
  OCEAN_DONE_LINE, saveBeaten } from "../src/levels.js";
import { ZONE_IDS } from "../src/zones.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries(saved));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("the places are levels in order: the reef first, the bottom last", () => {
  assert.deepEqual(ZONE_IDS, ["reef", "open", "deep", "bottom"]);
  assert.equal(levelNumber("reef"), 1);
  assert.equal(levelNumber("bottom"), 4);
  assert.equal(nextLevel("reef"), "open");
  assert.equal(nextLevel("bottom"), null);
});

test("a new swimmer has only the reef open; finishing a level opens the next", () => {
  const beaten = new Set();
  assert.ok(isOpen(beaten, "reef"));
  assert.ok(!isOpen(beaten, "open"));
  assert.ok(!isOpen(beaten, "deep"));
  assert.equal(currentLevel(beaten), "reef");
  beaten.add("reef");
  assert.ok(isOpen(beaten, "open"));
  assert.ok(!isOpen(beaten, "deep"));
  assert.equal(currentLevel(beaten), "open");
  assert.ok(!allDone(beaten));
  for (const id of ZONE_IDS) beaten.add(id);
  assert.ok(isOpen(beaten, "bottom"));
  assert.equal(currentLevel(beaten), "bottom", "once every level is done, the last one is current");
  assert.ok(allDone(beaten));
});

test("finished levels are saved per player and read back; junk reads as nothing finished", () => {
  const storage = memoryStorage();
  assert.deepEqual(loadBeaten(storage), new Set());
  assert.ok(saveBeaten(new Set(["reef", "open"]), storage));
  assert.deepEqual(loadBeaten(storage), new Set(["reef", "open"]));
  assert.deepEqual(loadBeaten(memoryStorage({ [LEVELS_KEY]: "{bad" })), new Set());
  assert.deepEqual(loadBeaten(memoryStorage({ [LEVELS_KEY]: JSON.stringify(["reef", "moon"]) })), new Set(["reef"]));
  assert.deepEqual(loadBeaten({ getItem() { throw new Error("private mode"); } }), new Set());
});

test("the voice names the place finished and the next one; the last level ends the ocean", () => {
  assert.equal(levelDoneLine("reef"), "Level complete! You finished the coral reef. Next stop: the open ocean!");
  assert.equal(levelDoneLine("open"), "Level complete! You finished the open ocean. Next stop: the deep!");
  assert.equal(levelDoneLine("deep"), "Level complete! You finished the deep. Next stop: the bottom!");
  assert.equal(levelDoneLine("bottom"), OCEAN_DONE_LINE);
});
