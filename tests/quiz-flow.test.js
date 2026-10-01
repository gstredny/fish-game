import test from "node:test";
import assert from "node:assert/strict";
import { cardSpeech, growLine } from "../src/species.js";
import { SHARK } from "../src/rules.js";
import { ZONES } from "../src/zones.js";
import { WHAT_ANIMAL } from "../src/lines.js";
import { OPEN_SEA, openGame } from "./app-fixture.js";

const STARS_KEY = "little-fish-stars-v1";

// Every level open, swimming the reef: a damselfish first, then a lionfish.
function memoryStorage(saved = {}) {
  const data = new Map(Object.entries({ ...OPEN_SEA, "little-fish-zone-v1": "reef", ...saved }));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key) };
}

// Records what the game says; `speaking` stays true until the game stops, so polite greetings wait.
function fakeSpeech() {
  const spoken = [];
  const synth = { speaking: false, pending: false, speak: line => { spoken.push(line.text); synth.speaking = true; },
    cancel: () => { synth.speaking = false; }, getVoices: () => [], addEventListener() {} };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  return { spoken, globals: { speechSynthesis: synth, SpeechSynthesisUtterance } };
}

let clock = 0;
const nextFrame = app => app.frame(clock += 16);

function meetPlankton(app) {
  Object.assign(app.world, { creatures: [{ x: app.world.player.x + 60, y: app.world.player.y, tier: 0, direction: 1, wobble: 0 }],
    friends: [], time: 5.1 });
  nextFrame(app);
  assert.equal(app.world.phase, "meeting");
  assert.equal(app.nodes.get("card-kicker").textContent, WHAT_ANIMAL);
}

const offered = app => [...app.nodes.get("card-choices").innerHTML.matchAll(/data-pick="([^"]+)"/g)].map(match => match[1]);
const pick = (app, kind) => app.nodes.get("card-choices").emit("click", { target: { closest: () => ({ dataset: { pick: kind } }) } });

// Closes the card into an empty sea and lets one frame run its events.
function keepSwimming(app) {
  app.click("card-close");
  Object.assign(app.world, { creatures: [], friends: [] });
  nextFrame(app);
}

test("a right pick earns a star, and closing the card makes a damselfish a lionfish", async () => {
  const storage = memoryStorage();
  const speech = fakeSpeech();
  const app = await openGame(storage, speech.globals);
  try {
    app.click("start-button");
    assert.equal(app.nodes.get("stage-name").textContent, "Little damselfish");
    assert.equal(app.nodes.get("stars").textContent, "⭐ 0");
    meetPlankton(app);
    assert.equal(app.nodes.get("card-choices").hidden, false);
    assert.equal(offered(app).length, 3);
    assert.ok(offered(app).includes("plankton"));
    assert.equal(app.nodes.get("card-name").textContent, "?");

    pick(app, "plankton");
    assert.match(app.nodes.get("card-kicker").textContent, /^That's right!/);
    assert.equal(app.nodes.get("card-name").textContent, "Plankton");
    assert.equal(app.nodes.get("card-choices").hidden, true);
    assert.equal(app.nodes.get("card").classList.contains("guessing"), false);
    assert.equal(app.nodes.get("stars").textContent, "⭐ 1");
    assert.equal(storage.getItem(STARS_KEY), "1");
    assert.equal(speech.spoken.at(-1), cardSpeech("plankton"));
    assert.equal(app.world.stage, 0, "the card is read before the fish grows");

    keepSwimming(app);
    assert.equal(app.world.phase, "playing");
    assert.equal(app.world.stage, 1);
    assert.equal(app.world.bites, 0);
    assert.equal(app.nodes.get("stage-name").textContent, "Lionfish");
    assert.equal(speech.spoken.at(-1), growLine(ZONES.reef, 1));
  } finally { app.close(); }
});

test("a wrong pick shows the right name: no star, and the fish stays its size", async () => {
  const storage = memoryStorage();
  const app = await openGame(storage, fakeSpeech().globals);
  try {
    app.click("start-button");
    meetPlankton(app);
    pick(app, offered(app).find(kind => kind !== "plankton"));
    assert.equal(app.nodes.get("card-kicker").textContent, "Good try!");
    assert.equal(app.nodes.get("card-name").textContent, "Plankton");
    assert.equal(app.nodes.get("stars").textContent, "⭐ 0");
    assert.equal(storage.getItem(STARS_KEY), null);
    keepSwimming(app);
    assert.equal(app.world.stage, 0);
  } finally { app.close(); }
});

test("Tell me! names it without a star", async () => {
  const app = await openGame(memoryStorage(), fakeSpeech().globals);
  try {
    app.click("start-button");
    meetPlankton(app);
    app.click("card-close");
    assert.equal(app.nodes.get("card-name").textContent, "Plankton");
    assert.equal(app.nodes.get("stars").textContent, "⭐ 0");
    keepSwimming(app);
    assert.equal(app.world.stage, 0);
  } finally { app.close(); }
});

test("a right pick one size before the biggest starts the mission", async () => {
  const app = await openGame(memoryStorage(), fakeSpeech().globals);
  try {
    app.click("start-button");
    app.world.stage = SHARK - 1;
    meetPlankton(app);
    pick(app, "plankton");
    keepSwimming(app);
    assert.equal(app.world.stage, SHARK);
    assert.equal(app.world.phase, "mission");
    assert.ok(app.world.mission.active);
  } finally { app.close(); }
});

test("stars are each player's own, last across a reload, and Erase clears them", async () => {
  const storage = memoryStorage({ [STARS_KEY]: "4" });
  let app = await openGame(storage, fakeSpeech().globals);
  try {
    assert.equal(app.nodes.get("stars").textContent, "⭐ 4");
    app.nodes.get("player-pick").emit("click", { target: { closest: () => ({ dataset: { player: "2" } }) } });
    assert.equal(app.nodes.get("stars").textContent, "⭐ 0");
  } finally { app.close(); }

  storage.setItem("little-fish-player-v1", "1");
  app = await openGame(storage, fakeSpeech().globals);
  try {
    assert.equal(app.nodes.get("stars").textContent, "⭐ 4");
    app.click("player-erase");
    app.click("erase-yes");
    assert.equal(storage.getItem(STARS_KEY), null);
    assert.equal(app.nodes.get("stars").textContent, "⭐ 0");
  } finally { app.close(); }
});
