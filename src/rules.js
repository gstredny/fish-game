// The tier ladder every zone shares. Which animal sits on each tier comes from the zone (zones.js).
// Creature tier k+1 is the same animal as player form k, so your own kind swims beside you as a
// friendly school. You eat every tier up to your own form's food (tier <= stage); tiers two or
// more above you eat you. Tier 6, where a zone has one, hunts even the biggest form.
// Sizes keep one promise a child can see: every predator is at least 1.25x the fish it hurts,
// and every snack is at most 0.85x the fish that eats it (asserted in tests/game.test.js).
import { topTier } from "./zones.js";

export const FORMS = [
  { size: 15, goal: 6 },
  { size: 23, goal: 7 },
  { size: 35, goal: 8 },
  { size: 52, goal: 9 },
  { size: 78, goal: 0 }
];

export const CREATURES = [
  { size: 6, speed: 13 },
  { size: 14, speed: 44 },
  { size: 21, speed: 54 },
  { size: 32, speed: 60 },
  { size: 48, speed: 68 },
  { size: 72, speed: 76 },
  { size: 100, speed: 72 }
];

export const SHARK = FORMS.length - 1;

// Little swimmer is the gentle game; Big swimmer takes longer to grow, and its hunters turn and
// chase (a little slower than you, so you can always get away). `odds` splits new fish into
// snacks below you, snacks, your own kind, hunters, and big hunters. `orcas` is the top hunter's
// share of the biggest form's ocean.
export const LEVELS = {
  little: { goals: [6, 7, 8, 9], chase: 0, reach: 180, orcaChase: 0.5, safe: 2.4, odds: [0.25, 0.65, 0.75, 0.95], orcas: 0.03 },
  big: { goals: [8, 9, 11, 12], chase: 0.62, reach: 230, orcaChase: 0.8, safe: 1.5, odds: [0.22, 0.58, 0.68, 0.93], orcas: 0.06 }
};

export function goalFor(level, stage) {
  return LEVELS[level]?.goals[stage] ?? FORMS[stage].goal;
}

export function swimSpeed(stage) {
  return 235 - stage * 9;
}

export function canEat(stage, tier) {
  return tier <= stage;
}

// Your own kind: they school with you instead of eating you or being eaten.
export function isFriend(stage, tier) {
  return tier === stage + 1;
}

export function isDanger(stage, tier) {
  return tier > stage + 1;
}

// The hunters a form can meet in a zone: new fish are at most three tiers above you (see pickTier
// in world.js), and you only ever grow, so nothing bigger is ever left over from before.
export function hunters(stage, zone) {
  return [stage + 2, stage + 3].filter(tier => tier <= topTier(zone));
}

export function nextGrowth(stage, bites, goal = FORMS[stage].goal) {
  if (stage === FORMS.length - 1 || bites < goal) {
    return { stage, bites, grew: false };
  }
  return { stage: stage + 1, bites: 0, grew: true };
}

// How gentle animals move: floor animals sit on the sea bed painted along the bottom of the screen;
// the others drift slowly through open water. Which of them live where is the zone's list.
export const SEA_FRIENDS = [
  { kind: "turtle", size: 34, speed: 22, floor: false },
  { kind: "parrotfish", size: 24, speed: 26, floor: false },
  { kind: "dolphin", size: 40, speed: 60, floor: false },
  { kind: "jellyfish", size: 22, speed: 6, floor: false },
  { kind: "pufferfish", size: 20, speed: 16, floor: false },
  { kind: "manta", size: 42, speed: 24, floor: false },
  { kind: "bluewhale", size: 150, speed: 18, floor: false },
  { kind: "seahorse", size: 27, speed: 0, floor: true },
  { kind: "octopus", size: 26, speed: 7, floor: true },
  { kind: "starfish", size: 18, speed: 0, floor: true },
  { kind: "crab", size: 18, speed: 14, floor: true },
  { kind: "clownfish", size: 30, speed: 0, floor: true },
  { kind: "lobster", size: 20, speed: 8, floor: true },
  { kind: "urchin", size: 14, speed: 0, floor: true },
  { kind: "hammerhead", size: 44, speed: 40, floor: false },
  { kind: "whaleshark", size: 76, speed: 16, floor: false },
  { kind: "narwhal", size: 44, speed: 34, floor: false },
  { kind: "anglerfish", size: 22, speed: 10, floor: false },
  { kind: "otter", size: 32, speed: 20, floor: false },
  { kind: "penguin", size: 24, speed: 50, floor: false },
  { kind: "flyingfish", size: 18, speed: 64, floor: false },
  { kind: "manofwar", size: 22, speed: 5, floor: false },
  { kind: "mantisshrimp", size: 22, speed: 6, floor: true },
  { kind: "seacucumber", size: 26, speed: 2, floor: true },
  { kind: "moray", size: 24, speed: 0, floor: true },
  { kind: "horseshoecrab", size: 28, speed: 6, floor: true },
  { kind: "coral", size: 38, speed: 0, floor: true },
  { kind: "giantclam", size: 34, speed: 0, floor: true }
];

export function friendTraits(kind) {
  return SEA_FRIENDS.find(friend => friend.kind === kind);
}

// The sea bed's height on screen, as a share of the screen height.
export const FLOOR = 0.9;
