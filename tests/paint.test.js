import test from "node:test";
import assert from "node:assert/strict";
import { ZONES } from "../src/zones.js";
import { SPECIES } from "../src/species.js";

// paint.js makes an Image for each zone's backdrop; none loads here, so the drawn water shows.
globalThis.Image = class { constructor() { this.naturalWidth = 0; } };
const { paintOcean } = await import("../src/paint.js");
const { createWorld } = await import("../src/world.js");
const { glowColor } = await import("../src/animal-paint.js");

// Counts canvas calls by name; gradients accept colour stops and nothing else.
function countingContext() {
  const calls = {};
  const context = new Proxy({}, {
    get: (target, key) => {
      if (key in target) return target[key];
      if (String(key).startsWith("create")) return () => ({ addColorStop() {} });
      return (...args) => { calls[key] = (calls[key] ?? 0) + 1; if (key === "measureText") return { width: 40 }; };
    },
    set: (target, key, value) => { target[key] = value; return true; }
  });
  return { context, calls };
}

// Some drawings sprinkle random sparkles, so the dice are pinned while painting.
function paintIn(zone, friends) {
  const world = createWorld(844, 390, { zone });
  Object.assign(world, { phase: "playing", creatures: [], friends, invulnerable: 0 });
  const { context, calls } = countingContext();
  const random = Math.random;
  Math.random = () => 0.5;
  try { paintOcean(context, world, 844, 390, 1.5); } finally { Math.random = random; }
  return calls;
}

test("a dark zone paints the dark over the water with a hole around you, and a light for each glowing animal", () => {
  const anglerfish = { kind: "anglerfish", size: 22, speed: 0, floor: false, x: 120, y: 0, direction: 1, wobble: 0 };
  const turtle = { kind: "turtle", size: 34, speed: 0, floor: false, x: -120, y: 0, direction: 1, wobble: 0 };
  const sunny = paintIn(ZONES.open, [anglerfish, turtle]);
  const dark = paintIn({ ...ZONES.open, id: "dark", light: 0.3 }, [anglerfish, turtle]);
  assert.equal(dark.fillRect, sunny.fillRect + 1, "one dark layer over everything");
  assert.equal(dark.arc, sunny.arc + 1, "one light, for the anglerfish and not the turtle");
  assert.equal(SPECIES.anglerfish.glow, true);
  assert.ok(glowColor("anglerfish"), "the anglerfish's light has a colour");
  const darkZone = { ...ZONES.open, id: "dark", light: 0.3 };
  const two = [anglerfish, { ...anglerfish, x: 300 }];
  assert.equal(paintIn(darkZone, two).arc, paintIn(ZONES.open, two).arc + 2, "two anglerfish, two lights");
  const far = [{ ...anglerfish, x: 5000 }];
  assert.equal(paintIn(darkZone, far).arc, paintIn(ZONES.open, far).arc, "no light for an animal off screen");
});

test("a floorless zone paints no sea bed plants or coral", () => {
  const sunny = paintIn(ZONES.open, []);
  const open = paintIn({ ...ZONES.open, id: "midwater", floor: false }, []);
  assert.ok(open.stroke < sunny.stroke, "the seaweed strokes are gone");
  assert.ok(open.quadraticCurveTo < sunny.quadraticCurveTo);
});

test("a bare sea bed (mud at the bottom of the sea) has no plants or coral sticks", () => {
  const planted = paintIn({ ...ZONES.open, id: "planted" }, []);
  const bare = paintIn({ ...ZONES.open, id: "bare", plants: false }, []);
  assert.ok(bare.stroke < planted.stroke, "the seaweed strokes are gone");
  assert.equal(bare.save, planted.save, "the sea bed itself is still painted");
});
