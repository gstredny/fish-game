import { KINDS } from "./zones.js";

// The animals met on this device. The first meeting opens a fact card; after that the
// Ocean book lets anyone who plays here see every card again.
export const MET_KEY = "little-fish-met-v1";

export function loadMet(storage = globalThis.localStorage) {
  try {
    const kinds = JSON.parse(storage.getItem(MET_KEY));
    return new Set(Array.isArray(kinds) ? kinds.filter(kind => KINDS.includes(kind)) : []);
  } catch {
    return new Set();
  }
}

export function saveMet(met, storage = globalThis.localStorage) {
  try {
    storage.setItem(MET_KEY, JSON.stringify([...met]));
    return true;
  } catch {
    return false;
  }
}
