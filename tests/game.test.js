import test from "node:test";
import assert from "node:assert/strict";
import { canEat, CREATURES, FORMS, friendTraits, goalFor, hunters, isDanger, isFriend, LEVELS, nextGrowth, SEA_FRIENDS, SHARK,
  swimSpeed } from "../src/rules.js";
import { createWorld, dangerBehind, resetWorld, swim } from "../src/world.js";
import { formKind, hasTopHunter, KINDS, topTier, ZONES, zoneKinds } from "../src/zones.js";
import { SPECIES } from "../src/species.js";

const ORCA = topTier(ZONES.open);

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

test("eating nearby plankton grows a sardine", () => {
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
  world.invulnerable = 0;
  world.creatures = [
    { x: 0, y: 0, tier: 2, direction: 1, wobble: 0 },
    { x: 0, y: 0, tier: 2, direction: 1, wobble: 0 }
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
    world.creatures = [{ x: 0, y: 0, tier: 2, direction: 1, wobble: 0 }];
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

test("growing into a shark starts the swim's mission instead of ending the swim", () => {
  const world = createWorld(390, 844, { mission: "hunt" });
  world.phase = "playing";
  world.stage = 3;
  world.bites = 8;
  world.creatures = [{ x: 0, y: 0, tier: 3, direction: 1, wobble: 0 }];
  swim(world, 0.016, idleInput, 390, 844);
  assert.equal(world.stage, 4);
  assert.equal(world.phase, "mission", "the game waits while the mission is shown");
  assert.equal(world.mission.active, true);
  world.phase = "playing";
  world.creatures = [{ x: 0, y: 0, tier: 4, direction: 1, wobble: 0 }];
  swim(world, 0.016, idleInput, 390, 844);
  assert.equal(world.hearts, 3);
  assert.equal(world.mission.have, 1);
  assert.equal(world.phase, "playing", "one tuna of two is not the end");
  world.creatures = [{ x: 0, y: 0, tier: 4, direction: 1, wobble: 0 }];
  swim(world, 0.016, idleInput, 390, 844);
  assert.equal(world.phase, "won");
  assert.ok(world.events.some(event => event.type === "done"));
});

test("every predator is clearly bigger than the fish it hurts, every snack clearly smaller", () => {
  for (let stage = 0; stage < FORMS.length; stage++) {
    for (let tier = 0; tier < CREATURES.length; tier++) {
      const ratio = CREATURES[tier].size / FORMS[stage].size;
      if (isDanger(stage, tier)) assert.ok(ratio >= 1.25, `tier ${tier} should be at least 1.25x stage ${stage}, is ${ratio.toFixed(2)}x`);
      if (canEat(stage, tier)) assert.ok(ratio <= 0.85, `tier ${tier} should be at most 0.85x stage ${stage}, is ${ratio.toFixed(2)}x`);
    }
  }
});

test("every zone is one true food chain, and your own kind is your school", () => {
  assert.deepEqual(ZONES.open.chain, ["plankton", "sardine", "mackerel", "squid", "tuna", "shark", "orca"]);
  assert.deepEqual(ZONES.reef.chain, ["plankton", "damselfish", "lionfish", "grouper", "reefshark", "tigershark", "orca"]);
  for (const zone of Object.values(ZONES)) {
    assert.ok(zone.chain.length === 6 || zone.chain.length === 7, `${zone.id}: five forms, a snack, and maybe a top hunter`);
    assert.equal(hasTopHunter(zone), zone.chain.length === 7);
    for (let stage = 0; stage < FORMS.length; stage++) {
      assert.equal(formKind(zone, stage), zone.chain[stage + 1], `${zone.id} form ${stage} is the same animal as tier ${stage + 1}`);
    }
    for (const kind of zoneKinds(zone)) assert.ok(SPECIES[kind], `${zone.id}: ${kind} has no card`);
    for (const kind of [...zone.friends, zone.giant]) assert.ok(friendTraits(kind), `${zone.id}: ${kind} has no size or speed`);
    assert.ok(zone.friends.map(friendTraits).some(friend => !friend.floor), `${zone.id}: someone swims`);
    assert.equal(zone.friends.map(friendTraits).some(friend => friend.floor), zone.floor, `${zone.id}: floor animals only where there is a floor`);
    assert.ok(!zone.friends.includes(zone.giant), `${zone.id}: the giant is rare, not an everyday friend`);
  }
  assert.deepEqual([...new Set(KINDS)].length, KINDS.length, "every animal is counted once");
  for (const friend of SEA_FRIENDS) assert.ok(KINDS.includes(friend.kind), `${friend.kind} lives nowhere`);
  for (let stage = 0; stage < FORMS.length; stage++) {
    for (let tier = 0; tier < CREATURES.length; tier++) {
      const roles = [canEat(stage, tier), isFriend(stage, tier), isDanger(stage, tier)].filter(Boolean);
      assert.equal(roles.length, 1, `tier ${tier} has exactly one role for stage ${stage}`);
    }
  }
});

test("a fish of your own kind is never eaten and never hurts", () => {
  const world = createWorld(390, 844);
  Object.assign(world, { phase: "playing", stage: 1, invulnerable: 0 });
  world.creatures = [{ x: 0, y: 0, tier: 2, direction: -1, wobble: 0 }];
  swim(world, 0.016, idleInput, 390, 844);
  assert.equal(world.hearts, 3);
  assert.equal(world.bites, 0);
  assert.equal(world.creatures[0].gone, undefined);
  assert.equal(world.creatures[0].direction, world.player.direction, "a schoolmate turns to swim your way");
});

test("a bump says who hunts whom", () => {
  const world = createWorld(390, 844);
  Object.assign(world, { phase: "playing", stage: 2, invulnerable: 0 });
  world.creatures = [{ x: 0, y: 0, tier: 4, direction: 1, wobble: 0 }];
  swim(world, 0.016, idleInput, 390, 844);
  assert.deepEqual(world.events, [{ type: "hurt", by: "tuna" }]);
});

test("a new swim starts with a safe period and no predator close by", () => {
  for (let trial = 0; trial < 40; trial++) {
    const world = createWorld(390, 844);
    assert.ok(world.invulnerable >= 2, "safe period at start");
    for (const creature of world.creatures) {
      if (creature.tier > 0) assert.ok(Math.hypot(creature.x, creature.y) >= 260, `predator spawned ${Math.hypot(creature.x, creature.y)} px from the start`);
    }
  }
});

test("a shark's ocean holds every kind of fish and a few orcas, but no plankton", () => {
  for (const level of Object.keys(LEVELS)) {
    const world = createWorld(1440, 900, { level });
    world.phase = "playing";
    world.stage = 4;
    const tiers = new Set();
    let sharks = 0, orcas = 0, total = 0;
    for (let round = 0; round < 30; round++) {
      world.creatures = [];
      swim(world, 0.016, idleInput, 1440, 900);
      for (const creature of world.creatures) {
        tiers.add(creature.tier);
        total++;
        if (creature.tier === 5) sharks++;
        if (creature.tier === ORCA) orcas++;
      }
    }
    assert.deepEqual([...tiers].sort(), [1, 2, 3, 4, 5, 6], "every fish, and no plankton: great whites don't eat it");
    assert.ok(sharks / total < 0.5, `${Math.round(sharks / total * 100)}% sharks`);
    assert.ok(orcas / total < 0.1, `${level}: ${Math.round(orcas / total * 100)}% orcas`);
  }
});

test("new fish are never more than three tiers above you, so the hunters list is complete", () => {
  for (const level of Object.keys(LEVELS)) {
    for (let stage = 0; stage < FORMS.length; stage++) {
      const world = createWorld(1440, 900, { level });
      Object.assign(world, { phase: "playing", stage, invulnerable: 99 });
      const seen = new Set();
      for (let round = 0; round < 60; round++) {
        world.creatures = [];
        swim(world, 0.016, idleInput, 1440, 900);
        for (const creature of world.creatures) if (isDanger(stage, creature.tier)) seen.add(creature.tier);
      }
      assert.deepEqual([...seen].sort(), hunters(stage, ZONES.open), `${level}, stage ${stage}`);
    }
  }
});

test("Big swimmer takes longer to grow, and its hunters really chase you", () => {
  assert.ok(FORMS.slice(0, SHARK).every((form, stage) => goalFor("little", stage) === form.goal), "Little swimmer is the gentle game");
  assert.ok(FORMS.slice(0, SHARK).every((form, stage) => goalFor("big", stage) > goalFor("little", stage)));
  const chased = level => {
    const world = createWorld(390, 844, { level });
    Object.assign(world, { phase: "playing", stage: 0, invulnerable: 99, friends: [] });
    // A mackerel 150px to the right, swimming away from you.
    const hunter = { x: world.player.x + 150, y: world.player.y, tier: 2, direction: 1, wobble: 0 };
    world.creatures = [hunter];
    for (let tick = 0; tick < 20; tick++) swim(world, 0.05, idleInput, 390, 844);
    return { gap: hunter.x - world.player.x, facing: hunter.direction };
  };
  const little = chased("little"), big = chased("big");
  assert.ok(little.gap > 150, `a Little swimmer hunter keeps swimming its way (${little.gap.toFixed(0)}px)`);
  assert.ok(big.gap < 90, `a Big swimmer hunter turns and chases (${big.gap.toFixed(0)}px)`);
  assert.equal(big.facing, -1, "and faces you");
  for (const level of Object.values(LEVELS)) {
    assert.ok(level.chase < 1 && level.orcaChase < 1, "every hunter is slower than you, so you can always get away");
  }
  assert.ok(swimSpeed(SHARK) > 0);
});

test("a snack is eaten the moment it touches the fish, with a +1 to show it", () => {
  const world = createWorld(390, 844);
  world.phase = "playing";
  world.creatures = [{ x: 20, y: 0, tier: 0, direction: 1, wobble: 0 }];
  swim(world, 0.001, idleInput, 390, 844);
  assert.equal(world.bites, 1);
  assert.ok(world.particles.some(particle => particle.text === "+1"));
});

test("a bigger fish only hurts on a real bump, not a brush", () => {
  const world = createWorld(390, 844);
  world.phase = "playing";
  world.invulnerable = 0;
  world.creatures = [{ x: 25, y: 0, tier: 2, direction: 1, wobble: 0 }];
  swim(world, 0.001, idleInput, 390, 844);
  assert.equal(world.hearts, 3);
});

test("every fish uses its species artwork on a new swim or restart", () => {
  const world = createWorld(390, 844);
  assert.ok(world.creatures.length > 0);
  assert.ok(world.creatures.every(creature => creature.art == null));
  resetWorld(world, 390, 844);
  assert.ok(world.creatures.length > 0);
  assert.ok(world.creatures.every(creature => creature.art == null));
});

test("the HUD only turns see-through for fish that can hurt the player", () => {
  const world = createWorld(390, 844);
  world.camera = { x: 500, y: 300 };
  const box = { left: 10, top: 10, right: 240, bottom: 80 };
  const behindHud = { x: 500 + 100 - 195, y: 300 + 40 - 422, direction: 1, wobble: 0, art: null };
  world.creatures = [{ ...behindHud, tier: 0 }];
  assert.equal(dangerBehind(world, box, 390, 844), false);
  world.creatures = [{ ...behindHud, tier: 1 }];
  assert.equal(dangerBehind(world, box, 390, 844), false, "a sardine schoolmate is no danger to a sardine");
  world.creatures = [{ ...behindHud, tier: 2 }];
  assert.equal(dangerBehind(world, box, 390, 844), true);
  world.creatures = [{ ...behindHud, y: 300, tier: 2 }];
  assert.equal(dangerBehind(world, box, 390, 844), false);
});

test("new fish swim in from off screen at spread-out distances, not in a column", () => {
  const world = createWorld(844, 390);
  world.phase = "playing";
  world.invulnerable = 99;
  const gaps = [];
  for (let round = 0; round < 40; round++) {
    world.creatures = [];
    swim(world, 0.016, idleInput, 844, 390);
    for (const creature of world.creatures) {
      const gap = Math.abs(creature.x - world.camera.x) - 844 / 2 - CREATURES[creature.tier].size * 1.6;
      gaps.push(Math.round(gap));
    }
  }
  assert.ok(gaps.every(gap => gap >= 0), "every new fish starts fully off screen");
  assert.ok(new Set(gaps).size > 30, "arrivals are spread out");
  assert.ok(Math.max(...gaps) - Math.min(...gaps) > 30, "some come from further out than others");
});
