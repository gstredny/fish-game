import test from "node:test";
import assert from "node:assert/strict";
import { cardSpeech, growLine, hurtLine } from "../src/species.js";
import { MET_KEY } from "../src/ocean-book.js";
import { VOICE_KEY } from "../src/voice.js";
import { openGame } from "./app-fixture.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries(saved));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

// Records what the game says; `speaking` stays true until the game stops or the test clears it.
function fakeSpeech() {
  const spoken = [];
  const synth = { speaking: false, pending: false, speak: line => { spoken.push(line.text); synth.speaking = true; },
    cancel: () => { synth.speaking = false; }, getVoices: () => [], addEventListener() {} };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  return { spoken, synth, globals: { speechSynthesis: synth, SpeechSynthesisUtterance } };
}

const plankton = (world, dx = 60) => ({ x: world.player.x + dx, y: world.player.y, tier: 0, direction: 1, wobble: 0 });

test("the first meeting pauses the swim for a spoken photo card; the next new animal waits its turn", async () => {
  const storage = memoryStorage();
  const speech = fakeSpeech();
  const app = await openGame(storage, speech.globals);
  try {
    app.click("start-button");
    assert.equal(speech.spoken.at(-1), growLine(0), "the swim starts by saying what a sardine eats");
    assert.equal(app.nodes.get("toast").textContent, growLine(0));
    Object.assign(app.world, { creatures: [plankton(app.world)], friends: [] });
    app.frame(16);
    assert.equal(app.world.phase, "playing", "no card in the first seconds of a swim");

    app.world.time = 5.1;
    app.frame(32);
    assert.equal(app.world.phase, "meeting");
    assert.equal(app.nodes.get("card").hidden, false);
    assert.equal(app.nodes.get("pad").hidden, true);
    assert.equal(app.nodes.get("card-name").textContent, "Plankton");
    assert.equal(app.nodes.get("card-kicker").textContent, "You met a new animal!");
    assert.equal(app.nodes.get("card-photo").src, "art/animals/plankton.webp");
    assert.equal(app.nodes.get("card-eats").textContent.length > 0, true);
    assert.equal(speech.spoken.at(-1), cardSpeech("plankton"));
    assert.deepEqual(JSON.parse(storage.getItem(MET_KEY)), ["plankton"]);

    const frozen = { ...app.world.player };
    app.key("ArrowRight");
    app.frame(48);
    assert.deepEqual(app.world.player, frozen, "the fish waits while the card is open");

    app.click("card-close");
    assert.equal(app.world.phase, "playing");
    assert.equal(app.nodes.get("card").hidden, true);
    assert.equal(speech.synth.speaking, false, "closing the card stops the voice");
    assert.ok(app.world.invulnerable >= 2, "a moment of safety after the card");
    assert.ok(app.world.nextCardAt >= app.world.time + 19);
    assert.equal(app.input.keys.size, 0, "keys pressed during the card do not steer afterwards");

    app.world.creatures = [{ x: app.world.player.x + 90, y: app.world.player.y, tier: 2, direction: 1, wobble: 0 }];
    app.frame(64);
    assert.equal(app.world.phase, "playing", "a second new animal does not open a card straight away");
    assert.equal(app.world.labels.length, 0);
    app.world.time = app.world.nextCardAt;
    app.frame(80);
    assert.equal(app.world.phase, "meeting");
    assert.equal(app.nodes.get("card-name").textContent, "Mackerel");
    app.key("Enter");
    assert.equal(app.world.phase, "playing", "Enter closes the card too");
  } finally { app.close(); }
});

test("an animal met before gets a name tag and one short line, once per swim", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage({ [MET_KEY]: '["plankton"]' }), speech.globals);
  try {
    app.click("start-button");
    speech.synth.speaking = false;
    Object.assign(app.world, { creatures: [plankton(app.world)], friends: [], time: 5 });
    app.frame(16);
    assert.equal(app.world.phase, "playing");
    assert.deepEqual(app.world.labels.map(label => label.text), ["Plankton"]);
    assert.match(speech.spoken.at(-1), /^Plankton! /);
    const said = speech.spoken.length;
    app.frame(32);
    assert.equal(app.world.labels.length, 1, "no second tag in the same swim");
    assert.equal(speech.spoken.length, said);

    app.click("restart-button");
    speech.synth.speaking = false;
    Object.assign(app.world, { creatures: [plankton(app.world)], friends: [] });
    app.frame(48);
    assert.deepEqual(app.world.labels.map(label => label.text), ["Plankton"], "a new swim greets it again");
  } finally { app.close(); }
});

test("a bump and a growth say the food chain out loud", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage(), speech.globals);
  try {
    app.click("start-button");
    Object.assign(app.world, { invulnerable: 0, friends: [],
      creatures: [{ ...app.world.player, tier: 2, direction: 1, wobble: 0 }] });
    app.frame(16);
    assert.equal(app.world.hearts, 2);
    assert.equal(app.nodes.get("toast").textContent, "Watch out! Mackerel eat sardines!");
    assert.equal(speech.spoken.at(-1), hurtLine("mackerel", 0));

    Object.assign(app.world, { stage: 1, bites: 6, friends: [],
      creatures: [{ ...app.world.player, tier: 1, direction: 1, wobble: 0 }] });
    app.frame(32);
    assert.equal(app.world.stage, 2);
    assert.equal(app.nodes.get("toast").textContent, "You're a squid now! Squid eat mackerel. Watch out for tuna!");
    assert.equal(speech.spoken.at(-1), growLine(2));
  } finally { app.close(); }
});

test("the Ocean book shows who you have met and replays their cards", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage({ [MET_KEY]: '["plankton","crab"]' }), speech.globals);
  try {
    app.click("intro-book-button");
    assert.equal(app.nodes.get("book").hidden, false);
    assert.equal(app.nodes.get("intro").hidden, true);
    assert.equal(app.nodes.get("hud").hidden, true, "no swim is running yet");
    assert.equal(app.nodes.get("book-count").textContent, "You've met 2 of 33 ocean animals");
    const chain = app.nodes.get("book-chain").innerHTML;
    assert.match(chain, /class="book-tile" type="button" data-kind="plankton"/);
    assert.match(chain, /class="book-tile locked" type="button" data-kind="sardine"/);
    assert.match(app.nodes.get("book-friends").innerHTML, /class="book-tile" type="button" data-kind="crab"><img src="art\/animals\/crab.webp"/);

    app.key("Enter");
    assert.equal(app.world.phase, "ready", "Enter in the book does not start a swim");
    const tile = kind => ({ target: { closest: () => ({ dataset: { kind } }) } });
    app.nodes.get("book-friends").emit("click", tile("crab"));
    assert.equal(app.nodes.get("card").hidden, false);
    assert.equal(app.nodes.get("card-kicker").textContent, "Ocean book");
    assert.equal(app.nodes.get("card-close").textContent, "Back to the book");
    assert.equal(speech.spoken.at(-1), cardSpeech("crab"));
    app.key("Escape");
    assert.equal(app.nodes.get("card").hidden, true);
    assert.equal(app.nodes.get("book").hidden, false, "closing a book card goes back to the book");

    app.nodes.get("book-chain").emit("click", tile("sardine"));
    assert.equal(app.nodes.get("card").hidden, true, "animals not met yet stay hidden");
    assert.equal(app.nodes.get("book-count").textContent, "Keep swimming to find that one!");
    app.click("book-close");
    assert.equal(app.nodes.get("intro").hidden, false);
    assert.equal(app.world.phase, "ready");

    app.click("start-button");
    app.key("p");
    app.click("paused-book-button");
    assert.equal(app.nodes.get("book").hidden, false);
    app.click("book-close");
    assert.equal(app.nodes.get("paused").hidden, false, "the book goes back to the pause screen");
    assert.equal(app.world.phase, "paused");
  } finally { app.close(); }
});

test("the voice can be switched off from the start screen, and the choice is kept", async () => {
  const storage = memoryStorage();
  const speech = fakeSpeech();
  let app = await openGame(storage, speech.globals);
  try {
    assert.equal(app.nodes.get("intro-voice-button").hidden, false);
    app.click("intro-voice-button");
    assert.equal(storage.getItem(VOICE_KEY), "off");
    assert.equal(app.nodes.get("intro-voice-button").textContent, "🔇");
    assert.equal(app.nodes.get("voice-button").textContent, "🔇", "the in-game button agrees");
    app.click("start-button");
    assert.deepEqual(speech.spoken, [], "nothing is said with the voice off");
    assert.equal(app.nodes.get("toast").textContent, growLine(0), "the words still show");
    app.click("voice-button");
    assert.deepEqual(speech.spoken, ["Voice on!"], "turning it on speaks from the tap, which iPhone needs");
    app.click("voice-button");
    app.close();
    app = await openGame(storage, speech.globals);
    assert.equal(app.nodes.get("voice-button").textContent, "🔇");
    app.close();
    app = await openGame(storage);
    assert.equal(app.nodes.get("voice-button").hidden, true, "no button on a device that cannot speak");
    assert.equal(app.nodes.get("intro-voice-button").hidden, true);
  } finally { app.close(); }
});

test("Enter on a focused button only presses that button", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage({ [MET_KEY]: '["crab"]' }), speech.globals);
  const button = { closest: selector => selector.split(", ").includes("button") ? {} : null };
  try {
    app.key("Enter", button);
    assert.equal(app.world.phase, "ready", "Enter on the Ocean book button does not also start a swim");
    app.click("intro-book-button");
    app.nodes.get("book-friends").emit("click", { target: { closest: () => ({ dataset: { kind: "crab" } }) } });
    app.key("Enter", button);
    assert.equal(app.nodes.get("card").hidden, false, "Enter on Hear it again keeps the card open");
    app.click("card-close");
    app.click("book-close");
    app.click("start-button");
    app.key("ArrowRight");
    assert.ok(app.input.keys.has("ArrowRight"), "arrow keys steer after using the book");
  } finally { app.close(); }
});

test("a card that opens in the same moment as growing is read out, not cut off", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage(), speech.globals);
  try {
    app.click("start-button");
    Object.assign(app.world, { bites: 5, time: 5.1, friends: [], creatures: [
      { ...app.world.player, tier: 0, direction: 1, wobble: 0 },
      { x: app.world.player.x + 100, y: app.world.player.y, tier: 3, direction: 1, wobble: 0 }] });
    app.frame(16);
    assert.equal(app.world.stage, 1);
    assert.equal(app.world.phase, "meeting");
    assert.equal(speech.spoken.at(-1), cardSpeech("squid"));
  } finally { app.close(); }
});
