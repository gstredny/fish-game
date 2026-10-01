import test from "node:test";
import assert from "node:assert/strict";
import { cardSpeech, hurtLine } from "../src/species.js";
import { missionLine } from "../src/missions.js";
import { WHAT_ANIMAL } from "../src/lines.js";
import { MET_KEY } from "../src/ocean-book.js";
import { OPEN_SEA, openGame } from "./app-fixture.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries({ ...OPEN_SEA, ...saved }));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

function fakeSpeech() {
  const spoken = [];
  const synth = { speaking: false, pending: false, speak: line => { if (line.text.trim()) spoken.push(line.text); },
    cancel() {}, getVoices: () => [], addEventListener() {} };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  return { spoken, globals: { speechSynthesis: synth, SpeechSynthesisUtterance } };
}

// Grows straight to the biggest form; with Math.random at 0 the mission is the hunt (eat 2 tuna).
function becomeShark(app) {
  Object.assign(app.world, { stage: 3, bites: 99, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
  app.frame(16);
  assert.equal(app.world.phase, "mission");
  assert.equal(app.world.mission.id, "hunt");
}

test("a mission about an animal never met asks What animal is this? before the mission names it", async () => {
  const random = Math.random;
  Math.random = () => 0;
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage(), speech.globals);
  try {
    app.click("start-button");
    becomeShark(app);
    assert.ok(app.nodes.get("mission").hidden, "the mission card waits");
    assert.ok(!app.nodes.get("card").hidden, "the tuna's card comes first");
    assert.equal(app.nodes.get("card-kicker").textContent, WHAT_ANIMAL);
    assert.equal(app.nodes.get("card-name").textContent, "?");
    assert.equal(app.nodes.get("card-close").textContent, "Tell me!");
    assert.equal(speech.spoken.at(-1), WHAT_ANIMAL);
    assert.ok(!speech.spoken.some(line => /tuna/i.test(line)), "nothing has said tuna yet");
    app.click("card-close");
    assert.equal(app.nodes.get("card-name").textContent, "Tuna");
    assert.equal(speech.spoken.at(-1), cardSpeech("tuna"));
    assert.equal(app.nodes.get("card-close").textContent, "Your mission");
    app.click("card-close");
    assert.ok(app.nodes.get("card").hidden);
    assert.ok(!app.nodes.get("mission").hidden, "then the mission card");
    assert.equal(app.nodes.get("mission-goal").textContent, "Eat 2 tuna");
    assert.equal(speech.spoken.at(-1), missionLine(app.world.mission));
    assert.equal(app.world.phase, "mission");
    assert.match(app.world.met.has("tuna") ? "met" : "", /met/, "the tuna is in the Ocean book");
    app.click("mission-go");
    assert.equal(app.world.phase, "playing");
  } finally { app.close(); Math.random = random; }
});

test("a mission about an animal met before goes straight to the mission card", async () => {
  const random = Math.random;
  Math.random = () => 0;
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage({ [MET_KEY]: '["tuna"]' }), speech.globals);
  try {
    app.click("start-button");
    becomeShark(app);
    assert.ok(app.nodes.get("card").hidden);
    assert.ok(!app.nodes.get("mission").hidden);
    assert.equal(speech.spoken.at(-1), missionLine(app.world.mission));
  } finally { app.close(); Math.random = random; }
});

test("a bump by a hunter never met opens its card first instead of saying its name", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage(), speech.globals);
  try {
    app.click("start-button");
    Object.assign(app.world, { invulnerable: 0, friends: [], creatures: [{ ...app.world.player, tier: 2, wobble: 0 }] });
    app.frame(16);
    assert.equal(app.world.hearts, 2, "the bump still counts");
    assert.equal(app.world.phase, "meeting");
    assert.equal(app.nodes.get("card-kicker").textContent, WHAT_ANIMAL);
    assert.equal(speech.spoken.at(-1), WHAT_ANIMAL);
    assert.ok(!speech.spoken.includes(hurtLine(app.world.zone, "mackerel", 0)), "no Watch out! line names it first");
    app.click("card-close");
    assert.equal(app.nodes.get("card-name").textContent, "Mackerel");
    app.click("card-close");
    assert.equal(app.world.phase, "playing");

    // Met now: the next bump says the food-chain line as before.
    Object.assign(app.world, { invulnerable: 0, creatures: [{ ...app.world.player, tier: 2, wobble: 0 }] });
    app.frame(32);
    assert.equal(app.world.hearts, 1);
    assert.equal(app.world.phase, "playing");
    assert.equal(speech.spoken.at(-1), hurtLine(app.world.zone, "mackerel", 0));
  } finally { app.close(); }
});

test("the bump that ends the swim tells the line, since no card can follow", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage(), speech.globals);
  try {
    app.click("start-button");
    Object.assign(app.world, { hearts: 1, invulnerable: 0, friends: [], creatures: [{ ...app.world.player, tier: 2, wobble: 0 }] });
    app.frame(16);
    assert.equal(app.world.phase, "gameover");
    assert.equal(speech.spoken.at(-1), hurtLine(app.world.zone, "mackerel", 0));
    assert.ok(app.nodes.get("card").hidden);
  } finally { app.close(); }
});
