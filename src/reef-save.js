import { createReef } from "./reef.js";

export const REEF_KEY = "little-fish-reef-v1";

export function loadReef(storage) {
  try {
    const reef = JSON.parse((storage ?? globalThis.localStorage).getItem(REEF_KEY));
    if (!reef || !Number.isSafeInteger(reef.pending) || reef.pending < 0 ||
        !Array.isArray(reef.corals) || !reef.corals.every(coral =>
          coral && Number.isFinite(coral.x) && Number.isFinite(coral.y))) return createReef();
    return { pending: reef.pending, corals: reef.corals.map(({ x, y }) => ({ x, y })) };
  } catch {
    return createReef();
  }
}

export function saveReef(reef, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(REEF_KEY, JSON.stringify(reef));
    return true;
  } catch {
    return false;
  }
}
