import test from "node:test";
import assert from "node:assert/strict";
import { createSound, cuesFor } from "../src/sound.js";

// Records every tone the game asks for, like a browser's audio engine but silent.
class FakeAudio {
  constructor() { this.state = "suspended"; this.currentTime = 0; this.destination = {}; FakeAudio.tones = 0; }
  resume() { this.state = "running"; return Promise.resolve(); }
  createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: node => node }; }
  createOscillator() {
    FakeAudio.tones++;
    return { type: "", frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect: node => node, start() {}, stop() {} };
  }
}

test("each main moment has its own sound", () => {
  assert.deepEqual(cuesFor([{ type: "eat" }], "playing", "playing"), ["eat"]);
  assert.deepEqual(cuesFor([{ type: "grow" }], "playing", "playing"), ["grow"]);
  assert.deepEqual(cuesFor([{ type: "hurt" }], "playing", "playing"), ["hurt"]);
  assert.deepEqual(cuesFor([], "playing", "playing"), []);
});

test("becoming the shark plays the fanfare instead of the grow chime, and the last bump plays game over", () => {
  assert.deepEqual(cuesFor([{ type: "grow" }], "playing", "won"), ["won"]);
  assert.deepEqual(cuesFor([{ type: "hurt" }], "playing", "gameover"), ["gameover"]);
  assert.deepEqual(cuesFor([], "won", "won"), [], "a win sounds once, not every frame");
});

test("several snacks in one moment make one nom", () => {
  assert.deepEqual(cuesFor([{ type: "eat" }, { type: "eat" }, { type: "eat" }], "playing", "playing"), ["eat"]);
});

test("sound stays silent until a tap unlocks it, then plays what the game does", () => {
  const sound = createSound(FakeAudio);
  const world = { phase: "playing", events: [] };
  sound.listen(world);
  world.events = [{ type: "eat" }];
  assert.deepEqual(sound.listen(world), ["eat"]);
  assert.equal(sound.ready, false);
  assert.equal(FakeAudio.tones ?? 0, 0);

  sound.unlock();
  assert.equal(sound.ready, true);
  sound.listen(world);
  assert.ok(FakeAudio.tones > 0, "a snack should make a sound once unlocked");
  const afterEat = FakeAudio.tones;
  world.events = [{ type: "grow" }];
  world.phase = "won";
  assert.deepEqual(sound.listen(world), ["won"]);
  assert.ok(FakeAudio.tones > afterEat + 5, "the fanfare has several notes");
  assert.equal(world.events.length, 1, "listening leaves the events for the rest of the game");
});

test("a browser without Web Audio simply stays quiet", () => {
  const sound = createSound(null);
  sound.unlock();
  assert.equal(sound.ready, false);
  assert.equal(sound.play("eat"), false);
});
