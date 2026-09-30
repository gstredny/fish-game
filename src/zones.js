// The places you can swim. Each has its own real food chain and its own animals; the tier ladder
// (sizes, speeds, goals) is the same everywhere and lives in rules.js.
// `chain`: kinds by tier. Tier 0 is the snack nobody plays, tiers 1 to 5 are the five forms you grow
// through, and tier 6, when there is one, is the top hunter that nothing here eats.
// `friends`: gentle animals that live here, first one on the poster for the "meet friends" mission.
// `giant`: the rare one the "find" mission looks for. `floor`: whether there is a sea bed to stand on.
// `light`: 1 is sunny; below 1 the water darkens and you see by your own glow (paint.js).
export const ZONES = {
  reef: {
    name: "Coral reef", blurb: "Sunny, warm and busy", hello: "Welcome to the coral reef!",
    light: 1, floor: true,
    chain: ["plankton", "damselfish", "lionfish", "grouper", "reefshark", "tigershark", "orca"],
    friends: ["turtle", "parrotfish", "pufferfish", "manta", "clownfish", "seahorse", "octopus", "moray",
      "mantisshrimp", "starfish", "crab", "lobster", "urchin", "seacucumber", "coral", "giantclam"],
    giant: "whaleshark",
    backdrop: "art/ocean-reef.webp", water: ["#26a9c9", "#128aa8", "#0c5f80"]
  },
  open: {
    name: "Open ocean", blurb: "Deep blue, far from land", hello: "Welcome to the open ocean!",
    light: 1, floor: true,
    chain: ["plankton", "sardine", "mackerel", "squid", "tuna", "shark", "orca"],
    friends: ["dolphin", "turtle", "jellyfish", "pufferfish", "manta", "hammerhead", "whaleshark", "narwhal",
      "otter", "penguin", "flyingfish", "manofwar",
      "octopus", "starfish", "crab", "lobster", "urchin", "horseshoecrab", "seacucumber"],
    giant: "bluewhale",
    backdrop: "art/ocean.webp", water: ["#137ea0", "#096681", "#073c5e"]
  },
  // The twilight zone: sunlight fades to nothing, there is no floor in sight, and many animals make
  // their own light. Nothing here hunts a grown sperm whale, so the chain stops at six.
  deep: {
    name: "The deep", blurb: "Dark, cold and full of lights", hello: "Welcome to the deep!",
    light: 0.3, floor: false,
    chain: ["marinesnow", "deepshrimp", "lanternfish", "viperfish", "giantsquid", "spermwhale"],
    friends: ["anglerfish", "hatchetfish", "vampiresquid", "combjelly", "barreleye"],
    giant: "oarfish",
    backdrop: "art/ocean-deep.webp", water: ["#0b2a55", "#04122b", "#010409"]
  },
  // The abyssal sea floor: pitch black, icy cold, soft mud, and a hot vent with its tube worms. You see
  // only by your own light. Nothing here hunts a grown sleeper shark.
  bottom: {
    name: "The bottom", blurb: "Pitch black, cold and muddy", hello: "Welcome to the bottom of the sea!",
    light: 0.05, floor: true, plants: false,
    chain: ["marinesnow", "amphipod", "snailfish", "rattail", "lizardfish", "sleepershark"],
    friends: ["fangtooth", "seapig", "tripodfish", "giantisopod", "tubeworm"],
    giant: "dumbooctopus",
    backdrop: "art/ocean-bottom.webp", water: ["#0a1424", "#050a14", "#020408"]
  }
};
for (const [id, zone] of Object.entries(ZONES)) zone.id = id;

export const ZONE_IDS = Object.keys(ZONES);
export const DEFAULT_ZONE = "open";

// Every animal in the game, each once, in the order the Ocean book counts them.
export const KINDS = [...new Set(Object.values(ZONES).flatMap(zone => [...zone.chain, ...zone.friends, zone.giant]))];

// The animals that live in a zone, each once.
export function zoneKinds(zone) {
  return [...new Set([...zone.chain, ...zone.friends, zone.giant])];
}

// The kind you are at a stage, and the top hunter, if this zone has one.
export function formKind(zone, stage) {
  return zone.chain[stage + 1];
}

export function topTier(zone) {
  return zone.chain.length - 1;
}

// True when tier 6 exists: something here hunts even the biggest form.
export function hasTopHunter(zone) {
  return zone.chain.length > 6;
}
