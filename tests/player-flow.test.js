import test from "node:test";
import assert from "node:assert/strict";
import { MET_KEY } from "../src/ocean-book.js";
import { LEVELS_KEY } from "../src/levels.js";
import { NAME_KEY, PLAYER_KEY } from "../src/players.js";
import { openGame } from "./app-fixture.js";

function memoryStorage(saved = {}) {
  const data = new Map(Object.entries(saved));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key) };
}

const pickZone = (app, id) => app.nodes.get("zone-pick").emit("click", { target: { closest: () => ({ dataset: { zone: id } }) } });
const pickPlayer = (app, slot) => app.nodes.get("player-pick").emit("click", { target: { closest: () => ({ dataset: { player: slot } }) } });
const slotButton = (app, slot) => new RegExp(`<button class="player-button" type="button" data-player="${slot}"[^>]*>.*?</button>`).exec(app.nodes.get("player-pick").innerHTML)?.[0] ?? "";
const plankton = world => ({ x: world.player.x + 60, y: world.player.y, tier: 0, direction: 1, wobble: 0 });

function bookCount(app) {
  app.click("intro-book-button");
  const count = app.nodes.get("book-count").textContent;
  app.click("book-close");
  return count;
}

function typeName(app, name) {
  app.nodes.get("name-input").value = name;
  app.click("name-save");
}

test("three save spots on one phone keep their own name, Ocean book, reef, level and place", async () => {
  // A save from before there were spots: it stays the first spot's, called Player 1 until it is named.
  const before = {
    [MET_KEY]: JSON.stringify(["sardine", "tuna"]),
    "little-fish-level-v1": "big",
    "little-fish-zone-v1": "deep",
    [LEVELS_KEY]: '["reef","open"]'
  };
  const storage = memoryStorage(before);
  let app = await openGame(storage);
  try {
    assert.match(slotButton(app, "1"), /aria-pressed="true".*Player 1<\/span><span class="player-level">Level 3 of 4</);
    assert.match(slotButton(app, "2"), /aria-pressed="false".*Player 2<\/span><span class="player-level">New swimmer</);
    assert.match(slotButton(app, "3"), /Player 3<\/span><span class="player-level">New swimmer</);
    assert.ok(app.nodes.get("name-box").hidden, "no name is asked for until a spot wants one");
    assert.match(bookCount(app), /^You've met 2 of/);
    assert.equal(app.world.zone.id, "deep");

    pickPlayer(app, "2");
    assert.ok(!app.nodes.get("name-box").hidden, "a new spot asks for a name");
    typeName(app, "  Dora  ");
    assert.ok(app.nodes.get("name-box").hidden);
    assert.equal(storage.getItem(`${NAME_KEY}-player-2`), "Dora");
    assert.match(slotButton(app, "2"), /aria-pressed="true".*Dora<\/span><span class="player-level">Level 1 of 4</);
    assert.equal(app.nodes.get("player-erase").textContent, "Erase Dora");
    assert.match(bookCount(app), /^You've met 0 of/, "Dora starts with an empty Ocean book");
    assert.equal(app.world.zone.id, "reef", "and the first level");
    pickZone(app, "reef");
    app.click("start-button");
    assert.equal(app.world.level, "little", "and Little swimmer");
    Object.assign(app.world, { creatures: [plankton(app.world)], friends: [], time: 5.1 });
    app.frame(16);
    assert.equal(app.world.phase, "meeting", "Dora meets plankton for the first time");
    app.click("card-close");
    for (const [key, value] of Object.entries(before)) assert.equal(storage.getItem(key), value, `Player 1's ${key} is untouched`);
    app.close();

    app = await openGame(storage);
    assert.equal(app.world.zone.id, "reef", "the phone remembers Dora played last");
    assert.match(slotButton(app, "2"), /aria-pressed="true".*Dora</);
    assert.match(bookCount(app), /^You've met 1 of/);
    pickPlayer(app, "1");
    assert.ok(app.nodes.get("name-box").hidden, "a spot with a save does not ask for a name");
    assert.match(bookCount(app), /^You've met 2 of/);
    assert.equal(app.world.zone.id, "deep");
    app.click("start-button");
    assert.equal(app.world.level, "big");
  } finally { app.close(); }
});

test("a spot can be renamed, and erased after a second tap, which empties it", async () => {
  const storage = memoryStorage({ [MET_KEY]: '["sardine"]', [LEVELS_KEY]: '["reef"]', [NAME_KEY]: "George" });
  const app = await openGame(storage);
  try {
    assert.match(slotButton(app, "1"), /George<\/span><span class="player-level">Level 2 of 4</);
    app.click("player-rename");
    assert.ok(!app.nodes.get("name-box").hidden);
    assert.equal(app.nodes.get("name-input").value, "George", "the old name is there to change");
    app.nodes.get("name-input").value = "<b>Max</b> the Fish Who Swims Far";
    app.click("name-save");
    assert.equal(storage.getItem(NAME_KEY), "<b>Max</b> t", "names stop at twelve letters");
    assert.match(slotButton(app, "1"), /&lt;b&gt;Max&lt;\/b&gt; t<\/span>/, "and are shown as typed, not as HTML");
    app.click("player-rename");
    app.nodes.get("name-input").value = "   ";
    app.click("name-save");
    assert.equal(storage.getItem(NAME_KEY), null, "a blank name goes back to Player 1");
    assert.match(slotButton(app, "1"), /Player 1<\/span>/);
    app.click("player-rename");
    app.nodes.get("name-input").value = "Nope";
    app.click("name-cancel");
    assert.equal(storage.getItem(NAME_KEY), null, "Never mind keeps the old name");
    assert.ok(app.nodes.get("name-box").hidden);

    app.click("player-erase");
    assert.ok(!app.nodes.get("erase-ask").hidden, "erasing asks first");
    assert.match(app.nodes.get("erase-text").textContent, /^Really erase Player 1\?/);
    app.click("erase-no");
    assert.ok(app.nodes.get("erase-ask").hidden);
    assert.equal(storage.getItem(MET_KEY), '["sardine"]', "Keep keeps everything");
    app.click("player-erase");
    app.click("erase-yes");
    assert.ok(app.nodes.get("erase-ask").hidden);
    assert.deepEqual([...storage.data.keys()].filter(key => key !== PLAYER_KEY), [], "every save of that spot is gone");
    assert.match(slotButton(app, "1"), /aria-pressed="true".*Player 1<\/span><span class="player-level">New swimmer</);
    assert.match(bookCount(app), /^You've met 0 of/);
    assert.equal(app.world.zone.id, "reef");
  } finally { app.close(); }
});

test("a finished ocean shows on the spot, and typing a name does not steer the fish", async () => {
  const storage = memoryStorage({ [LEVELS_KEY]: '["reef","open","deep","bottom"]', [NAME_KEY]: "Dora" });
  const app = await openGame(storage);
  try {
    assert.match(slotButton(app, "1"), /Dora<\/span><span class="player-level">Finished! ★</);
    app.click("player-rename");
    const input = { tagName: "INPUT" };
    app.key("p", input);
    app.key("ArrowLeft", input);
    assert.equal(app.input.keys.size, 0, "letters typed into the name box are not game keys");
    app.nodes.get("name-input").value = "Dora B";
    app.key("Enter", input);
    assert.equal(storage.getItem(NAME_KEY), "Dora B", "Enter saves the name");
    assert.ok(app.nodes.get("name-box").hidden);
    assert.equal(app.world.phase, "ready", "and does not start the swim");
    app.click("player-rename");
    app.key("Escape", input);
    assert.ok(app.nodes.get("name-box").hidden, "Escape closes the box");
    assert.equal(app.world.phase, "ready");
  } finally { app.close(); }
});
