// A true ocean food chain: plankton → sardine → mackerel → squid → tuna → great white shark.
// Creature tier k+1 is the same animal as player form k, so your own kind swims beside you as a
// friendly school. You eat every tier up to your own form's food (tier <= stage); tiers two or
// more above you eat you.
// Sizes keep one promise a child can see: every predator is at least 1.25x the fish it hurts,
// and every snack is at most 0.85x the fish that eats it (asserted in tests/game.test.js).
export const FORMS = [
  { name: "Little sardine", kind: "sardine", size: 15, goal: 6, color: "#9cc7e4" },
  { name: "Mackerel", kind: "mackerel", size: 23, goal: 7, color: "#4fb3a4" },
  { name: "Squid", kind: "squid", size: 35, goal: 8, color: "#f29a8c" },
  { name: "Tuna", kind: "tuna", size: 52, goal: 9, color: "#5d8fc8" },
  { name: "Great white shark", kind: "shark", size: 78, goal: 0, color: "#b8c8d3" }
];

export const CREATURES = [
  { kind: "plankton", size: 6, color: "#ffe39a", speed: 13 },
  { kind: "sardine", size: 14, color: "#9cc7e4", speed: 44 },
  { kind: "mackerel", size: 21, color: "#4fb3a4", speed: 54 },
  { kind: "squid", size: 32, color: "#f29a8c", speed: 60 },
  { kind: "tuna", size: 48, color: "#5d8fc8", speed: 68 },
  { kind: "shark", size: 72, color: "#a9bccb", speed: 76 }
];

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

export function nextGrowth(stage, bites) {
  if (stage === FORMS.length - 1 || bites < FORMS[stage].goal) {
    return { stage, bites, grew: false };
  }
  return { stage: stage + 1, bites: 0, grew: true };
}

// Gentle animals to meet: they neither eat you nor get eaten. Floor animals sit on the sea bed
// painted along the bottom of the screen; the others drift slowly through open water.
export const SEA_FRIENDS = [
  { kind: "turtle", size: 34, speed: 22, floor: false },
  { kind: "parrotfish", size: 24, speed: 26, floor: false },
  { kind: "seahorse", size: 27, speed: 0, floor: true },
  { kind: "octopus", size: 26, speed: 7, floor: true },
  { kind: "starfish", size: 18, speed: 0, floor: true },
  { kind: "crab", size: 18, speed: 14, floor: true },
  { kind: "clownfish", size: 30, speed: 0, floor: true }
];

// The sea bed's height on screen, as a share of the screen height.
export const FLOOR = 0.9;
