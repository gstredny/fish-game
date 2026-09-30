import test from "node:test";
import assert from "node:assert/strict";
import { growLine, SPECIES } from "../src/species.js";
import { createMission, missionLine } from "../src/missions.js";
import { ZONES } from "../src/zones.js";
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

test("Home goes back to the start screen from the pause, win and game-over screens", async () => {
  const app = await openGame(memoryStorage());
  try {
    app.click("start-button");
    app.key("ArrowRight");
    app.click("pause-button");
    assert.equal(app.nodes.get("paused").hidden, false);
    app.click("paused-home-button");
    assert.equal(app.nodes.get("intro").hidden, false);
    assert.equal(app.nodes.get("paused").hidden, true);
    assert.equal(app.world.phase, "ready");
    assert.equal(app.nodes.get("hud").hidden, true);
    assert.equal(app.input.keys.size, 0, "a key held when leaving does not steer the next swim");

    app.click("start-button");
    Object.assign(app.world, { hearts: 1, invulnerable: 0, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
    app.frame(16);
    assert.equal(app.world.phase, "gameover");
    app.frame(32);
    assert.equal(app.nodes.get("gameover").hidden, false);
    app.click("gameover-home-button");
    assert.equal(app.nodes.get("intro").hidden, false);
    assert.equal(app.world.phase, "ready");
    assert.equal(app.world.hearts, 3, "the next swim starts fresh");

    app.click("start-button");
    Object.assign(app.world, { stage: 3, bites: 99, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
    app.world.mission = createMission("hunt", "little", app.world.zone);
    app.frame(48);
    app.click("mission-go");
    app.world.creatures = [0, 1].map(() => ({ ...app.world.player, tier: 4, wobble: 0 }));
    app.frame(64);
    assert.equal(app.world.phase, "won");
    app.click("won-home-button");
    assert.equal(app.nodes.get("intro").hidden, false);
    assert.equal(app.world.reef.pending, 1, "the coral earned is kept for later");
    pickZone(app, "reef");
    app.click("start-button");
    assert.equal(app.world.zone.id, "reef", "and another place can be picked");
  } finally { app.close(); }
});

test("animals met before are greeted one at a time, with a breath between", async () => {
  const speech = fakeSpeech();
  const app = await openGame(memoryStorage({ [MET_KEY]: '["plankton","sardine","mackerel"]' }), speech.globals);
  try {
    app.click("start-button");
    const near = (tier, dx) => ({ x: app.world.player.x + dx, y: app.world.player.y, tier, direction: 1, wobble: 0 });
    Object.assign(app.world, { time: 5, friends: [], creatures: [near(0, 40), near(2, 70)] });
    app.frame(16);
    assert.deepEqual(app.world.labels.map(label => label.text), ["Plankton"], "the nearest one first, alone");
    app.frame(32);
    assert.equal(app.world.labels.length, 1, "the mackerel waits its turn");
    app.world.time += 6;
    app.frame(48);
    assert.deepEqual(app.world.labels.map(label => label.text).sort(), ["Mackerel", "Plankton"].sort(), "then it is greeted too");
    assert.deepEqual(speech.spoken.filter(line => /^(Plankton|Mackerel)! /.test(line)).length, 2);
    assert.ok(Object.keys(SPECIES).length > 0);
  } finally { app.close(); }
});
