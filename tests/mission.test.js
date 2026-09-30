import test from "node:test";
import assert from "node:assert/strict";
import { ORCA } from "../src/rules.js";
import { createMission, MISSIONS, missionDoneLine, missionGoal, missionLine, pickMission } from "../src/missions.js";
import { createWorld, swim } from "../src/world.js";

const idle = { keys: new Set(), pointer: null };

// A shark on its mission, alone in the ocean.
function sharkOn(id, level = "little") {
  const world = createWorld(844, 390, undefined, 0, level, id);
  Object.assign(world, { phase: "playing", stage: 4, invulnerable: 0, creatures: [], friends: [] });
  world.mission.active = true;
  return world;
}

test("every swim's mission differs from the last one, and every mission comes up", () => {
  const ids = Object.keys(MISSIONS);
  const seen = new Set();
  let last = null;
  for (let swim = 0; swim < 200; swim++) {
    const next = pickMission(last);
    assert.notEqual(next, last);
    assert.ok(ids.includes(next));
    seen.add(next);
    last = next;
  }
  assert.deepEqual([...seen].sort(), ids.sort());
});

test("missions ask more of a Big swimmer and say what to do", () => {
  const little = createMission("tuna", "little"), big = createMission("tuna", "big");
  assert.ok(big.need > little.need);
  assert.equal(missionGoal(little), "Eat 2 tuna");
  assert.equal(missionLine(little), "You're a great white shark now! Sharks eat tuna. Watch out for orcas! Your mission: eat 2 tuna!");
  assert.equal(missionDoneLine(createMission("whale", "big")), "Mission complete! You found the blue whale, the biggest animal ever!");
});

test("the blue whale comes from ahead with an arrow to it, and meeting it finishes the mission", () => {
  const world = sharkOn("whale");
  // No whale happens to be passing by (a 1 in 20 chance otherwise): this one comes for the mission.
  const random = Math.random;
  Math.random = () => 0.99;
  try { swim(world, 0.016, idle, 844, 390); } finally { Math.random = random; }
  const whale = world.friends.find(friend => friend.kind === "bluewhale");
  assert.ok(whale, "a blue whale swims in for the mission");
  assert.equal(world.mission.target, whale, "the arrow points at it");
  assert.ok(whale.x - world.player.x > 844 / 2, "it starts off screen, ahead of the shark");
  assert.equal(world.phase, "playing");
  world.player.x = whale.x - 100;
  world.player.y = whale.y;
  swim(world, 0.016, idle, 844, 390);
  assert.equal(world.phase, "won");
  assert.equal(world.mission.done, true);
  assert.equal(world.reef.pending, 1);
});

test("the orca chases the shark; staying away long enough finishes the mission, a bump starts it over", () => {
  const world = sharkOn("orca");
  swim(world, 0.016, idle, 844, 390);
  const orca = world.creatures.find(creature => creature.hunt);
  assert.equal(orca?.tier, ORCA, "an orca comes hunting");
  assert.equal(world.mission.target, orca);
  const start = orca.x;
  for (let tick = 0; tick < 10; tick++) swim(world, 0.05, idle, 844, 390);
  assert.ok(orca.x < start - 30, "it swims at the shark");
  assert.ok(world.mission.have > 0.4);

  world.invulnerable = 0;
  Object.assign(orca, { x: world.player.x, y: world.player.y });
  swim(world, 0.016, idle, 844, 390);
  assert.equal(world.hearts, 2);
  assert.ok(world.mission.have < 0.1, "caught: stay away again from the start");
  assert.deepEqual(world.events.filter(event => event.type === "hurt"), [{ type: "hurt", by: "orca" }]);
  swim(world, 0.05, idle, 844, 390);
  assert.equal(world.creatures.some(creature => creature.hunt), false, "a short break after the bump");
  for (let tick = 0; tick < 45; tick++) swim(world, 0.05, idle, 844, 390);
  assert.equal(world.creatures.some(creature => creature.hunt && !creature.gone), true, "then another orca comes");
  world.creatures = world.creatures.filter(creature => !creature.hunt);
  world.mission.wait = 0;
  swim(world, 0.05, idle, 844, 390);
  assert.equal(world.creatures.some(creature => creature.hunt), true, "one that swam off screen comes back too");

  world.invulnerable = 999;
  for (let tick = 0; tick < 240 && world.phase === "playing"; tick++) swim(world, 0.05, idle, 844, 390);
  assert.equal(world.phase, "won", "ten seconds away from the orca");
});

test("meeting sea friends counts each kind once, even ones already met earlier in the swim", () => {
  const world = sharkOn("friends", "big");
  world.greeted.add("turtle");
  const close = kind => ({ kind, size: 30, speed: 0, floor: false, x: world.player.x + 60, y: world.player.y, direction: 1, wobble: 0 });
  world.friends = [close("turtle")];
  swim(world, 0.016, idle, 844, 390);
  assert.equal(world.mission.have, 1);
  world.friends = [close("turtle")];
  swim(world, 0.016, idle, 844, 390);
  assert.equal(world.mission.have, 1, "the same turtle again does not count twice");
  world.creatures = [{ x: world.player.x + 60, y: world.player.y, tier: 5, direction: 1, wobble: 0 }];
  world.friends = [];
  swim(world, 0.016, idle, 844, 390);
  assert.equal(world.mission.have, 1, "a schoolmate shark is not a sea friend");
  for (const kind of ["dolphin", "jellyfish", "manta"]) {
    world.friends = [close(kind)];
    swim(world, 0.016, idle, 844, 390);
  }
  assert.equal(world.phase, "won");
});

test("eating the mission's animal counts; other snacks don't", () => {
  const world = sharkOn("squid");
  world.creatures = [{ ...world.player, tier: 4, direction: 1, wobble: 0 }];
  swim(world, 0.016, idle, 844, 390);
  assert.equal(world.mission.have, 0);
  for (let bite = 1; bite <= 3; bite++) {
    world.creatures = [{ ...world.player, tier: 3, direction: 1, wobble: 0 }];
    swim(world, 0.016, idle, 844, 390);
    assert.equal(world.mission.have, bite);
  }
  assert.equal(world.phase, "won");
  assert.ok(world.events.some(event => event.type === "mission-count"));
});

test("a pufferfish puffs up when you swim close, and slowly goes back down", () => {
  const world = createWorld(844, 390);
  Object.assign(world, { phase: "playing", creatures: [] });
  const puffer = { kind: "pufferfish", size: 20, speed: 0, floor: false, x: world.player.x + 50, y: world.player.y, direction: 1, wobble: 0 };
  world.friends = [puffer];
  for (let tick = 0; tick < 10; tick++) swim(world, 0.05, idle, 844, 390);
  assert.equal(puffer.puff, 1);
  puffer.x += 400;
  for (let tick = 0; tick < 10; tick++) swim(world, 0.05, idle, 844, 390);
  assert.ok(puffer.puff > 0 && puffer.puff < 1);
});
