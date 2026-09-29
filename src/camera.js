// The view follows the fish only when it swims near an edge, so the fish itself moves on screen.
// A camera is the ocean point shown at the centre of the screen.
const WINDOW = 0.25;

export function followPlayer(camera, player, width, height) {
  camera.x = Math.min(Math.max(camera.x, player.x - width * WINDOW), player.x + width * WINDOW);
  camera.y = Math.min(Math.max(camera.y, player.y - height * WINDOW), player.y + height * WINDOW);
}

export function toWorld(camera, point, width, height) {
  return { x: camera.x + point.x - width / 2, y: camera.y + point.y - height / 2 };
}
