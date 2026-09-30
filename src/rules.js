// A true ocean food chain: plankton → sardine → mackerel → squid → tuna → great white shark → orca.
// Creature tier k+1 is the same animal as player form k, so your own kind swims beside you as a
// friendly school. You eat every tier up to your own form's food (tier <= stage); tiers two or
// more above you eat you. Orcas are the only hunters a great white has.
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
  { kind: "shark", size: 72, color: "#a9bccb", speed: 76 },
  { kind: "orca", size: 100, color: "#1f262d", speed: 72 }
];

export const SHARK = FORMS.length - 1;
export const ORCA = CREATURES.length - 1;

// Little swimmer is the gentle game; Big swimmer takes longer to grow, and its hunters turn and
// chase (a little slower than you, so you can always get away). `odds` splits new fish into
// snacks below you, snacks, your own kind, hunters, and big hunters.
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

// The hunters a form can meet: new fish are at most three tiers above you (see pickTier in
// world.js), and you only ever grow, so nothing bigger is ever left over from before.
export function hunters(stage) {
  return [stage + 2, stage + 3].filter(tier => tier <= ORCA);
}

export function nextGrowth(stage, bites, goal = FORMS[stage].goal) {
  if (stage === FORMS.length - 1 || bites < goal) {
    return { stage, bites, grew: false };
  }
  return { stage: stage + 1, bites: 0, grew: true };
}

// Gentle animals to meet: they neither eat you nor get eaten. Floor animals sit on the sea bed
// painted along the bottom of the screen; the others drift slowly through open water. The blue
// whale is rare: it comes by now and then, and always for the blue whale mission.
export const SEA_FRIENDS = [
  { kind: "turtle", size: 34, speed: 22, floor: false },
  { kind: "parrotfish", size: 24, speed: 26, floor: false },
  { kind: "dolphin", size: 40, speed: 60, floor: false },
  { kind: "jellyfish", size: 22, speed: 6, floor: false },
  { kind: "pufferfish", size: 20, speed: 16, floor: false },
  { kind: "manta", size: 42, speed: 24, floor: false },
  { kind: "bluewhale", size: 150, speed: 18, floor: false, rare: true },
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
  { kind: "mantisshrimp", size: 16, speed: 6, floor: true },
  { kind: "seacucumber", size: 20, speed: 2, floor: true },
  { kind: "moray", size: 24, speed: 0, floor: true },
  { kind: "horseshoecrab", size: 22, speed: 6, floor: true }
];

// The sea bed's height on screen, as a share of the screen height.
export const FLOOR = 0.9;
