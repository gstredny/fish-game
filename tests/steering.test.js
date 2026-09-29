import test from "node:test";
import assert from "node:assert/strict";
import { createSteering } from "../src/steering.js";
import { padDirection } from "../src/pad.js";
import { createWorld, swim } from "../src/world.js";

function freshInput() {
  return { keys: new Set(), pointer: null };
}

test("lifting a second finger does not stop the first finger's swim", () => {
  const input = freshInput();
  const steer = createSteering(input);
  steer.down({ pointerId: 1, pointerType: "touch", clientX: 100, clientY: 200 });
  steer.down({ pointerId: 2, pointerType: "touch", clientX: 300, clientY: 400 });
  steer.move({ pointerId: 2, pointerType: "touch", clientX: 999, clientY: 999 });
  steer.up({ pointerId: 2, pointerType: "touch" });
  assert.deepEqual(input.pointer, { x: 100, y: 200 });
  steer.move({ pointerId: 1, pointerType: "touch", clientX: 120, clientY: 210 });
  assert.deepEqual(input.pointer, { x: 120, y: 210 });
  steer.up({ pointerId: 1, pointerType: "touch" });
  assert.equal(input.pointer, null);
});

test("a mouse steers on hover and keeps steering after the button lifts", () => {
  const input = freshInput();
  const steer = createSteering(input);
  steer.move({ pointerId: 1, pointerType: "mouse", buttons: 0, clientX: 50, clientY: 60 });
  assert.deepEqual(input.pointer, { x: 50, y: 60 });
  steer.down({ pointerId: 1, pointerType: "mouse", clientX: 50, clientY: 60 });
  steer.up({ pointerId: 1, pointerType: "mouse" });
  assert.deepEqual(input.pointer, { x: 50, y: 60 });
  steer.leave({ pointerId: 1, pointerType: "mouse" });
  assert.equal(input.pointer, null);
});

test("the arrow pad points eight ways and rests in the middle", () => {
  assert.equal(padDirection(3, -4, 75), null);
  assert.deepEqual(padDirection(60, 0, 75), { x: 1, y: 0 });
  assert.deepEqual(padDirection(0, -60, 75), { x: 0, y: -1 });
  assert.deepEqual(padDirection(-60, 5, 75), { x: -1, y: 0 });
  assert.deepEqual(padDirection(0, 60, 75), { x: 0, y: 1 });
  assert.deepEqual(padDirection(40, -40, 75), { x: 1, y: -1 });
  assert.deepEqual(padDirection(-40, 40, 75), { x: -1, y: 1 });
});

test("holding a pad arrow swims the fish that way", () => {
  const world = createWorld(844, 390);
  world.phase = "playing";
  world.creatures = [];
  const start = { ...world.player };
  swim(world, 0.05, { keys: new Set(), pointer: null, pad: { x: -1, y: -1 } }, 844, 390);
  assert.ok(world.player.x < start.x && world.player.y < start.y);
  assert.equal(world.player.direction, -1);
});
