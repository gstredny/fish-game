import { FORMS } from "./rules.js";

export const CORAL_RADIUS = 66;

export function createReef() {
  return { pending: 0, corals: [] };
}

export function canPlantCoral(reef, x, y) {
  return reef.pending > 0 && !reef.corals.some(coral => Math.hypot(coral.x - x, coral.y - y) < CORAL_RADIUS * 2 + 24);
}

export function plantCoral(reef, x, y) {
  if (!canPlantCoral(reef, x, y)) return false;
  reef.corals.push({ x, y });
  reef.pending -= 1;
  return true;
}

export function isSheltered(world) {
  return world.stage <= 1 && world.reef.corals.some(coral =>
    Math.hypot(coral.x - world.player.x, coral.y - world.player.y) + FORMS[world.stage].size <= CORAL_RADIUS);
}

// Clownfish belong to their colony, outside the snack population. They tuck into the
// branches when a predator approaches and return to their usual swimming circuit.
export function reefResidents(world, time = world.time) {
  return world.reef.corals.flatMap(coral => {
    const tucked = world.creatures.some(creature => !creature.gone && creature.tier > 1 &&
      Math.hypot(creature.x - coral.x, creature.y - coral.y) < 180);
    return [0, 1, 2].map(index => {
      const phase = time * 0.9 + index * Math.PI * 2 / 3;
      const radius = tucked ? 20 : 76;
      return { x: coral.x + Math.cos(phase) * radius, y: coral.y + Math.sin(phase) * radius * 0.35,
        direction: Math.sin(phase) > 0 ? -1 : 1, tucked };
    });
  });
}
