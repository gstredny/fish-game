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

function fakeClips(texts, loaded = true) {
  return { played: [], busy: false, loaded, has: text => texts.includes(text),
    play(text) { this.played.push(text); this.busy = true; },
    stop() { this.busy = false; }, unlock() { this.played.push("(unlock)"); } };
}

// Like a browser: a new src interrupts the line still loading, whose play() then fails.
class FakeAudio {
  constructor() { FakeAudio.last = this; this.listeners = {}; this.plays = 0; }
  set src(value) { this.interrupt?.(Object.assign(new Error("interrupted"), { name: "AbortError" })); this.interrupt = null; this.source = value; }
  get src() { return this.source; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  play() {
    this.plays++;
    return FakeAudio.next ?? new Promise((resolve, reject) => { this.interrupt = reject; setImmediate(resolve); });
  }
  pause() { this.paused = true; }
}

// Web Audio as the sound effects have it: records which recordings it was asked to play.
function fakeContext(state = "running") {
  const context = { state, started: [], stopped: 0, destination: {}, resume: async () => { context.state = "running"; },
    decodeAudioData: (bytes, done) => done({ from: bytes.file }),
    createBufferSource: () => {
      const node = { connect() {}, start: () => { context.started.push(node.buffer.from); context.playing = node; },
        stop: () => { context.stopped++; } };
      return node;
    } };
  return context;
}

const manifest = { clips: { "Hi!": "a1.mp3", "Bye!": "b2.mp3" } };
async function load(url) {
  if (url === "voice/manifest.json") return { ok: true, json: async () => manifest };
  return { ok: true, arrayBuffer: async () => ({ file: url }) };
}
const notAllowed = () => Promise.reject(Object.assign(new Error("not allowed"), { name: "NotAllowedError" }));
const settle = async () => { for (let round = 0; round < 5; round++) await new Promise(resolve => setImmediate(resolve)); };

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

test("recorded lines play the recording, never the robot voice; only unrecorded lines use the device voice", () => {
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
  voice.setMuted(true);
  assert.equal(voice.say("This is a crab!"), false);
  assert.equal(voice.say("This is a crab!", { force: true }), true);
  assert.deepEqual(spoken, ["Not recorded"]);
});

test("a line said before the list of recordings arrives waits for it instead of using the robot voice", async () => {
  const { synth, spoken, Utterance } = fakeSpeech();
  let arrive;
  const clips = createClips("voice/", FakeAudio, url => url.endsWith("manifest.json") ?
    new Promise(resolve => { arrive = () => resolve({ ok: true, json: async () => manifest }); }) : load(url));
  const voice = createVoice(memoryStorage(), synth, Utterance, clips);
  FakeAudio.next = null;
  assert.equal(voice.say("Hi!"), true);
  assert.equal(voice.say("Bye!"), true, "a newer line replaces the waiting one");
  arrive();
  await settle();
  assert.deepEqual(spoken, [], "the robot voice stays quiet");
  assert.equal(FakeAudio.last.src, "voice/b2.mp3");
  assert.equal(FakeAudio.last.plays, 1, "only the newest line is said");
  voice.say("Hi!");
  assert.equal(FakeAudio.last.src, "voice/a1.mp3", "then lines play straight away");
});

test("with recordings, taps wake the audio element and never the device voice", () => {
  const { synth, spoken, Utterance } = fakeSpeech();
  const clips = fakeClips([]);
  const voice = createVoice(memoryStorage(), synth, Utterance, clips);
  assert.equal(voice.available, true);
  voice.unlock();
  voice.unlock();
  assert.deepEqual(clips.played, ["(unlock)", "(unlock)"], "each tap asks; the clips decide if they need it");
  assert.deepEqual(spoken, [], "no silent robot line, which could get in the audio element's way on iPhone");
  assert.equal(createVoice(memoryStorage(), undefined, undefined, clips).say("No recording, no device voice"), false);
});

test("clips come from the manifest and play one at a time through one audio element", async () => {
  FakeAudio.next = null;
  const context = fakeContext();
  const clips = createClips("voice/", FakeAudio, load, () => context);
  const audio = FakeAudio.last;
  assert.equal(clips.loaded, false);
  assert.equal(clips.has("Hi!"), false, "nothing until the manifest arrives");
  await settle();
  assert.equal(clips.loaded, true);
  assert.equal(clips.has("Hi!"), true);
  assert.equal(clips.has("Hello?"), false);

  clips.play("Hi!");
  assert.equal(audio.src, "voice/a1.mp3");
  assert.equal(clips.busy, true);
  audio.listeners.ended();
  assert.equal(clips.busy, false);

  // A line cut off by the next one just ends: it is not played again some other way.
  let rejectFirst;
  FakeAudio.next = new Promise((resolve, reject) => { rejectFirst = reject; });
  clips.play("Hi!");
  FakeAudio.next = Promise.resolve();
  clips.play("Bye!");
  rejectFirst(Object.assign(new Error("interrupted"), { name: "AbortError" }));
  await settle();
  assert.deepEqual(context.started, [], "nothing else plays the cut-off line");
  assert.equal(audio.src, "voice/b2.mp3");
  clips.stop();
  assert.equal(audio.paused, true);
  assert.equal(clips.busy, false);

  clips.unlock();
  assert.equal(audio.src, "voice/b2.mp3", "an element that has played is already awake");

  // A click after sound is already allowed (a swim started with Enter) must not cut off a line.
  FakeAudio.next = null;
  clips.play("Hi!");
  clips.unlock();
  await settle();
  assert.equal(audio.src, "voice/a1.mp3", "the line keeps playing");
  assert.equal(createClips("voice/", undefined, load), null, "no audio, no clips");
});

test("a recording the phone won't play through the audio element plays through Web Audio", async () => {
  FakeAudio.next = null;
  const context = fakeContext("suspended");
  const clips = createClips("voice/", FakeAudio, load, () => context);
  const audio = FakeAudio.last;
  await settle();

  // iPhone refuses the element outside a tap.
  FakeAudio.next = notAllowed();
  clips.play("Hi!");
  await settle();
  assert.deepEqual(context.started, ["voice/a1.mp3"], "the same recording, through Web Audio");
  assert.equal(context.state, "running", "a sleeping context is asked to wake");
  assert.equal(clips.busy, true, "busy until it ends");
  context.playing.onended();
  assert.equal(clips.busy, false);

  // Once refused, lines go straight to Web Audio until a tap wakes the element again.
  FakeAudio.next = Promise.resolve();
  const plays = audio.plays;
  clips.play("Bye!");
  await settle();
  assert.equal(audio.plays, plays, "the element is not tried again yet");
  assert.deepEqual(context.started, ["voice/a1.mp3", "voice/b2.mp3"]);
  clips.play("Hi!");
  assert.equal(context.stopped, 1, "a new line stops the one playing");
  clips.stop();
  assert.equal(context.stopped, 1, "the new line had not started yet");
  await settle();
  assert.deepEqual(context.started, ["voice/a1.mp3", "voice/b2.mp3"], "and a stopped line never starts");
  clips.unlock();
  assert.match(audio.src, /^data:audio\/wav;base64,/, "a tap wakes the element with silence");
  await settle();
  clips.play("Bye!");
  assert.equal(audio.src, "voice/b2.mp3", "and it is used again");

  // A file the element can't load also tries Web Audio.
  audio.listeners.error();
  await settle();
  assert.deepEqual(context.started.at(-1), "voice/b2.mp3");
});

test("with no Web Audio either, a refused recording is simply not heard", async () => {
  const { synth, spoken, Utterance } = fakeSpeech();
  FakeAudio.next = null;
  const clips = createClips("voice/", FakeAudio, load);
  const voice = createVoice(memoryStorage(), synth, Utterance, clips);
  await settle();
  FakeAudio.next = notAllowed();
  voice.say("Hi!");
  await settle();
  assert.equal(clips.busy, false, "the voice is free for the next line");
  assert.deepEqual(spoken, [], "the robot voice never reads a recorded line");
  FakeAudio.next = null;
});

test("a missing manifest leaves every line to the device voice", async () => {
  const clips = createClips("voice/", FakeAudio, async () => ({ ok: false }));
  await settle();
  assert.equal(clips.has("Hi!"), false);
  assert.equal(clips.loaded, true);
  const offline = createClips("voice/", FakeAudio, async () => { throw new Error("offline"); });
  await settle();
  assert.equal(offline.has("Hi!"), false);
  assert.equal(offline.loaded, true);
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
