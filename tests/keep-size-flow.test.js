import test from "node:test";
import assert from "node:assert/strict";
import { growLine } from "../src/species.js";
import { SHARK } from "../src/rules.js";
import { ZONES } from "../src/zones.js";
import { MET_KEY } from "../src/ocean-book.js";
import { OPEN_SEA, openGame } from "./app-fixture.js";

const CHECKPOINT_KEY = "little-fish-checkpoint-v1";

// Every level open, swimming the reef, every animal there met (no cards in the way).
function memoryStorage(saved = {}) {
  const data = new Map(Object.entries({ ...OPEN_SEA, "little-fish-zone-v1": "reef",
    [MET_KEY]: JSON.stringify([...ZONES.reef.chain, ...ZONES.reef.friends, ZONES.reef.giant]), ...saved }));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key) };
}

function fakeSpeech() {
  const spoken = [];
  const synth = { speaking: false, pending: false, speak: line => { spoken.push(line.text); synth.speaking = true; },
    cancel: () => { synth.speaking = false; }, getVoices: () => [], addEventListener() {} };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  return { spoken, globals: { speechSynthesis: synth, SpeechSynthesisUtterance } };
}

let clock = 0;
const nextFrame = app => app.frame(clock += 16);

// The last heart goes to a hunter two sizes up.
function loseLastHeart(app) {
  Object.assign(app.world, { hearts: 1, invulnerable: 0, friends: [],
    creatures: [{ ...app.world.player, tier: Math.min(app.world.stage + 2, 6), wobble: 0 }] });
  nextFrame(app);
  assert.equal(app.world.phase, "gameover");
  assert.equal(app.nodes.get("gameover").hidden, false);
}

test("losing all hearts as a lionfish starts the next swim as a lionfish, with full hearts", async () => {
  const storage = memoryStorage();
  const speech = fakeSpeech();
  const app = await openGame(storage, speech.globals);
  try {
    app.click("start-button");
    app.world.stage = 1;
    loseLastHeart(app);
    assert.equal(app.nodes.get("gameover-text").textContent, "You keep your size. You'll start again as a lionfish.");
    app.click("restart-button");
    assert.equal(app.world.phase, "playing");
    assert.equal(app.world.stage, 1);
    assert.equal(app.world.bites, 0);
    assert.equal(app.world.hearts, 3);
    assert.equal(app.nodes.get("stage-name").textContent, "Lionfish");
    assert.equal(speech.spoken.at(-1), growLine(ZONES.reef, 1));
  } finally { app.close(); }

  // Closing the app and coming back keeps it too.
  const again = await openGame(storage, fakeSpeech().globals);
  try {
    again.click("start-button");
    assert.equal(again.world.stage, 1);
  } finally { again.close(); }
});

test("Home and the same place later starts at the saved size; another place starts little", async () => {
  const app = await openGame(memoryStorage(), fakeSpeech().globals);
  const pick = id => app.nodes.get("zone-pick").emit("click", { target: { closest: () => ({ dataset: { zone: id } }) } });
  try {
    app.click("start-button");
    app.world.stage = 2;
    loseLastHeart(app);
    app.click("gameover-home-button");
    pick("open");
    app.click("start-button");
    assert.equal(app.world.stage, 0, "the open ocean has no saved size");
    app.click("pause-button");
    app.click("paused-home-button");
    pick("reef");
    app.click("start-button");
    assert.equal(app.world.stage, 2);
  } finally { app.close(); }
});

test("losing all hearts as the biggest form starts the next swim as the biggest, with its mission", async () => {
  const app = await openGame(memoryStorage(), fakeSpeech().globals);
  try {
    app.click("start-button");
    app.world.stage = SHARK;
    loseLastHeart(app);
    app.click("restart-button");
    assert.equal(app.world.stage, SHARK);
    assert.equal(app.world.phase, "mission");
    nextFrame(app);
    assert.equal(app.nodes.get("mission").hidden, false, "the mission card shows");
    app.click("mission-go");
    assert.equal(app.world.phase, "playing");
    assert.ok(app.world.mission.active);
  } finally { app.close(); }
});

test("finishing the mission clears the saved size, so the next swim starts little", async () => {
  const storage = memoryStorage({ [CHECKPOINT_KEY]: '{"reef":2}' });
  const app = await openGame(storage, fakeSpeech().globals);
  try {
    app.click("start-button");
    assert.equal(app.world.stage, 2);
    Object.assign(app.world.mission, { id: "hunt", done: true });
    app.world.phase = "won";
    app.world.events.push({ type: "done" });
    nextFrame(app);
    assert.equal(app.nodes.get("won").hidden, false);
    app.click("win-restart-button");
    assert.equal(app.world.stage, 0);
  } finally { app.close(); }
});

test("each player keeps their own saved sizes, and Erase clears them", async () => {
  const storage = memoryStorage({ [CHECKPOINT_KEY]: '{"reef":3}' });
  const app = await openGame(storage, fakeSpeech().globals);
  try {
    app.nodes.get("player-pick").emit("click", { target: { closest: () => ({ dataset: { player: "2" } }) } });
    app.nodes.get("player-pick").emit("click", { target: { closest: () => ({ dataset: { player: "1" } }) } });
    app.click("player-erase");
    app.click("erase-yes");
    assert.equal(storage.getItem(CHECKPOINT_KEY), null);
  } finally { app.close(); }

  const fresh = await openGame(memoryStorage({ [CHECKPOINT_KEY]: '{"reef":3}', "little-fish-player-v1": "2" }), fakeSpeech().globals);
  try {
    fresh.click("start-button");
    assert.equal(fresh.world.stage, 0, "Player 2 has no saved size");
  } finally { fresh.close(); }
});
