import test from "node:test";
import assert from "node:assert/strict";
import { CORAL_RADIUS, createReef, isSheltered, plantCoral, reefResidents } from "../src/reef.js";
import { loadReef, REEF_KEY, saveReef } from "../src/reef-save.js";
import { createWorld, resetWorld, swim } from "../src/world.js";

const idle = { keys: new Set(), pointer: null };
function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("earn, plant, save, reload, and start a new swim beside the same coral", () => {
  const storage = memoryStorage();
  const world = createWorld(390, 844, loadReef(storage));
  world.phase = "playing";
  world.stage = 3;
  world.bites = 8;
  world.creatures = [{ x: 0, y: 0, tier: 3, direction: 1, wobble: 0 }];
  swim(world, 0.016, idle, 390, 844);
  assert.equal(world.phase, "won");
  assert.equal(world.reef.pending, 1);
  assert.ok(saveReef(world.reef, storage));
  assert.equal(loadReef(storage).pending, 1, "unplanted reward survives reload");
  assert.ok(plantCoral(world.reef, 420, -280));
  assert.ok(saveReef(world.reef, storage));
  const next = createWorld(390, 844, loadReef(storage));
  assert.equal(next.stage, 0);
  assert.deepEqual(next.reef, { pending: 0, corals: [{ x: 420, y: -280 }] });
  assert.equal(next.player.x, 320);
  assert.equal(next.player.y, -280);
  resetWorld(next, 390, 844);
  assert.equal(next.reef.corals.length, 1, "restarting preserves the reef");
  for (const c of next.creatures.filter(c => c.tier > 0)) {
    assert.ok(Math.hypot(c.x - next.player.x, c.y - next.player.y) >= 260);
  }
});

test("one reward per completed swim; another completed swim grows the reef", () => {
  const world = createWorld(390, 844);
  for (let adventure = 1; adventure <= 2; adventure++) {
    world.phase = "playing";
    world.stage = 3;
    world.bites = 8;
    world.creatures = [{ ...world.player, tier: 3, wobble: 0 }];
    swim(world, 0.016, idle, 390, 844);
    assert.equal(world.reef.pending, adventure);
    world.phase = "playing";
    world.creatures = [{ ...world.player, tier: 4, wobble: 0 }];
    swim(world, 0.016, idle, 390, 844);
    assert.equal(world.reef.pending, adventure, "exploring as a shark does not farm rewards");
    resetWorld(world, 390, 844);
  }
});

test("planting requires a reward and room for a separate habitat", () => {
  const reef = createReef();
  assert.equal(plantCoral(reef, 0, 0), false);
  reef.pending = 2;
  assert.ok(plantCoral(reef, 0, 0));
  assert.equal(plantCoral(reef, 20, 0), false);
  assert.equal(reef.pending, 1);
  assert.ok(plantCoral(reef, 200, 0));
});

test("missing, corrupt, and invalid saved data starts a fresh reef", () => {
  const storage = memoryStorage();
  for (const value of [null, "{", "null", '{"pending":-1,"corals":[]}', '{"pending":0,"corals":[null]}', '{"pending":0,"corals":[{"x":"0","y":0}]}']) {
    storage.setItem(REEF_KEY, value);
    assert.deepEqual(loadReef(storage), createReef());
  }
});

test("unavailable storage leaves a playable reef and reports save failure", () => {
  const storage = { getItem() { throw new Error("unavailable"); }, setItem() { throw new Error("full"); } };
  assert.deepEqual(loadReef(storage), createReef());
  const reef = { pending: 1, corals: [] };
  assert.equal(saveReef(reef, storage), false);
  assert.ok(plantCoral(reef, 0, 0));
  assert.equal(reef.corals.length, 1);
});

test("a sprat can enter saved coral, withstand a shark, then leave and take damage", () => {
  const world = createWorld(390, 844, { pending: 0, corals: [{ x: 420, y: -280 }] });
  world.phase = "playing";
  world.creatures = [];
  for (let tick = 0; tick < 12; tick++) swim(world, 0.05, { keys: new Set(["ArrowRight"]), pointer: null }, 390, 844);
  assert.ok(world.sheltered, "swimming into coral grants shelter");
  world.invulnerable = 0;
  world.creatures = [{ ...world.player, tier: 4, wobble: 0 }];
  swim(world, 0.016, idle, 390, 844);
  assert.equal(world.hearts, 3);
  assert.equal(world.invulnerable, 0, "shelter works without start grace");
  assert.equal(world.creatures[0].gone, undefined, "shelter does not consume the shark");
  world.player.x = 420 + CORAL_RADIUS + 20;
  world.creatures = [{ ...world.player, tier: 4, wobble: 0 }];
  swim(world, 0.016, idle, 390, 844);
  assert.equal(world.sheltered, false);
  assert.equal(world.hearts, 2, "leaving shelter restores predator danger immediately");
});

test("only small forms that fit entirely inside the colony get shelter", () => {
  const world = createWorld(390, 844, { pending: 0, corals: [{ x: 0, y: 0 }] });
  world.player.x = 0;
  assert.ok(isSheltered(world));
  world.stage = 1;
  assert.ok(isSheltered(world));
  world.player.x = CORAL_RADIUS - 23 + 1;
  assert.equal(isSheltered(world), false, "body outside the boundary is not hidden");
  world.player.x = 0;
  world.stage = 2;
  assert.equal(isSheltered(world), false, "large forms cannot hide");
});

test("growing too large inside coral ends protection in the same frame", () => {
  const world = createWorld(390, 844, { pending: 0, corals: [{ x: 0, y: 0 }] });
  Object.assign(world, { phase: "playing", stage: 1, bites: 6, invulnerable: 0 });
  world.player.x = 0;
  world.creatures = [
    { x: 0, y: 0, tier: 1, direction: 1, wobble: 0 },
    { x: 0, y: 0, tier: 4, direction: 1, wobble: 0 }
  ];
  swim(world, 0.016, idle, 390, 844);
  assert.equal(world.stage, 2);
  assert.equal(world.sheltered, false);
  assert.equal(world.hearts, 2);
});

test("each colony houses clownfish that retreat from predators and stay through reload", () => {
  const storage = memoryStorage();
  const reef = { pending: 0, corals: [{ x: 200, y: 300 }] };
  saveReef(reef, storage);
  const world = createWorld(390, 844, loadReef(storage));
  world.creatures = [];
  const residents = reefResidents(world, 0);
  assert.equal(residents.length, 3);
  assert.notDeepEqual(reefResidents(world, 1), residents, "resident fish swim");
  const reloaded = createWorld(390, 844, loadReef(storage));
  reloaded.creatures = [];
  assert.deepEqual(reefResidents(reloaded, 0), residents);
  world.creatures = [{ x: 200, y: 300, tier: 4 }];
  const hidden = reefResidents(world, 0);
  assert.ok(hidden.every(fish => fish.tucked && Math.hypot(fish.x - 200, fish.y - 300) < 30));
  world.phase = "playing";
  world.stage = 4;
  world.player = { x: residents[0].x, y: residents[0].y, direction: 1 };
  world.creatures = [];
  swim(world, 0.016, idle, 390, 844);
  assert.equal(world.bites, 0, "reef residents are not snacks");
  assert.equal(reefResidents(world).length, 3);
});
