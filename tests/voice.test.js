import test from "node:test";
import assert from "node:assert/strict";
import { createClips, createVoice, pickVoice } from "../src/voice.js";

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

function fakeSpeech() {
  const spoken = [];
  const synth = { speaking: false, pending: false, speak: line => { spoken.push(line.text); synth.speaking = true; },
    cancel: () => { synth.speaking = false; }, getVoices: () => [], addEventListener() {} };
  return { synth, spoken, Utterance: class { constructor(text) { this.text = text; } } };
}

function fakeClips(texts) {
  return { played: [], busy: false, has: text => texts.includes(text),
    play(text, fallback) { this.played.push(text); this.busy = true; this.fallback = fallback; },
    stop() { this.busy = false; }, unlock() { this.played.push("(unlock)"); } };
}

// Like a browser: a new src interrupts the line still loading, whose play() then fails.
class FakeAudio {
  constructor() { FakeAudio.last = this; this.listeners = {}; this.plays = 0; }
  set src(value) { this.interrupt?.(new Error("AbortError")); this.interrupt = null; this.source = value; }
  get src() { return this.source; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  play() {
    this.plays++;
    return FakeAudio.next ?? new Promise((resolve, reject) => { this.interrupt = reject; setImmediate(resolve); });
  }
  pause() { this.paused = true; }
}

const settle = () => new Promise(resolve => setImmediate(resolve));

test("the recordings are looked up without Object.hasOwn, which older iPhones lack", async () => {
  const hasOwn = Object.hasOwn;
  delete Object.hasOwn;
  try {
    const clips = createClips("voice/", FakeAudio, async () => ({ ok: true, json: async () => ({ clips: { "Hi!": "a1.mp3" } }) }));
    await settle();
    assert.equal(clips.has("Hi!"), true);
    assert.equal(clips.has("toString"), false);
  } finally { Object.hasOwn = hasOwn; }
});

test("recorded lines play the recording; other lines use the device voice", () => {
  const { synth, spoken, Utterance } = fakeSpeech();
  const clips = fakeClips(["This is a crab!"]);
  const voice = createVoice(memoryStorage(), synth, Utterance, clips);
  assert.equal(voice.say("This is a crab!"), true);
  assert.deepEqual(clips.played, ["This is a crab!"]);
  assert.deepEqual(spoken, [], "the robot voice stays quiet");
  assert.equal(voice.say("Crabs pinch!", { polite: true }), false, "a polite line waits for the recording");
  voice.stop();
  assert.equal(clips.busy, false);
  assert.equal(voice.say("Not recorded"), true);
  assert.deepEqual(spoken, ["Not recorded"]);
  voice.say("This is a crab!");
  clips.fallback();
  assert.deepEqual(spoken, ["Not recorded", "This is a crab!"], "a recording that can't play is spoken instead");
  voice.setMuted(true);
  assert.equal(voice.say("This is a crab!"), false);
  assert.equal(voice.say("This is a crab!", { force: true }), true);
});

test("recordings alone are enough for the voice button, and the first tap unlocks them once", () => {
  const clips = fakeClips([]);
  const voice = createVoice(memoryStorage(), undefined, undefined, clips);
  assert.equal(voice.available, true);
  voice.unlock();
  voice.unlock();
  assert.deepEqual(clips.played, ["(unlock)"]);
  assert.equal(voice.say("No recording, no device voice"), false);
});

test("clips come from the manifest and play one at a time through one audio element", async () => {
  const load = async url => {
    assert.equal(url, "voice/manifest.json");
    return { ok: true, json: async () => ({ clips: { "Hi!": "a1.mp3", "Bye!": "b2.mp3" } }) };
  };
  FakeAudio.next = null;
  const clips = createClips("voice/", FakeAudio, load);
  const audio = FakeAudio.last;
  assert.equal(clips.has("Hi!"), false, "nothing until the manifest arrives");
  await settle();
  assert.equal(clips.has("Hi!"), true);
  assert.equal(clips.has("Hello?"), false);

  let fallbacks = 0;
  clips.play("Hi!", () => fallbacks++);
  assert.equal(audio.src, "voice/a1.mp3");
  assert.equal(clips.busy, true);
  audio.listeners.ended();
  assert.equal(clips.busy, false);

  clips.play("Bye!", () => fallbacks++);
  audio.listeners.error();
  assert.equal(fallbacks, 1, "a missing file falls back to the device voice");
  assert.equal(clips.busy, false);

  FakeAudio.next = Promise.reject(new Error("NotAllowedError"));
  clips.play("Hi!", () => fallbacks++);
  await settle();
  assert.equal(fallbacks, 2, "blocked sound falls back too");

  let rejectFirst;
  FakeAudio.next = new Promise((resolve, reject) => { rejectFirst = reject; });
  clips.play("Hi!", () => fallbacks++);
  FakeAudio.next = Promise.resolve();
  clips.play("Bye!", () => fallbacks++);
  rejectFirst(new Error("AbortError: interrupted by a new line"));
  await settle();
  assert.equal(fallbacks, 2, "a line cut off by the next one is not read out by the robot voice");
  assert.equal(audio.src, "voice/b2.mp3");
  clips.stop();
  assert.equal(audio.paused, true);
  assert.equal(clips.busy, false);

  clips.unlock();
  assert.match(audio.src, /^data:audio\/wav;base64,/);

  // A click after sound is already allowed (a swim started with Enter) must not cut off a line.
  FakeAudio.next = null;
  clips.play("Hi!", () => fallbacks++);
  clips.unlock();
  await settle();
  assert.equal(audio.src, "voice/a1.mp3", "the line keeps playing");
  assert.equal(fallbacks, 2, "and the robot voice does not read it again");
  assert.equal(createClips("voice/", undefined, load), null, "no audio, no clips");
});

test("a missing manifest leaves every line to the device voice", async () => {
  const clips = createClips("voice/", FakeAudio, async () => ({ ok: false }));
  await settle();
  assert.equal(clips.has("Hi!"), false);
  const offline = createClips("voice/", FakeAudio, async () => { throw new Error("offline"); });
  await settle();
  assert.equal(offline.has("Hi!"), false);
});

test("the device voice is the friendliest English one, never a novelty voice", () => {
  const voices = [
    { name: "Albert", lang: "en-US", localService: true },
    { name: "Bubbles", lang: "en-US", localService: true },
    { name: "Thomas", lang: "fr-FR", localService: true },
    { name: "Daniel", lang: "en-GB", localService: true },
    { name: "Samantha", lang: "en-US", localService: true }
  ];
  assert.equal(pickVoice(voices).name, "Samantha");
  assert.equal(pickVoice(voices.slice(0, 4)).name, "Daniel");
  assert.equal(pickVoice(voices.slice(0, 3)), null);
  assert.equal(pickVoice([{ name: "Google US English", lang: "en-US", localService: false }, voices[3]]).name, "Google US English");
});
