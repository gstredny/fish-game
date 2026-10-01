import { ZONE_IDS, ZONES } from "./zones.js";

// The places are levels, in the order of ZONES: the sunny reef first, the bottom of the sea last.
// A level is finished by finishing one mission there; that opens the next place. The finished
// levels are saved per player, so a child can come back to "level three".
export const LEVELS_KEY = "little-fish-levels-v1";
export const OCEAN_DONE_LINE = "You did it! You swam the whole ocean, from the sunny coral reef all the way down to the bottom of the sea!";
export const LOCKED_LINE = "That place is still locked. Finish the one before it first!";

export function loadBeaten(storage) {
  try {
    const ids = JSON.parse(storage.getItem(LEVELS_KEY));
    return new Set(Array.isArray(ids) ? ids.filter(id => ZONE_IDS.includes(id)) : []);
  } catch {
    return new Set();
  }
}

export function saveBeaten(beaten, storage) {
  try {
    storage.setItem(LEVELS_KEY, JSON.stringify([...beaten]));
    return true;
  } catch {
    return false;
  }
}

export function levelNumber(id) {
  return ZONE_IDS.indexOf(id) + 1;
}

export function nextLevel(id) {
  return ZONE_IDS[ZONE_IDS.indexOf(id) + 1] ?? null;
}

// The first place, any place already finished, and the place after a finished one.
export function isOpen(beaten, id) {
  const at = ZONE_IDS.indexOf(id);
  return at === 0 || beaten.has(id) || beaten.has(ZONE_IDS[at - 1]);
}

// The level a player is on: the first one not finished, or the last once all are.
export function currentLevel(beaten) {
  return ZONE_IDS.find(id => !beaten.has(id)) ?? ZONE_IDS.at(-1);
}

export function allDone(beaten) {
  return ZONE_IDS.every(id => beaten.has(id));
}

// Said when a level is finished for the first time.
export function levelDoneLine(id) {
  const next = nextLevel(id);
  if (!next) return OCEAN_DONE_LINE;
  return `Level complete! You finished ${placeName(id)}. Next stop: ${placeName(next)}!`;
}

// "the coral reef", "the deep": the place's name as it is said mid-sentence.
export function placeName(id) {
  const { name } = ZONES[id];
  const lower = name[0].toLowerCase() + name.slice(1);
  return lower.startsWith("the ") ? lower : `the ${lower}`;
}
