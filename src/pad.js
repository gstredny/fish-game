// The on-screen arrow pad. A thumb anywhere on the pad points the fish one of eight
// ways, like a game controller; the middle is a rest spot where the fish stops.
const DIRECTIONS = [
  { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 1 },
  { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }
];
const REST = 0.22;

export function padDirection(dx, dy, radius) {
  if (Math.hypot(dx, dy) < radius * REST) return null;
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  return DIRECTIONS[(sector + 8) % 8];
}
