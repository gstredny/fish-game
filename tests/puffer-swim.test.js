import test from "node:test";
import assert from "node:assert/strict";
import { createPufferSwim, puffPuffer, resizePufferSwim, swimPuffer } from "../src/puffer-swim.js";

const input = (keys = []) => ({ keys: new Set(keys), pad: null, pointer: null });
const steps = (state, count, controls = input()) => {
  for (let n = 0; n < count; n++) swimPuffer(state, 0.05, controls);
};
const playing = (width = 568, height = 320) => Object.assign(createPufferSwim(width, height), { phase: "playing" });

test("the small phone gives a full warning interval even if Right is held immediately", () => {
  const state = playing();
  const right = input(["ArrowRight"]);
  let warningAt;
  while (state.phase === "playing" && state.time < 10) {
    swimPuffer(state, 0.05, right);
    if (state.warned && warningAt == null) warningAt = state.time;
  }
  assert.equal(state.phase, "retry");
  assert.ok(state.time - warningAt >= 3.4, `reaction interval was ${state.time - warningAt}s`);
  assert.equal(state.defended, false);
  assert.ok(state.events.includes("practise"), "shelter alone cannot finish the adventure");
});

test("a normal small-phone route warns, puffs, visibly retreats, then reaches shelter", () => {
  const state = playing();
  const right = input(["ArrowRight"]);
  steps(state, 42, right);
  assert.equal(state.hunter.phase, "warning");
  assert.ok(puffPuffer(state));
  const hunterStart = state.hunter.x;
  steps(state, 6, right);
  assert.equal(state.defended, true);
  assert.equal(state.hunter.phase, "retreating");
  assert.ok(state.puff >= 0.55);
  assert.equal(state.phase, "playing", "the scene stays visible while the hunter retreats");
  steps(state, 80, right);
  assert.equal(state.phase, "won");
  assert.ok(state.hunter.x > hunterStart + 100, "retreat travels visibly away");
});

test("puffing early expires, slows swimming, and cannot refresh while inflated", () => {
  const normal = playing(1280, 800), puffed = playing(1280, 800);
  assert.ok(puffPuffer(puffed));
  assert.equal(puffPuffer(puffed), false);
  steps(normal, 20, input(["ArrowRight"]));
  steps(puffed, 20, input(["ArrowRight"]));
  assert.ok(normal.player.x - 1280 * 0.24 > (puffed.player.x - 1280 * 0.24) * 2);
  steps(puffed, 55);
  assert.equal(puffed.puffLeft, 0);
  assert.equal(puffed.puff, 0);
  assert.equal(puffed.defended, false, "a puff far from the grouper does not count as defence");
  assert.ok(puffPuffer(puffed), "a fresh press can puff again after deflating");
});

test("pause, retry, intro and success stop every simulation field", () => {
  for (const phase of ["intro", "paused", "retry", "won"]) {
    const state = Object.assign(playing(), { phase });
    const before = structuredClone(state);
    steps(state, 50, input(["ArrowRight"]));
    assert.deepEqual(state, before, phase);
    assert.equal(puffPuffer(state), false);
  }
});

test("resize keeps shelter reachable and inflated fish clear of both phone controls", () => {
  const state = playing(1280, 800);
  state.player = { x: 1250, y: 780, direction: 1 };
  resizePufferSwim(state, 568, 320);
  assert.ok(state.player.x + 50 <= 568 && state.player.y + 50 <= 320 - 96 - 16);
  assert.ok(state.shelter.x + 66 < 568 && state.shelter.y - 63 > 60);
  state.player.x = 20;
  state.player.y = 300;
  steps(state, 1, input(["ArrowDown"]));
  assert.ok(state.player.y + 50 <= 320 - 320 * 0.38 - 16);
  resizePufferSwim(state, 844, 390);
  assert.equal(state.shelter.x, 844 * 0.82);
  assert.equal(state.hunter.x, 844 * 0.82);
});
