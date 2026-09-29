export const FORMS = [
  { name: "Little sprat", size: 16, goal: 6, color: "#ffcf74" },
  { name: "Coral fish", size: 23, goal: 7, color: "#ff8d78" },
  { name: "Parrotfish", size: 33, goal: 8, color: "#72ddc4" },
  { name: "Blue tuna", size: 46, goal: 9, color: "#79baf3" },
  { name: "Great white shark", size: 68, goal: 0, color: "#b8d8eb" }
];

export const CREATURES = [
  { name: "plankton", size: 5, color: "#ffe39a", speed: 13 },
  { name: "anchovy", size: 14, color: "#b6e9de", speed: 46 },
  { name: "reef fish", size: 24, color: "#f3a58b", speed: 58 },
  { name: "tuna", size: 37, color: "#81b8dc", speed: 68 },
  { name: "shark", size: 57, color: "#99b6cb", speed: 78 }
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
