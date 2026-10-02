import test from "node:test";
import assert from "node:assert/strict";
import { openGame, OPEN_SEA } from "./app-fixture.js";
import { MET_KEY } from "../src/ocean-book.js";
import { PUFFER_LINES } from "../src/puffer-lines.js";

function memory(known = ["pufferfish"]) {
  const data = new Map(Object.entries({ ...OPEN_SEA, [MET_KEY]: JSON.stringify(known) }));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

const bookCard = (app, kind) => app.nodes.get("book-zones").emit("click", {
  target: { closest: () => ({ dataset: { kind } }) }
});

function smallPhone(app) {
  app.window.innerWidth = 568;
  app.window.innerHeight = 320;
  app.window.emit("resize");
}

function adventureFromPause(app) {
  smallPhone(app);
  app.click("start-button");
  app.click("pause-button");
  app.click("paused-book-button");
  bookCard(app, "pufferfish");
  app.click("card-be");
}

function clockFor(app) {
  let time = 0;
  app.frame(time += 50);
  return count => { for (let n = 0; n < count; n++) app.frame(time += 50); };
}

function assertClear(app, reason) {
  assert.deepEqual(app.input, { keys: new Set(), pointer: null, pad: null }, reason);
}

test("only a discovered pufferfish's book card enters the adventure", async () => {
  const app = await openGame(memory(["turtle"]));
  try {
    app.click("intro-book-button");
    bookCard(app, "pufferfish");
    assert.equal(app.nodes.get("book").hidden, false, "an unknown tile stays in the book");
    app.click("card-be");
    assert.equal(app.puffer.active, false);
    bookCard(app, "turtle");
    assert.equal(app.nodes.get("card-be").hidden, true);
    app.click("card-be");
    assert.equal(app.puffer.active, false, "another known animal cannot enter");
    app.click("card-close");
    app.click("book-close");
    app.click("start-button");
    app.world.nextCardAt = 0;
    app.world.creatures = [];
    app.world.friends = [{ kind: "pufferfish", ...app.world.player, size: 35, direction: 1, speed: 0, wobble: 0 }];
    app.frame(16);
    assert.equal(app.world.phase, "meeting");
    assert.equal(app.nodes.get("card").classList.contains("guessing"), true);
    assert.equal(app.nodes.get("card-be").hidden, true, "discovery keeps the normal quiz");
    app.click("card-be");
    assert.equal(app.puffer.active, false);
    app.nodes.get("card-choices").emit("click", { target: { closest: () => ({ dataset: { pick: "pufferfish" } }) } });
    app.click("card-close");
    assert.equal(app.world.stage, 1, "the discovery growth reward finishes first");
    app.click("pause-button");
    app.click("paused-book-button");
    bookCard(app, "pufferfish");
    assert.equal(app.nodes.get("card-be").hidden, false);
    app.click("card-be");
    assert.equal(app.puffer.active, true);
  } finally { app.close(); }
});

test("the adventure steers with existing inputs while the entire paused swim stays exact", async () => {
  const storage = memory();
  const app = await openGame(storage);
  try {
    app.click("start-button");
    Object.assign(app.world, { stage: 3, hearts: 2, bites: 4, invulnerable: 0.37, gulp: 0.25 });
    Object.assign(app.world.mission, { have: 2, need: 4, active: true });
    app.click("pause-button");
    app.click("paused-book-button");
    bookCard(app, "pufferfish");
    const worldBefore = structuredClone(app.world), savedBefore = new Map(storage.data);
    app.input.keys.add("ArrowLeft");
    app.input.pointer = { x: 1, y: 2 };
    app.input.pad = { x: 0, y: 1 };
    app.click("card-be");
    assert.deepEqual(app.input, { keys: new Set(), pointer: null, pad: null }, "entry clears all steering");
    assert.equal(app.puffer.state.phase, "intro");
    app.click("puffer-go");
    assert.equal(app.nodes.get("hud").hidden, true);
    assert.equal(app.nodes.get("puffer-ui").hidden, false);
    const start = { ...app.puffer.state.player };
    app.key("ArrowRight");
    app.frame(16);
    app.frame(66);
    assert.ok(app.puffer.state.player.x > start.x, "keys route before book guards");
    app.window.emit("keyup", { key: "ArrowRight" });
    app.input.pad = { x: -1, y: 0 };
    const right = app.puffer.state.player.x;
    app.frame(116);
    assert.ok(app.puffer.state.player.x < right, "the arrow pad steers the puffer");
    app.input.pad = null;
    app.nodes.get("ocean").emit("pointermove", { pointerType: "mouse", clientX: 300, clientY: 350 });
    const left = app.puffer.state.player.x;
    app.frame(166);
    assert.ok(app.puffer.state.player.x > left, "the mouse steers the puffer");
    app.key("Escape");
    const paused = structuredClone(app.puffer.state);
    app.frame(216);
    assert.deepEqual(app.puffer.state, paused, "pause stops scene simulation");
    app.key("Escape");
    app.key("ArrowLeft");
    app.click("puffer-back");
    assert.equal(app.puffer.active, false);
    assert.deepEqual(app.input, { keys: new Set(), pointer: null, pad: null }, "return clears all steering");
    assert.equal(app.nodes.get("book").hidden, false);
    assert.deepEqual(app.world, worldBefore, "return preserves every main-world field without resume or reset");
    assert.deepEqual(storage.data, savedBefore, "the scene never writes progression");
    app.click("book-close");
    assert.equal(app.nodes.get("paused").hidden, false, "Back restores the paused book origin");
    assert.deepEqual(app.world, worldBefore);
    app.click("resume-button");
    app.frame(266);
    assert.equal(app.world.phase, "playing");
    assert.ok(app.world.time > worldBefore.time, "the ordinary swim can continue normally");
  } finally { app.close(); }
});

test("an adventure from the start-screen book returns to the same start screen", async () => {
  const app = await openGame(memory());
  try {
    app.click("intro-book-button");
    bookCard(app, "pufferfish");
    const before = structuredClone(app.world);
    app.click("card-be");
    app.click("puffer-go");
    app.frame(16);
    app.key("ArrowRight");
    app.frame(66);
    app.click("puffer-back");
    app.click("book-close");
    assert.equal(app.nodes.get("intro").hidden, false);
    assert.deepEqual(app.world, before);
  } finally { app.close(); }
});

test("first touch shows the adventure pad without changing the paused world's pad boundary", async () => {
  const app = await openGame(memory());
  try {
    app.click("start-button");
    app.click("pause-button");
    app.click("paused-book-button");
    bookCard(app, "pufferfish");
    const before = structuredClone(app.world);
    app.click("card-be");
    app.window.emit("pointerdown", { pointerType: "touch" });
    assert.equal(app.nodes.get("pad").hidden, true, "intro hides the touch pad");
    app.click("puffer-go");
    assert.equal(app.nodes.get("pad").hidden, false);
    app.nodes.get("pad").emit("pointerdown", { pointerId: 1, clientX: 80, clientY: 0 });
    app.frame(16);
    app.frame(66);
    assert.deepEqual(app.world, before);
    app.window.emit("blur");
    assert.equal(app.puffer.state.phase, "paused");
    assert.equal(app.nodes.get("pad").hidden, true);
    assert.equal(app.input.pad, null);
    app.click("puffer-back");
    assert.deepEqual(app.world, before);
  } finally { app.close(); }
});

test("retry, defence, success, replay and exit preserve the paused world and clear held input", async () => {
  const storage = memory();
  const app = await openGame(storage);
  try {
    adventureFromPause(app);
    const before = structuredClone(app.world), saved = new Map(storage.data);
    const tick = clockFor(app);
    app.click("puffer-go");
    app.key("ArrowRight");
    tick(120);
    assert.equal(app.puffer.state.phase, "retry");
    assert.equal(app.nodes.get("puffer-instruction").textContent, "That was a close bump!");
    assertClear(app, "bump clears steering");
    assert.equal(app.nodes.get("puffer-dialog").hidden, false);
    assert.equal(app.nodes.get("puffer-puff").hidden, true);
    app.window.emit("blur");
    app.key("Escape");
    assert.equal(app.puffer.state.phase, "retry", "pause cannot bypass retry");
    app.input.pointer = { x: 10, y: 20 };
    app.input.pad = { x: -1, y: 0 };
    app.click("puffer-go");
    assertClear(app, "retry starts fresh with released steering");
    app.key("ArrowRight");
    tick(42);
    app.key(" ");
    tick(6);
    assert.equal(app.puffer.state.defended, true);
    assert.equal(app.puffer.state.hunter.phase, "retreating");
    tick(80);
    assert.equal(app.puffer.state.phase, "won");
    assert.equal(app.nodes.get("puffer-instruction").textContent, "Safe in the shelter!");
    assertClear(app, "success clears steering");
    app.document.hidden = true;
    app.document.emit("visibilitychange");
    app.key("Escape");
    assert.equal(app.puffer.state.phase, "won", "backgrounding cannot bypass success");
    app.document.hidden = false;
    app.input.pointer = { x: 500, y: 300 };
    app.input.keys.add("ArrowLeft");
    app.click("puffer-go");
    assert.equal(app.puffer.state.phase, "playing");
    assert.equal(app.puffer.state.defended, false);
    assert.equal(app.puffer.state.time, 0);
    assertClear(app, "replay clears held input");
    app.key("ArrowRight");
    app.input.pad = { x: 1, y: 0 };
    app.click("puffer-back");
    assertClear(app, "exit clears held input");
    assert.deepEqual(app.world, before);
    assert.deepEqual(storage.data, saved, "no encounter discovery or progress is saved");
    app.click("book-close");
    assert.equal(app.nodes.get("paused").hidden, false);
  } finally { app.close(); }
});

test("held Space never refreshes a puff; focused buttons retain native Space behavior", async () => {
  const app = await openGame(memory());
  try {
    adventureFromPause(app);
    const tick = clockFor(app);
    const focusedButton = { closest: () => ({ tagName: "BUTTON" }) };
    app.key(" ", focusedButton);
    assert.equal(app.puffer.state.phase, "intro");
    app.click("puffer-go");
    app.key(" ", focusedButton);
    assert.equal(app.puffer.state.puffLeft, 0, "native keydown does not also puff");
    app.key(" ");
    assert.equal(app.puffer.state.puffLeft, 3);
    tick(80);
    for (let n = 0; n < 10; n++) {
      app.window.emit("keydown", { key: " ", repeat: true });
      tick(1);
    }
    assert.equal(app.puffer.state.puffLeft, 0, "an auto-repeated held key does not puff again");
    app.window.emit("keyup", { key: " " });
    app.key(" ");
    assert.equal(app.puffer.state.puffLeft, 3, "a new press can puff");
  } finally { app.close(); }
});

test("a second thumb puffs immediately while the first thumb keeps steering", async () => {
  const app = await openGame(memory());
  try {
    adventureFromPause(app);
    app.window.emit("pointerdown", { pointerType: "touch" });
    app.click("puffer-go");
    const pad = app.nodes.get("pad");
    pad.emit("pointerdown", { pointerId: 1, pointerType: "touch", clientX: 80, clientY: 0 });
    const direction = { ...app.input.pad };
    app.nodes.get("puffer-puff").emit("pointerdown", { pointerId: 2, pointerType: "touch", button: 0, isPrimary: false });
    assert.ok(app.puffer.state.puffLeft > 0, "second contact activates defence before it lifts");
    assert.deepEqual(app.input.pad, direction);
    app.nodes.get("puffer-puff").emit("pointerup", { pointerId: 2, pointerType: "touch", isPrimary: false });
    pad.emit("pointermove", { pointerId: 1, clientX: -80, clientY: 0 });
    assert.deepEqual(app.input.pad, { x: -1, y: 0 }, "the first thumb still owns the pad");
    pad.emit("pointerup", { pointerId: 1, pointerType: "touch" });
    assert.equal(app.input.pad, null);
  } finally { app.close(); }
});

test("a long physical Puff press does not puff again on its synthesized click", async () => {
  for (const pointerType of ["touch", "pen", "mouse"]) {
    const app = await openGame(memory());
    try {
      adventureFromPause(app);
      const tick = clockFor(app);
      app.click("puffer-go");
      const button = app.nodes.get("puffer-puff");
      button.emit("pointerdown", { pointerId: 2, pointerType, button: 0 });
      assert.equal(app.puffer.state.puffLeft, 3);
      tick(80);
      assert.equal(app.puffer.state.puff, 0);
      button.emit("pointerup", { pointerId: 2, pointerType, button: 0 });
      button.emit("click", { detail: 1 });
      assert.equal(app.puffer.state.puffLeft, 0, "release cannot act as a fresh press");
      button.emit("pointerdown", { pointerId: 2, pointerType, button: 0 });
      assert.equal(app.puffer.state.puffLeft, 3, "a new physical press puffs again");
    } finally { app.close(); }
  }
});

test("blur, visibility and portrait pause play; resize anchors the goal and resume clears input", async () => {
  let portrait = false;
  const app = await openGame(memory());
  app.window.matchMedia = query => ({ matches: query.includes("orientation") && portrait });
  try {
    adventureFromPause(app);
    app.click("puffer-go");
    const tick = clockFor(app);
    for (const trigger of [
      () => app.window.emit("blur"),
      () => { app.document.hidden = true; app.document.emit("visibilitychange"); },
      () => { portrait = true; app.window.innerWidth = 320; app.window.innerHeight = 568; app.window.emit("resize"); }
    ]) {
      app.key("ArrowRight");
      app.input.pointer = { x: 1, y: 2 };
      app.input.pad = { x: 1, y: 0 };
      trigger();
      assert.equal(app.puffer.state.phase, "paused");
      assertClear(app, "background/orientation pause clears all controls");
      const paused = structuredClone(app.puffer.state);
      tick(10);
      assert.deepEqual(app.puffer.state, paused);
      app.document.hidden = false;
      portrait = false;
      smallPhone(app);
      app.input.pointer = { x: 30, y: 40 };
      app.click("puffer-go");
      assertClear(app, "resume clears a stale mouse aim");
      assert.equal(app.puffer.state.shelter.x, 568 * 0.82);
      assert.equal(app.puffer.state.shelter.y, 320 * 0.45);
    }
  } finally { app.close(); }
});

test("pufferfish discovery unlocks only the active save spot", async () => {
  const storage = memory();
  const app = await openGame(storage);
  try {
    app.nodes.get("player-pick").emit("click", { target: { closest: () => ({ dataset: { player: "2" } }) } });
    app.click("intro-book-button");
    bookCard(app, "pufferfish");
    app.click("card-be");
    assert.equal(app.puffer.active, false);
    app.click("book-close");
    app.nodes.get("player-pick").emit("click", { target: { closest: () => ({ dataset: { player: "1" } }) } });
    app.click("intro-book-button");
    bookCard(app, "pufferfish");
    app.click("card-be");
    assert.equal(app.puffer.active, true);
  } finally { app.close(); }
});

test("adventure narration uses the ordinary shared sound preference", async () => {
  const storage = memory();
  storage.data.set("little-fish-voice-v1", "off");
  const spoken = [];
  const synth = { speaking: false, getVoices: () => [], addEventListener() {}, cancel() {}, speak: line => spoken.push(line.text) };
  const app = await openGame(storage, { speechSynthesis: synth,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } } });
  try {
    adventureFromPause(app);
    assert.deepEqual(spoken, [], "muted intro is silent");
    app.click("puffer-voice");
    assert.equal(storage.getItem("little-fish-voice-v1"), "on");
    app.click("puffer-go");
    const tick = clockFor(app);
    tick(40);
    assert.ok(spoken.includes(PUFFER_LINES.warning));
    app.click("puffer-voice");
    const count = spoken.length;
    tick(120);
    assert.equal(spoken.length, count, "turning sound off silences later encounter lines");
  } finally { app.close(); }
});
