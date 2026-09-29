import test from "node:test";
import assert from "node:assert/strict";
import { createWorld, swim } from "../src/world.js";

const width = 844, height = 390;

function swimming() {
  const world = createWorld(width, height);
  world.phase = "playing";
  world.invulnerable = 99;
  world.creatures = [];
  return world;
}

function holdFinger(world, x, y, seconds) {
  const input = { keys: new Set(), pointer: { x, y } };
  for (let time = 0; time < seconds; time += 0.05) swim(world, 0.05, input, width, height);
}

test("a held finger pulls the fish across the screen while the ocean stays put", () => {
  const world = swimming();
  holdFinger(world, width / 2 + 150, height / 2 + 40, 1.5);
  assert.ok(Math.hypot(world.player.x - 150, world.player.y - 40) < 1, `fish at ${world.player.x}, ${world.player.y}`);
  assert.deepEqual(world.camera, { x: 0, y: 0 });
});

test("near the edge the ocean scrolls so the fish can keep exploring", () => {
  const world = swimming();
  holdFinger(world, width - 10, height / 2, 4);
  assert.ok(world.camera.x > 0, "the view followed");
  assert.ok(world.player.x - world.camera.x <= width / 4 + 0.001, "the fish stays well on screen");
  assert.ok(world.player.x > width / 2, "the fish kept swimming past where the finger first pointed");
});
