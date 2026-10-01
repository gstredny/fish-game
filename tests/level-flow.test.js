import test from "node:test";
import assert from "node:assert/strict";
import { levelDoneLine, LEVELS_KEY, LOCKED_LINE, OCEAN_DONE_LINE } from "../src/levels.js";
import { MET_KEY } from "../src/ocean-book.js";
import { openGame } from "./app-fixture.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries(saved));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key) };
}

function fakeSpeech() {
  const spoken = [];
  const synth = { speaking: false, pending: false, speak: line => { if (line.text.trim()) spoken.push(line.text); },
    cancel() {}, getVoices: () => [], addEventListener() {} };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  return { spoken, globals: { speechSynthesis: synth, SpeechSynthesisUtterance } };
}

const pickZone = (app, id) => app.nodes.get("zone-pick").emit("click", { target: { closest: () => ({ dataset: { zone: id } }) } });
const zoneButton = (app, id) => new RegExp(`<button class="zone-button[^"]*" type="button" data-zone="${id}"[^>]*>.*?</button>`).exec(app.nodes.get("zone-pick").innerHTML)?.[0] ?? "";

// Grows straight to the biggest form, then eats what the mission asks for (Math.random is 0, so a
// place's first mission is the hunt, and a swim right after it there is the snack).
function winSwim(app) {
  Object.assign(app.world, { stage: 3, bites: 99, friends: [], creatures: [{ ...app.world.player, tier: 3, wobble: 0 }] });
  app.frame(16);
  assert.equal(app.world.phase, "mission");
  app.click("mission-go");
  const tier = { hunt: 4, snack: 3 }[app.world.mission.id];
  assert.ok(tier, app.world.mission.id);
  app.world.creatures = Array.from({ length: app.world.mission.need }, () => ({ ...app.world.player, tier, wobble: 0 }));
  app.frame(32);
}

test("the places open in order, a finished level opens the next, and the last one ends the ocean", async () => {
  const random = Math.random;
  Math.random = () => 0;
  const storage = memoryStorage();
  const speech = fakeSpeech();
  let app = await openGame(storage, speech.globals);
  try {
    assert.equal(app.world.zone.id, "reef", "a new swimmer starts on the reef");
    assert.match(zoneButton(app, "reef"), /aria-pressed="true"/);
    assert.match(zoneButton(app, "reef"), /zone-number">1<\/span>Coral reef<\/span><span class="zone-blurb">Sunny, warm and busy</);
    assert.match(zoneButton(app, "open"), /class="zone-button locked".*aria-disabled="true"/);
    assert.match(zoneButton(app, "open"), /zone-number">2<\/span>Open ocean<\/span><span class="zone-blurb">🔒 Locked</);
    assert.doesNotMatch(zoneButton(app, "open"), /zone-new/, "a locked place does not count its new animals");
    pickZone(app, "deep");
    assert.equal(app.world.zone.id, "reef", "a locked place cannot be picked");
    assert.equal(speech.spoken.at(-1), LOCKED_LINE);
    assert.equal(storage.getItem("little-fish-zone-v1"), null);

    app.click("start-button");
    winSwim(app);
    assert.equal(app.world.phase, "won");
    assert.ok(!app.nodes.get("won").hidden);
    assert.equal(app.nodes.get("won-title").textContent, "Level complete!");
    assert.match(app.nodes.get("won-text").textContent, /^You ate 2 reef sharks! You finished the coral reef! Next stop: the open ocean\.$/);
    assert.equal(speech.spoken.at(-1), levelDoneLine("reef"));
    assert.equal(storage.getItem(LEVELS_KEY), JSON.stringify(["reef"]));
    const next = app.nodes.get("won-next-button");
    assert.ok(!next.hidden);
    assert.match(next.innerHTML, /^Next: Open ocean/);
    assert.equal(next.className, "primary-button");
    assert.equal(app.nodes.get("win-plant-button").className, "text-button", "the coral waits; the next level is the big button");

    app.click("won-next-button");
    assert.equal(app.world.phase, "playing");
    assert.equal(app.world.zone.id, "open");
    assert.equal(app.nodes.get("stage-name").textContent, "Little sardine");
    winSwim(app);
    assert.equal(storage.getItem(LEVELS_KEY), JSON.stringify(["reef", "open"]));
    app.click("won-home-button");
    assert.match(app.nodes.get("player-pick").innerHTML, /Player 1<\/span><span class="player-level">Level 3 of 4</, "the spot shows the level it is on");
    assert.match(zoneButton(app, "reef"), /zone-blurb">Done!</);
    assert.match(zoneButton(app, "deep"), /zone-number">3<\/span>The deep<\/span><span class="zone-blurb">Dark, cold and full of lights</);
    assert.match(zoneButton(app, "bottom"), /locked/);

    // Swimming a finished level again is an ordinary mission.
    pickZone(app, "open");
    app.click("start-button");
    winSwim(app);
    assert.equal(app.nodes.get("won-title").textContent, "Mission complete!");
    assert.match(app.nodes.get("won-text").textContent, /^You ate 3 squid! You earned a coral colony!/);
    assert.equal(app.nodes.get("won-next-button").className, "text-button");
    assert.equal(app.nodes.get("win-plant-button").className, "primary-button");

    app.click("won-next-button");
    assert.equal(app.world.zone.id, "deep");
    winSwim(app);
    app.click("won-next-button");
    assert.equal(app.world.zone.id, "bottom");
    winSwim(app);
    assert.ok(app.nodes.get("won").hidden, "the last level does not get the mission screen");
    assert.ok(!app.nodes.get("finished").hidden, "it gets the end of the ocean");
    assert.equal(speech.spoken.at(-1), OCEAN_DONE_LINE);
    assert.equal(storage.getItem(LEVELS_KEY), JSON.stringify(["reef", "open", "deep", "bottom"]));
    app.click("finished-home-button");
    assert.ok(!app.nodes.get("intro").hidden);
    assert.match(zoneButton(app, "bottom"), /zone-number">4<\/span>The bottom<\/span><span class="zone-blurb">Done!</);
    app.close();

    app = await openGame(storage, speech.globals);
    assert.equal(app.world.zone.id, "bottom", "the phone remembers the last place");
    for (const id of ["reef", "open", "deep", "bottom"]) assert.doesNotMatch(zoneButton(app, id), /locked/);
  } finally { app.close(); Math.random = random; }
});

test("a save from before levels keeps its Ocean book but starts on the reef", async () => {
  const storage = memoryStorage({ [MET_KEY]: JSON.stringify(["sardine", "tuna", "viperfish"]), "little-fish-zone-v1": "deep" });
  const app = await openGame(storage);
  try {
    assert.equal(app.world.zone.id, "reef");
    assert.match(zoneButton(app, "deep"), /locked/);
    app.click("intro-book-button");
    assert.match(app.nodes.get("book-count").textContent, /^You've met 3 of/);
  } finally { app.close(); }
});
