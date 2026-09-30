import test from "node:test";
import assert from "node:assert/strict";
import { allLines } from "../src/lines.js";
import { createMission, missionDoneLine, missionLine } from "../src/missions.js";
import { cardSpeech, searchLink } from "../src/species.js";
import { MET_KEY } from "../src/ocean-book.js";
import { openGame } from "./app-fixture.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries(saved));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

function fakeSpeech() {
  const spoken = [];
  const synth = { speaking: false, pending: false, speak: line => { if (line.text.trim()) spoken.push(line.text); },
    cancel() {}, getVoices: () => [], addEventListener() {} };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  return { spoken, globals: { speechSynthesis: synth, SpeechSynthesisUtterance } };
}

// Grows the fish into a shark on its mission.
function becomeShark(app, id) {
  app.world.mission = createMission(id, app.world.level);
  Object.assign(app.world, { stage: 3, bites: 99, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
  app.frame(16);
}

test("Little or Big swimmer is chosen on the start screen, remembered, and used for the swim", async () => {
  const storage = memoryStorage();
  let app = await openGame(storage);
  try {
    app.click("start-button");
    assert.equal(app.world.level, "little", "Little swimmer is the first choice");
    app.close();
    app = await openGame(storage);
    app.click("level-big");
    assert.equal(storage.getItem("little-fish-level-v1"), "big");
    app.click("start-button");
    assert.equal(app.world.level, "big");
    app.close();
    app = await openGame(storage);
    app.click("start-button");
    assert.equal(app.world.level, "big", "the choice is kept on this device");
  } finally { app.close(); }
});

test("becoming a shark shows and says the mission; finishing it ends the swim", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage(), speech.globals);
  try {
    app.click("start-button");
    becomeShark(app, "tuna");
    assert.equal(app.world.phase, "mission");
    assert.equal(app.nodes.get("mission").hidden, false);
    assert.equal(app.nodes.get("mission-goal").textContent, "Eat 2 tuna");
    assert.equal(app.nodes.get("mission-photo").src, "art/animals/tuna.webp");
    assert.equal(speech.spoken.at(-1), missionLine(app.world.mission));
    assert.equal(speech.spoken.filter(line => line.startsWith("You're a great white shark")).length, 1, "said once, not twice");

    const frozen = { ...app.world.player };
    app.key("ArrowRight");
    app.frame(32);
    assert.deepEqual(app.world.player, frozen, "the shark waits while the mission is shown");
    app.key("Enter");
    assert.equal(app.world.phase, "playing");
    assert.equal(app.input.keys.size, 0);
    assert.equal(app.nodes.get("growth-text").textContent, "Eat 2 tuna");

    app.world.creatures = [{ ...app.world.player, tier: 4, wobble: 0 }];
    app.frame(48);
    assert.equal(app.nodes.get("toast").textContent, "1 of 2 tuna!");
    assert.equal(app.nodes.get("progress-fill").style.width, "50%");
    app.world.creatures = [{ ...app.world.player, tier: 4, wobble: 0 }];
    app.frame(64);
    assert.equal(app.world.phase, "won");
    assert.equal(app.nodes.get("won").hidden, false);
    assert.match(app.nodes.get("won-text").textContent, /^You ate 2 tuna! You earned a coral colony/);
    assert.equal(speech.spoken.at(-1), missionDoneLine(app.world.mission));
    assert.equal(app.nodes.get("continue-button"), undefined, "no endless swimming after the mission");

    const finished = app.world.mission.id;
    app.click("win-restart-button");
    assert.equal(app.world.phase, "playing");
    assert.equal(app.world.stage, 0);
    assert.notEqual(app.world.mission.id, finished, "the next swim has a different mission");
  } finally { app.close(); }
});

test("finding the blue whale for the first time shows its card before the win screen", async () => {
  for (const known of [false, true]) {
    const speech = fakeSpeech();
    const storage = memoryStorage(known ? { [MET_KEY]: '["bluewhale"]' } : {});
    const app = await openGame(storage, speech.globals);
    try {
      app.click("start-button");
      becomeShark(app, "whale");
      app.click("mission-go");
      app.frame(32);
      const whale = app.world.friends.find(friend => friend.kind === "bluewhale");
      Object.assign(app.world.player, { x: whale.x - 100, y: whale.y });
      app.frame(48);
      assert.equal(app.world.phase, "won");
      if (known) {
        assert.equal(app.nodes.get("won").hidden, false, "a whale met before goes straight to the win screen");
        continue;
      }
      assert.equal(app.nodes.get("card").hidden, false);
      assert.equal(app.nodes.get("card-name").textContent, "Blue whale");
      assert.equal(app.nodes.get("card-close").textContent, "Next");
      assert.ok(JSON.parse(storage.getItem(MET_KEY)).includes("bluewhale"), "it goes in the Ocean book");
      assert.equal(speech.spoken.at(-1), cardSpeech("bluewhale"));
      app.key("Enter");
      assert.equal(app.nodes.get("card").hidden, true);
      assert.equal(app.nodes.get("won").hidden, false);
      assert.equal(speech.spoken.at(-1), missionDoneLine(app.world.mission));
    } finally { app.close(); }
  }
});

test("a fact card links to a kid-safe web search, when there is a connection", async () => {
  for (const onLine of [true, false]) {
    const app = await openGame(memoryStorage({ [MET_KEY]: '["crab"]' }), { navigator: { onLine } });
    try {
      app.click("intro-book-button");
      app.nodes.get("book-friends").emit("click", { target: { closest: () => ({ dataset: { kind: "crab" } }) } });
      const more = app.nodes.get("card-more");
      assert.equal(more.href, searchLink("crab"));
      assert.match(more.href, /^https:\/\/www\.google\.com\/search\?safe=active&q=Crab%20facts%20for%20kids$/);
      assert.equal(more.hidden, !onLine);
    } finally { app.close(); }
  }
});

test("everything the game says is a line with a recording", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage(), speech.globals);
  const lines = new Set(allLines());
  try {
    app.click("start-button");
    Object.assign(app.world, { invulnerable: 0, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
    app.frame(16);
    Object.assign(app.world, { time: 30, friends: [], creatures: [{ x: app.world.player.x + 60, y: app.world.player.y, tier: 0, direction: 1, wobble: 0 }] });
    app.frame(32);
    assert.equal(app.world.phase, "meeting");
    app.click("card-hear");
    app.click("card-close");
    app.click("voice-button");
    app.click("voice-button");
    for (const id of ["tuna", "squid", "friends", "whale", "orca"]) {
      app.click("pause-button");
      app.click("restart-button");
      becomeShark(app, id);
      app.click("mission-go");
      app.world.mission.done = true;
      app.world.events.push({ type: "done" });
      app.frame(48);
    }
    app.click("intro-book-button");
    app.nodes.get("book-chain").emit("click", { target: { closest: () => ({ dataset: { kind: "orca" } }) } });
    assert.ok(speech.spoken.length > 12);
    for (const line of speech.spoken) assert.ok(lines.has(line), `no recording for: ${line}`);
  } finally { app.close(); }
});
