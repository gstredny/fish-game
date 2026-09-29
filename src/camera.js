// The view follows the fish only when it swims near an edge, so the fish itself moves on screen.
// A camera is the ocean point shown at the centre of the screen.
const WINDOW = 0.25;

// `keepOut` is a screen circle the fish must stay out of (the arrow pad); the ocean
// scrolls instead, just as it does at the edges.
export function followPlayer(camera, player, width, height, keepOut = null) {
  camera.x = Math.min(Math.max(camera.x, player.x - width * WINDOW), player.x + width * WINDOW);
  camera.y = Math.min(Math.max(camera.y, player.y - height * WINDOW), player.y + height * WINDOW);
  if (!keepOut) return;
  const dx = player.x - camera.x + width / 2 - keepOut.x;
  const dy = player.y - camera.y + height / 2 - keepOut.y;
  const gap = Math.hypot(dx, dy);
  if (gap >= keepOut.r) return;
  const push = keepOut.r - gap;
  camera.x -= (gap ? dx / gap : 1) * push;
  camera.y -= (gap ? dy / gap : -1) * push;
}

export function toWorld(camera, point, width, height) {
  return { x: camera.x + point.x - width / 2, y: camera.y + point.y - height / 2 };
}
