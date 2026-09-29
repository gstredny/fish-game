import test from "node:test";
import assert from "node:assert/strict";
import { canEat, nextGrowth } from "../src/rules.js";
import { createWorld, swim } from "../src/world.js";

const idleInput = { keys: new Set(), pointer: null };

test("a fish can eat its own tier and smaller, but not larger", () => {
  assert.equal(canEat(0, 0), true);
  assert.equal(canEat(1, 2), false);
  assert.equal(canEat(4, 4), true);
});

test("growth happens at the snack goal", () => {
  assert.deepEqual(nextGrowth(0, 5), { stage: 0, bites: 5, grew: false });
  assert.deepEqual(nextGrowth(0, 6), { stage: 1, bites: 0, grew: true });
  assert.deepEqual(nextGrowth(4, 99), { stage: 4, bites: 99, grew: false });
});

test("eating nearby plankton grows a sprat", () => {
  const world = createWorld(390, 844);
  world.phase = "playing";
  world.bites = 5;
  world.creatures = [{ x: 0, y: 0, tier: 0, direction: 1, wobble: 0 }];
  swim(world, 0.016, idleInput, 390, 844);
  assert.equal(world.stage, 1);
  assert.equal(world.bites, 0);
  assert.equal(world.events[0].type, "grow");
});

test("a larger fish costs one heart and grants a brief safe period", () => {
  const world = createWorld(390, 844);
  world.phase = "playing";
  world.creatures = [
    { x: 0, y: 0, tier: 1, direction: 1, wobble: 0 },
    { x: 0, y: 0, tier: 1, direction: 1, wobble: 0 }
  ];
  swim(world, 0.016, idleInput, 390, 844);
  assert.equal(world.hearts, 2);
  assert.ok(world.invulnerable > 0);
});

test("losing all three hearts ends the swim", () => {
  const world = createWorld(390, 844);
  world.phase = "playing";
  for (let hit = 0; hit < 3; hit++) {
    world.invulnerable = 0;
    world.creatures = [{ x: 0, y: 0, tier: 1, direction: 1, wobble: 0 }];
    swim(world, 0.016, idleInput, 390, 844);
  }
  assert.equal(world.hearts, 0);
  assert.equal(world.phase, "gameover");
});

test("keyboard input moves the player", () => {
  const world = createWorld(390, 844);
  world.phase = "playing";
  world.creatures = [];
  swim(world, 0.05, { keys: new Set(["ArrowRight"]), pointer: null }, 390, 844);
  assert.ok(world.player.x > 0);
  assert.equal(world.player.direction, 1);
});

test("replacement fish swim into the visible ocean", () => {
  const world = createWorld(390, 844);
  world.phase = "playing";
  world.creatures = [];
  const originalRandom = Math.random;
  Math.random = () => 0.75;
  try {
    swim(world, 0.016, idleInput, 390, 844);
  } finally {
    Math.random = originalRandom;
  }
  assert.ok(world.creatures.length > 0);
  assert.ok(world.creatures.every(creature => Math.abs(creature.y - world.player.y) < 844 / 2));
  assert.ok(world.creatures.every(creature =>
    Math.sign(creature.x - world.player.x) === -creature.direction));
});

test("growing into a shark wins while keeping the ocean explorable", () => {
  const world = createWorld(390, 844);
  world.phase = "playing";
  world.stage = 3;
  world.bites = 8;
  world.creatures = [{ x: 0, y: 0, tier: 3, direction: 1, wobble: 0 }];
  swim(world, 0.016, idleInput, 390, 844);
  assert.equal(world.stage, 4);
  assert.equal(world.phase, "won");
  world.phase = "playing";
  world.creatures = [{ x: 0, y: 0, tier: 4, direction: 1, wobble: 0 }];
  swim(world, 0.016, idleInput, 390, 844);
  assert.equal(world.hearts, 3);
  assert.equal(world.creatures.some(creature => creature.tier === 4 && creature.x === 0), false);
});
