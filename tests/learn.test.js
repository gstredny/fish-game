import test from "node:test";
import assert from "node:assert/strict";
import { CREATURES, FLOOR, FORMS, SEA_FRIENDS } from "../src/rules.js";
import { cardSpeech, FOOD_CHAIN, growLine, hurtLine, KINDS, meetLine, SEA_FRIEND_KINDS, SPECIES } from "../src/species.js";
import { createWorld, nearbyAnimals, swim } from "../src/world.js";
import { createVoice, VOICE_KEY } from "../src/voice.js";
import { loadMet, MET_KEY, saveMet } from "../src/ocean-book.js";

function memoryStorage() {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

function fakeSpeech() {
  const spoken = [];
  const synth = { speaking: false, pending: false, speak: line => { spoken.push(line.text); synth.speaking = true; },
    cancel: () => { synth.speaking = false; spoken.push("(stop)"); }, getVoices: () => [], addEventListener() {} };
  return { synth, spoken, Utterance: class { constructor(text) { this.text = text; } } };
}

test("every animal in the game has a card: a name, two facts, what it eats and who eats it", () => {
  assert.deepEqual(FOOD_CHAIN, CREATURES.map(creature => creature.kind));
  assert.deepEqual([...SEA_FRIEND_KINDS].sort(), SEA_FRIENDS.map(friend => friend.kind).sort());
  for (const kind of KINDS) {
    const animal = SPECIES[kind];
    assert.ok(animal, `${kind} has no card`);
    assert.equal(animal.facts.length, 2, `${kind} shows two facts`);
    for (const field of ["name", "plural", "hello", "eats", "eatenBy", "say"]) assert.ok(animal[field], `${kind} needs ${field}`);
    assert.ok(animal.lines.length >= 2, `${kind} needs short lines`);
    assert.match(cardSpeech(kind), new RegExp(`^${animal.hello.replace(/[.!?]/g, "\\$&")}`));
  }
  assert.equal(meetLine("octopus", () => 0), "Octopus! An octopus has eight arms!");
});

test("what the cards say about eating matches what happens in the game", () => {
  for (let stage = 1; stage < FORMS.length; stage++) {
    const food = SPECIES[FOOD_CHAIN[stage]];
    assert.match(SPECIES[FORMS[stage].kind].eats.toLowerCase(), new RegExp(food.plural),
      `${FORMS[stage].name} eats ${food.plural} in the game, so its card should say so`);
  }
  for (let stage = 0; stage < FORMS.length - 1; stage++) {
    for (let tier = stage + 2; tier < CREATURES.length; tier++) {
      const hunter = SPECIES[CREATURES[tier].kind].name.toLowerCase().replace("great white ", "");
      assert.match(SPECIES[FORMS[stage].kind].eatenBy.toLowerCase(), new RegExp(hunter),
        `${CREATURES[tier].kind} hunts the ${FORMS[stage].name} in the game, so its card should say so`);
    }
  }
});

test("growing and bumping teach the food chain in words", () => {
  assert.equal(growLine(0), "You're a little sardine! Sardines eat plankton. Watch out for mackerel!");
  assert.equal(growLine(1), "You're a mackerel now! Mackerel eat sardines. Watch out for squid!");
  assert.equal(growLine(2), "You're a squid now! Squid eat mackerel. Watch out for tuna!");
  assert.equal(growLine(3), "You're a tuna now! Tuna eat squid. Watch out for sharks!");
  assert.equal(growLine(4), "You're a great white shark! Sharks are at the top of the food chain!");
  assert.equal(hurtLine("tuna", 2), "Watch out! Tuna eat squid!");
  assert.equal(hurtLine("shark", 0), "Watch out! Sharks eat sardines!");
});

test("animals are met once per swim, nearest first, only when close", () => {
  const world = createWorld(844, 390);
  world.friends = [];
  world.creatures = [
    { x: 400, y: 0, tier: 4, direction: 1, wobble: 0 },
    { x: 60, y: 0, tier: 0, direction: 1, wobble: 0 },
    { x: 150, y: 0, tier: 3, direction: 1, wobble: 0 },
    { x: 100, y: 0, tier: 0, direction: 1, wobble: 0 }
  ];
  const met = nearbyAnimals(world, 844, 390);
  assert.deepEqual(met.map(meeting => meeting.kind), ["plankton", "squid"], "the far tuna is not met");
  assert.equal(met[0].target, world.creatures[1], "the nearest plankton is the one met");
  world.greeted.add("plankton");
  assert.deepEqual(nearbyAnimals(world, 844, 390).map(meeting => meeting.kind), ["squid"]);
});

test("floor animals are met by swimming low, swimmers by swimming close", () => {
  const world = createWorld(844, 390);
  world.creatures = [];
  world.friends = [{ kind: "crab", size: 18, speed: 0, floor: true, x: 0, y: 0, direction: 1, wobble: 0 }];
  assert.deepEqual(nearbyAnimals(world, 844, 390), [], "a fish in mid-water does not meet the crab");
  world.player.y = world.camera.y + 390 * 0.25;
  assert.ok(390 * FLOOR - (world.player.y - world.camera.y + 195) < 390 * 0.2);
  assert.deepEqual(nearbyAnimals(world, 844, 390).map(meeting => meeting.kind), ["crab"]);
  world.friends = [{ kind: "turtle", size: 34, speed: 0, floor: false, x: 300, y: world.player.y, direction: 1, wobble: 0 }];
  assert.deepEqual(nearbyAnimals(world, 844, 390), []);
  world.friends[0].x = 100;
  assert.deepEqual(nearbyAnimals(world, 844, 390).map(meeting => meeting.kind), ["turtle"]);
});

test("each swim has sea friends on the sea bed and in the water, new ones first", () => {
  for (let trial = 0; trial < 20; trial++) {
    const world = createWorld(844, 390);
    assert.ok(world.friends.some(friend => friend.floor), "someone on the sea bed");
    assert.ok(world.friends.some(friend => !friend.floor), "someone swimming");
  }
  for (let trial = 0; trial < 10; trial++) {
    const world = createWorld(844, 390);
    for (const friend of SEA_FRIENDS) if (friend.kind !== "crab") world.greeted.add(friend.kind);
    world.friends = world.friends.filter(friend => !friend.floor);
    world.creatures = [];
    world.phase = "playing";
    swim(world, 0.016, { keys: new Set(), pointer: null }, 844, 390);
    assert.ok(world.friends.some(friend => friend.floor && friend.kind === "crab"), "the floor animal not met yet comes first");
  }
});

test("the voice speaks, waits its turn, can be switched off, and remembers that", () => {
  const storage = memoryStorage();
  const { synth, spoken, Utterance } = fakeSpeech();
  const voice = createVoice(storage, synth, Utterance);
  assert.equal(voice.available, true);
  assert.equal(voice.say("Hello!"), true);
  assert.equal(voice.say("Polite line", { polite: true }), false, "a polite line waits while something is said");
  assert.equal(voice.say("Important line"), true);
  assert.deepEqual(spoken, ["Hello!", "(stop)", "Important line"]);
  voice.setMuted(true);
  assert.equal(storage.getItem(VOICE_KEY), "off");
  assert.equal(voice.say("Quiet"), false);
  assert.equal(voice.say("Hear it again", { force: true }), true, "the hear-again button speaks even when off");
  assert.equal(createVoice(storage, synth, Utterance).muted, true, "the choice is remembered");
  const silent = createVoice(storage, undefined, undefined);
  assert.equal(silent.available, false);
  assert.equal(silent.say("Nobody hears this"), false);
  silent.stop();
});

test("the animals met are saved on this device, and bad saved data is ignored", () => {
  const storage = memoryStorage();
  assert.deepEqual(loadMet(storage), new Set());
  assert.ok(saveMet(new Set(["plankton", "crab"]), storage));
  assert.deepEqual(loadMet(storage), new Set(["plankton", "crab"]));
  for (const bad of ["{", "null", '{"pending":0}', '["whale", 3, "tuna"]']) {
    storage.setItem(MET_KEY, bad);
    assert.deepEqual([...loadMet(storage)], bad.includes("tuna") ? ["tuna"] : []);
  }
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("full"); } };
  assert.deepEqual(loadMet(broken), new Set());
  assert.equal(saveMet(new Set(["tuna"]), broken), false);
});
