import test from "node:test";
import assert from "node:assert/strict";
import { createSound, cuesFor } from "../src/sound.js";

// Records every tone the game asks for, like a browser's audio engine but silent.
let tones = 0;
class FakeAudio {
  constructor() { this.state = "suspended"; this.currentTime = 0; this.destination = {}; }
  resume() { this.state = "running"; return Promise.resolve(); }
  createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: node => node }; }
  createOscillator() {
    tones++;
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
  assert.deepEqual(cuesFor([{ type: "grow" }, { type: "mission" }], "playing", "mission"), ["won"]);
  assert.deepEqual(cuesFor([{ type: "hurt" }], "playing", "gameover"), ["gameover"]);
  assert.deepEqual(cuesFor([], "mission", "mission"), [], "a win sounds once, not every frame");
});

test("the mission card and the finished mission play the fanfare; planting coral after it does not", () => {
  assert.deepEqual(cuesFor([{ type: "eat" }, { type: "done" }], "playing", "won"), ["eat", "won"], "the mission's last tuna");
  assert.deepEqual(cuesFor([{ type: "eat" }, { type: "done" }], "mission", "won"), ["eat", "won"],
    "even in the first moment after the mission card");
  assert.deepEqual(cuesFor([], "planting", "won"), [], "back to the win screen after planting");
  assert.deepEqual(cuesFor([], "mission", "playing"), []);
});

test("several snacks in one moment make one nom", () => {
  assert.deepEqual(cuesFor([{ type: "eat" }, { type: "eat" }, { type: "eat" }], "playing", "playing"), ["eat"]);
});

test("sound stays silent until a tap unlocks it, then plays what the game does", () => {
  tones = 0;
  const sound = createSound(FakeAudio);
  const world = { phase: "playing", events: [] };
  sound.listen(world);
  world.events = [{ type: "eat" }];
  assert.deepEqual(sound.listen(world), ["eat"]);
  assert.equal(sound.ready, false);
  assert.equal(tones, 0);

  sound.unlock();
  assert.equal(sound.ready, true);
  sound.listen(world);
  assert.ok(tones > 0, "a snack should make a sound once unlocked");
  const afterEat = tones;
  world.events = [{ type: "grow" }, { type: "mission" }];
  world.phase = "mission";
  assert.deepEqual(sound.listen(world), ["won"]);
  assert.ok(tones > afterEat + 5, "the fanfare has several notes");
  assert.equal(world.events.length, 2, "listening leaves the events for the rest of the game");
});

test("a browser without Web Audio simply stays quiet", () => {
  const sound = createSound(null);
  sound.unlock();
  assert.equal(sound.ready, false);
  assert.equal(sound.play("eat"), false);
});

test("the speaker button's off switch silences the sounds too", () => {
  tones = 0;
  const sound = createSound(FakeAudio);
  sound.unlock();
  sound.setMuted(true);
  const before = tones;
  assert.equal(sound.play("eat"), false);
  assert.equal(tones, before);
  sound.setMuted(false);
  assert.equal(sound.play("eat"), true);
});

test("a broken audio engine never stops the game", () => {
  class Broken extends FakeAudio { createOscillator() { throw new Error("no audio"); } }
  const sound = createSound(Broken);
  sound.unlock();
  assert.equal(sound.play("eat"), false);
});

test("after the phone pauses audio, the next sound asks for it back", () => {
  let resumes = 0;
  class Paused extends FakeAudio { resume() { resumes++; return Promise.resolve(); } }
  const sound = createSound(Paused);
  sound.unlock();
  const before = resumes;
  assert.equal(sound.play("eat"), false, "nothing plays while paused");
  assert.equal(resumes, before + 1, "but it asks the phone to resume");
});
