// Sizes keep one promise a child can see: every predator is at least 1.25x the fish it hurts,
// and every snack is at most 0.85x the fish that eats it (asserted in tests/game.test.js).
export const FORMS = [
  { name: "Little sprat", size: 15, goal: 6, color: "#ffcf74" },
  { name: "Coral fish", size: 23, goal: 7, color: "#ff8d78" },
  { name: "Parrotfish", size: 35, goal: 8, color: "#72ddc4" },
  { name: "Blue tuna", size: 52, goal: 9, color: "#79baf3" },
  { name: "Great white shark", size: 78, goal: 0, color: "#b8d8eb" }
];

export const CREATURES = [
  { name: "plankton", size: 6, color: "#ffe39a", speed: 13 },
  { name: "anchovy", size: 19, color: "#b6e9de", speed: 46 },
  { name: "reef fish", size: 29, color: "#f3a58b", speed: 58 },
  { name: "tuna", size: 44, color: "#81b8dc", speed: 68 },
  { name: "shark", size: 66, color: "#99b6cb", speed: 78 }
];

export function canEat(stage, tier) {
  return tier <= stage;
}

export function nextGrowth(stage, bites) {
  if (stage === FORMS.length - 1 || bites < FORMS[stage].goal) {
    return { stage, bites, grew: false };
  }
  return { stage: stage + 1, bites: 0, grew: true };
}
