import test from "node:test";
import assert from "node:assert/strict";
import { CREATURES, FLOOR, FORMS, hunters, SEA_FRIENDS } from "../src/rules.js";
import { cardSpeech, growLine, hurtLine, meetLine, SPECIES } from "../src/species.js";
import { formKind, KINDS, ZONES } from "../src/zones.js";
import { missionIds, pickMission } from "../src/missions.js";
import { createWorld, nearbyAnimals, resetWorld, swim } from "../src/world.js";
import { paintAnimal } from "../src/animal-paint.js";
import { createVoice, VOICE_KEY } from "../src/voice.js";
import { loadMet, MET_KEY, saveMet } from "../src/ocean-book.js";
import { PHOTOS } from "../src/photos.js";
import { existsSync, readFileSync } from "node:fs";

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

const SEA_FRIEND_KINDS = [...new Set(Object.values(ZONES).flatMap(zone => [...zone.friends, zone.giant]))];

test("every animal in the game has a card: a name, two facts, what it eats and who eats it", () => {
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

test("every animal has a real photo, with its credit, in the game and in CREDITS.md", () => {
  const credits = readFileSync(new URL("../CREDITS.md", import.meta.url), "utf8");
  for (const kind of KINDS) {
    assert.match(PHOTOS[kind]?.credit ?? "", /^(Photo|Drawing): /, `${kind} has no photo credit`);
    assert.ok(existsSync(new URL(`../${PHOTOS[kind].file}`, import.meta.url)), `${PHOTOS[kind].file} is missing`);
    assert.ok(credits.includes(`- **${kind}**:`), `CREDITS.md does not credit the ${kind} photo`);
  }
});

test("what the cards say about eating matches what happens in every zone", () => {
  for (const zone of Object.values(ZONES)) {
    for (let stage = 1; stage < FORMS.length; stage++) {
      const you = formKind(zone, stage), food = SPECIES[zone.chain[stage]];
      assert.match(SPECIES[you].eats.toLowerCase(), new RegExp(food.plural),
        `${zone.id}: ${you} eats ${food.plural} in the game, so its card should say so`);
    }
    for (let stage = 0; stage < FORMS.length; stage++) {
      for (const tier of hunters(stage, zone)) {
        const hunter = SPECIES[zone.chain[tier]].name.toLowerCase().replace("great white ", "");
        assert.match(SPECIES[formKind(zone, stage)].eatenBy.toLowerCase(), new RegExp(hunter),
          `${zone.id}: ${zone.chain[tier]} hunts the ${formKind(zone, stage)} in the game, so its card should say so`);
      }
    }
  }
});

test("growing and bumping teach the zone's food chain in words", () => {
  const open = ZONES.open, reef = ZONES.reef;
  assert.equal(growLine(open, 0), "Welcome to the open ocean! You're a little sardine! Sardines eat plankton. Watch out for mackerel!");
  assert.equal(growLine(open, 1), "You're a mackerel now! Mackerel eat sardines. Watch out for squid!");
  assert.equal(growLine(open, 2), "You're a squid now! Squid eat mackerel. Watch out for tuna!");
  assert.equal(growLine(open, 3), "You're a tuna now! Tuna eat squid. Watch out for sharks!");
  assert.equal(growLine(open, 4), "You're a great white shark now! Sharks eat tuna. Watch out for orcas!");
  assert.equal(hurtLine(open, "orca", 4), "Watch out! Orcas eat sharks!");
  assert.equal(hurtLine(open, "tuna", 2), "Watch out! Tuna eat squid!");
  assert.equal(hurtLine(open, "shark", 0), "Watch out! Sharks eat sardines!");
  assert.equal(growLine(reef, 0), "Welcome to the coral reef! You're a little damselfish! Damselfish eat plankton. Watch out for lionfish!");
  assert.equal(growLine(reef, 3), "You're a reef shark now! Reef sharks eat groupers. Watch out for tiger sharks!");
  assert.equal(growLine(reef, 4), "You're a tiger shark now! Tiger sharks eat reef sharks. Watch out for orcas!");
  assert.equal(hurtLine(reef, "grouper", 0), "Watch out! Groupers eat damselfish!");
  // A zone where nothing hunts the biggest form, and a form whose name starts with a vowel.
  const quiet = { ...open, chain: ["plankton", "sardine", "octopus", "squid", "tuna", "shark"] };
  assert.equal(growLine(quiet, 1), "You're an octopus now! Octopuses eat sardines. Watch out for squid!");
  assert.equal(growLine(quiet, 4), "You're a great white shark now! Sharks eat tuna. Nothing here hunts you!");
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

test("sea friends this device has never met come before ones it met on earlier swims", () => {
  const met = new Set(SEA_FRIEND_KINDS.filter(kind => kind !== "horseshoecrab" && kind !== "narwhal"));
  for (let trial = 0; trial < 20; trial++) {
    const world = createWorld(844, 390, { mission: "hunt", met });
    assert.equal(world.met, met, "the swim sees the Ocean book itself, so animals met mid-swim count at once");
    assert.ok(world.friends.some(friend => friend.floor && friend.kind === "horseshoecrab"), "the unmet floor animal comes first");
    assert.ok(world.friends.some(friend => !friend.floor && friend.kind === "narwhal"), "the unmet swimmer comes first");
    resetWorld(world, 844, 390);
    assert.equal(world.met, met, "a new swim keeps the same book");
  }
  // Once every animal is met, the ocean still fills with sea friends.
  const world = createWorld(844, 390, { mission: "hunt", met: new Set(SEA_FRIEND_KINDS) });
  assert.ok(world.friends.some(friend => friend.floor) && world.friends.some(friend => !friend.floor));
});

test("a swim in a zone fills the water with that zone's animals only", () => {
  for (let trial = 0; trial < 10; trial++) {
    const world = createWorld(1440, 900, { zone: "reef" });
    Object.assign(world, { phase: "playing", invulnerable: 99 });
    for (let round = 0; round < 20; round++) {
      world.friends = [];
      swim(world, 0.016, { keys: new Set(), pointer: null }, 1440, 900);
      for (const friend of world.friends) assert.ok([...ZONES.reef.friends, ZONES.reef.giant].includes(friend.kind), `${friend.kind} does not live on the reef`);
    }
    world.creatures = [{ ...world.player, tier: 2, direction: 1, wobble: 0 }];
    world.invulnerable = 0;
    swim(world, 0.016, { keys: new Set(), pointer: null }, 1440, 900);
    assert.deepEqual(world.events.at(-1), { type: "hurt", by: "lionfish" }, "the bump names the reef's hunter");
  }
  const dark = { ...ZONES.open, id: "dark", floor: false, friends: ["dolphin", "jellyfish"], chain: ZONES.open.chain.slice(0, 6) };
  const world = createWorld(1440, 900, { zone: dark });
  assert.ok(world.friends.every(friend => !friend.floor), "no floor animals where there is no floor");
  Object.assign(world, { phase: "playing", stage: 4, invulnerable: 99 });
  for (let round = 0; round < 30; round++) {
    world.creatures = [];
    swim(world, 0.016, { keys: new Set(), pointer: null }, 1440, 900);
    assert.ok(world.creatures.every(creature => creature.tier <= 5), "nothing hunts the biggest form here");
  }
  assert.ok(!missionIds(dark).includes("flee"), "no one to swim away from, so no such mission");
  assert.ok(missionIds(ZONES.open).includes("flee"));
  for (let pick = 0; pick < 50; pick++) assert.notEqual(pickMission(null, dark), "flee");
});

test("every sea friend has its own drawing, on the sea bed or swimming", () => {
  let marks = 0;
  const context = new Proxy({}, { get: (target, key) => target[key] ?? (String(key).startsWith("create") ?
    () => ({ addColorStop() {} }) : key === "fill" || key === "stroke" ? () => { marks++; } : () => {}),
  set: (target, key, value) => { target[key] = value; return true; } });
  for (const friend of SEA_FRIENDS) {
    marks = 0;
    for (const time of [0, 0.7, 2.3]) {
      assert.doesNotThrow(() => paintAnimal(context, friend.kind, 100, 100, friend.size, -1, time,
        friend.floor ? "floor" : "friend", { puff: 0.5 }), `${friend.kind} has no drawing`);
    }
    assert.ok(marks >= 3, `${friend.kind}'s drawing paints something`);
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

test("the first tap wakes the voice with one silent line", () => {
  const { synth, Utterance } = fakeSpeech();
  const lines = [];
  synth.speak = line => lines.push(line);
  const voice = createVoice(memoryStorage(), synth, Utterance);
  voice.unlock();
  voice.unlock();
  assert.equal(lines.length, 1, "only once");
  assert.equal(lines[0].volume, 0, "and silent");
  createVoice(memoryStorage(), undefined, undefined).unlock();
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
