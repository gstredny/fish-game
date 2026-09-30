import test from "node:test";
import assert from "node:assert/strict";
import { growLine } from "../src/species.js";
import { createMission, missionLine } from "../src/missions.js";
import { ZONES } from "../src/zones.js";
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

const pickZone = (app, id) => app.nodes.get("zone-pick").emit("click", { target: { closest: () => ({ dataset: { zone: id } }) } });

test("where to swim is chosen on the start screen, remembered, and fills the swim with that place's animals", async () => {
  const storage = memoryStorage();
  const speech = fakeSpeech();
  let app = await openGame(storage, speech.globals);
  try {
    assert.match(app.nodes.get("zone-pick").innerHTML, /data-zone="reef" aria-pressed="false"/);
    assert.match(app.nodes.get("zone-pick").innerHTML, /data-zone="open" aria-pressed="true"/, "the open ocean is the first choice");
    assert.match(app.nodes.get("zone-pick").innerHTML, /Coral reef<\/span><span class="zone-blurb">Sunny, warm and busy<\/span><span class="zone-new">\d+ new<\/span>/);
    pickZone(app, "reef");
    assert.equal(storage.getItem("little-fish-zone-v1"), "reef");
    assert.equal(app.world.zone, ZONES.reef, "the water behind the start screen is the reef");
    assert.match(app.nodes.get("zone-pick").innerHTML, /data-zone="reef" aria-pressed="true"/);
    app.click("start-button");
    assert.equal(app.world.zone.id, "reef");
    assert.equal(speech.spoken.at(-1), growLine(ZONES.reef, 0));
    assert.match(speech.spoken.at(-1), /^Welcome to the coral reef! You're a little damselfish!/);
    assert.equal(app.nodes.get("stage-name").textContent, "Little damselfish");
    assert.ok(app.world.creatures.length > 0);
    app.close();
    app = await openGame(storage, speech.globals);
    app.click("start-button");
    assert.equal(app.world.zone.id, "reef", "the choice is kept on this device");
    Object.assign(app.world, { stage: 3, bites: 99, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
    app.world.mission = createMission("hunt", "little", ZONES.reef);
    app.frame(16);
    assert.equal(app.world.phase, "mission");
    assert.equal(app.nodes.get("mission-kicker").textContent, "You're a tiger shark!");
    assert.equal(app.nodes.get("mission-goal").textContent, "Eat 2 reef sharks");
    assert.equal(app.nodes.get("mission-photo").src, "art/animals/reefshark.webp");
    assert.equal(speech.spoken.at(-1), missionLine(app.world.mission));
    assert.match(speech.spoken.at(-1), /^You're a tiger shark now! Tiger sharks eat reef sharks. Watch out for orcas! Your mission: eat 2 reef sharks!$/);
    assert.equal(app.nodes.get("stage-name").textContent, "Tiger shark");
  } finally { app.close(); }
});

test("finding the reef's giant, the whale shark, shows its card and ends the swim", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage({ "little-fish-zone-v1": "reef" }), speech.globals);
  try {
    app.click("start-button");
    Object.assign(app.world, { stage: 3, bites: 99, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
    app.world.mission = createMission("find", "little", ZONES.reef);
    app.frame(16);
    assert.equal(app.nodes.get("mission-goal").textContent, "Find the whale shark");
    app.click("mission-go");
    app.frame(32);
    const giant = app.world.friends.find(friend => friend.kind === "whaleshark");
    assert.ok(giant, "the whale shark swims in for the mission");
    Object.assign(app.world.player, { x: giant.x - 100, y: giant.y });
    app.frame(48);
    assert.equal(app.world.phase, "won");
    assert.equal(app.nodes.get("card-name").textContent, "Whale shark");
    app.click("card-close");
    assert.match(app.nodes.get("won-text").textContent, /^You found the whale shark! Whale sharks are the biggest fish!/);
  } finally { app.close(); }
});
