import { FORMS } from "./rules.js";
import { ZONE_IDS } from "./zones.js";

// Where a swim picks up in each place: the size the fish was when it last lost all its hearts there.
// Finishing the place's mission clears it, so the next swim there starts little.
export const CHECKPOINT_KEY = "little-fish-checkpoint-v1";

export function loadCheckpoints(storage) {
  try {
    const saved = JSON.parse(storage.getItem(CHECKPOINT_KEY));
    return Object.fromEntries(Object.entries(saved ?? {}).filter(([zone, stage]) =>
      ZONE_IDS.includes(zone) && Number.isInteger(stage) && stage >= 0 && stage < FORMS.length));
  } catch {
    return {};
  }
}

export function saveCheckpoints(checkpoints, storage) {
  try { storage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoints)); } catch {}
}
