import { canEat, CREATURES, FLOOR, FORMS, isFriend } from "./rules.js";
import { glowColor, paintAnimal, swatch } from "./animal-paint.js";
import { SPECIES } from "./species.js";

const kindAt = (world, tier) => world.zone.chain[tier];

// Each zone's realistic ocean is a Blender render (tools/render-ocean.py): a 360-degree strip that
// wraps seamlessly. Until it loads, the drawn cartoon water in the zone's colours shows.
const backdrops = new Map();
function backdropFor(zone) {
  if (!backdrops.has(zone.backdrop)) {
    const image = new Image();
    image.src = zone.backdrop;
    backdrops.set(zone.backdrop, image);
  }
  return backdrops.get(zone.backdrop);
}

export function paintOcean(context, world, width, height, time) {
  const cameraX = world.camera.x - width / 2;
  const cameraY = world.camera.y - height / 2;
  const backdrop = backdropFor(world.zone);
  paintWater(context, world.zone, backdrop, width, height, time, cameraX);
  if (world.zone.floor) paintReef(context, world.zone, backdrop, width, height, time, cameraX);

  for (const friend of world.friends) {
    const x = friend.x - cameraX;
    const y = friend.floor ? height * FLOOR : friend.y - cameraY;
    const margin = friend.size * 1.4 + 40;
    if (x < -margin || x > width + margin || y < -margin || y > height + margin) continue;
    paintAnimal(context, friend.kind, x, y, friend.size, friend.direction, time + friend.wobble,
      friend.floor ? "floor" : "friend", { puff: friend.puff ?? 0 });
  }

  for (const creature of world.creatures) {
    const x = creature.x - cameraX;
    const y = creature.y - cameraY;
    const { size } = CREATURES[creature.tier];
    const kind = kindAt(world, creature.tier);
    const margin = size * 1.4 + 40;
    if (x < -margin || x > width + margin || y < -margin || y > height + margin) continue;
    const role = canEat(world.stage, creature.tier) ? "prey" : isFriend(world.stage, creature.tier) ? "friend" : "predator";
    if (kind === "plankton") paintPlankton(context, x, y, time + creature.wobble);
    else paintAnimal(context, kind, x, y, size, creature.direction, time + creature.wobble, role);
  }

  for (const particle of world.particles) {
    context.globalAlpha = Math.min(1, Math.max(0, particle.life / 0.55));
    context.fillStyle = particle.color ?? swatch(particle.kind);
    if (particle.text) {
      context.font = "bold 22px 'Trebuchet MS', sans-serif";
      context.textAlign = "center";
      context.strokeStyle = "rgba(4,50,74,.75)";
      context.lineWidth = 4;
      context.strokeText(particle.text, particle.x - cameraX, particle.y - cameraY);
      context.fillText(particle.text, particle.x - cameraX, particle.y - cameraY);
      continue;
    }
    context.beginPath();
    context.arc(particle.x - cameraX, particle.y - cameraY, 3.5, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  if (world.invulnerable <= 0 || Math.floor(time * 9) % 2 === 0) {
    const size = FORMS[world.stage].size * (1 + world.gulp * 0.8);
    const kind = kindAt(world, world.stage + 1);
    paintAnimal(context, kind, world.player.x - cameraX, world.player.y - cameraY, size,
      world.player.direction, time, "player");
  }
  if (world.zone.light < 1) paintDark(context, world, width, height, time, cameraX, cameraY);
  paintLabels(context, world, width, height, cameraX, cameraY);
  paintPointer(context, world, width, height, cameraX, cameraY, time);
}

// The dark zones: the water goes black except around you (many deep animals make light, and so do
// you), and the animals that glow show as little lights in the dark, so a child swims over to see
// what they are. The darker the zone, the smaller the circle you can see.
function paintDark(context, world, width, height, time, cameraX, cameraY) {
  const px = world.player.x - cameraX, py = world.player.y - cameraY;
  const light = world.zone.light;
  const reach = (110 + FORMS[world.stage].size * 2.2) * (0.6 + light) + Math.sin(time * 2.2) * 4;
  const dark = context.createRadialGradient(px, py, reach * 0.35, px, py, reach * 1.7);
  dark.addColorStop(0, "rgba(1,6,14,0)");
  dark.addColorStop(0.55, `rgba(1,6,14,${(1 - light) * 0.75})`);
  dark.addColorStop(1, `rgba(1,6,14,${1 - light})`);
  context.fillStyle = dark;
  context.fillRect(0, 0, width, height);

  const shine = (x, y, radius, color, pulse) => {
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(0.35, color.replace(/[\d.]+\)$/, `${0.45 * pulse})`));
    glow.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  };
  for (const creature of world.creatures) {
    const kind = kindAt(world, creature.tier);
    if (!SPECIES[kind]?.glow || creature.gone) continue;
    const x = creature.x - cameraX, y = creature.y - cameraY;
    if (x < -60 || x > width + 60 || y < -60 || y > height + 60) continue;
    const size = CREATURES[creature.tier].size;
    shine(x, y, size * 1.6 + 8, toRgba(glowColor(kind) ?? "#bff7ff", 0.9), 0.75 + Math.sin(time * 3 + creature.wobble) * 0.25);
  }
  for (const friend of world.friends) {
    if (!SPECIES[friend.kind]?.glow) continue;
    const x = friend.x - cameraX, y = friend.floor ? height * FLOOR : friend.y - cameraY;
    if (x < -80 || x > width + 80 || y < -80 || y > height + 80) continue;
    shine(x, y, friend.size * 1.4 + 10, toRgba(glowColor(friend.kind) ?? "#bff7ff", 0.85), 0.75 + Math.sin(time * 2 + friend.wobble) * 0.25);
  }
}

function toRgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16 & 255},${value >> 8 & 255},${value & 255},${alpha})`;
}

// An arrow at the edge of the screen points to the mission's blue whale or orca while it is out of sight.
function paintPointer(context, world, width, height, cameraX, cameraY, time) {
  const target = world.mission?.target;
  if (!target || world.phase !== "playing") return;
  const x = target.x - cameraX, y = target.y - cameraY;
  if (x > 0 && x < width && y > 0 && y < height) return;
  const edge = 46 + Math.sin(time * 6) * 5;
  const px = Math.min(width - edge, Math.max(edge, x)), py = Math.min(height - edge, Math.max(edge + 60, y));
  context.save();
  context.translate(px, py);
  context.rotate(Math.atan2(y - py, x - px));
  context.fillStyle = target.hunt ? "#ff8a7a" : "#ffe08a";
  context.strokeStyle = "rgba(4,50,74,.8)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(24, 0);
  context.lineTo(-12, -18);
  context.lineTo(-4, 0);
  context.lineTo(-12, 18);
  context.closePath();
  context.stroke();
  context.fill();
  context.restore();
}

// Name tags float over animals as you meet them.
function paintLabels(context, world, width, height, cameraX, cameraY) {
  context.font = "bold 15px 'Trebuchet MS', sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (const label of world.labels) {
    const x = label.target.x - cameraX;
    const y = (label.target.floor ? height * FLOOR : label.target.y - cameraY) - label.lift;
    const half = (context.measureText(label.text)?.width ?? label.text.length * 8) / 2 + 10;
    context.globalAlpha = Math.min(1, label.life / 0.4);
    context.fillStyle = "rgba(5,52,74,.82)";
    context.strokeStyle = "rgba(255,242,183,.7)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.roundRect?.(x - half, y - 13, half * 2, 26, 13);
    context.fill();
    context.stroke();
    context.fillStyle = "#fff2b7";
    context.fillText(label.text, x, y + 1);
  }
  context.globalAlpha = 1;
  context.textBaseline = "alphabetic";
}

function paintWater(context, zone, backdrop, width, height, time, cameraX) {
  if (backdrop.naturalWidth) paintBackdrop(context, backdrop, width, height, cameraX);
  else paintCartoonWater(context, zone, width, height, time, cameraX);

  for (let bubble = 0; bubble < 30; bubble++) {
    const x = ((bubble * 137.3 - cameraX * 0.18) % (width + 80) + width + 80) % (width + 80) - 40;
    const y = ((bubble * 97.7 - time * (9 + bubble % 5) * 2) % (height + 80) + height + 80) % (height + 80) - 40;
    context.strokeStyle = `rgba(204,252,241,${0.1 + bubble % 4 * 0.035})`;
    context.lineWidth = 1.3;
    context.beginPath();
    context.arc(x, y, 2 + bubble % 4, 0, Math.PI * 2);
    context.stroke();
  }
}

function paintBackdrop(context, backdrop, width, height, cameraX) {
  const tile = backdrop.naturalWidth * height / backdrop.naturalHeight;
  const left = -((cameraX * 0.2 % tile) + tile) % tile;
  context.drawImage(backdrop, left, 0, tile, height);
  context.drawImage(backdrop, left + tile, 0, tile, height);
}

function paintCartoonWater(context, zone, width, height, time, cameraX) {
  const water = context.createLinearGradient(0, 0, 0, height);
  water.addColorStop(0, zone.water[0]);
  water.addColorStop(0.42, zone.water[1]);
  water.addColorStop(1, zone.water[2]);
  context.fillStyle = water;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width * 0.58, -height * 0.12, 10, width * 0.58, -height * 0.12, width * 0.8);
  glow.addColorStop(0, "rgba(184,249,226,.49)");
  glow.addColorStop(1, "rgba(184,249,226,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.12;
  context.fillStyle = "#d8ffea";
  for (let ray = -2; ray < 7; ray++) {
    const origin = width * 0.52 + ray * 82 + Math.sin(time * 0.28 + ray) * 20;
    context.beginPath();
    context.moveTo(origin, -30);
    context.lineTo(origin + 28, -30);
    context.lineTo(origin + 170 + ray * 40, height);
    context.lineTo(origin + 60 + ray * 35, height);
    context.closePath();
    context.fill();
  }
  context.restore();

  context.strokeStyle = "rgba(222,255,242,.11)";
  context.lineWidth = 2;
  for (let line = 0; line < 9; line++) {
    const y = 44 + line * 28;
    context.beginPath();
    for (let x = -20; x < width + 30; x += 8) {
      const wave = y + Math.sin((x + cameraX * 0.12) * 0.019 + time * 0.75 + line) * 6;
      if (x === -20) context.moveTo(x, wave);
      else context.lineTo(x, wave);
    }
    context.stroke();
  }
}

// The sea bed's plants and coral sticks; a bare zone (mud at the bottom of the sea) has none.
function paintReef(context, zone, backdrop, width, height, time, cameraX) {
  context.save();
  if (!backdrop.naturalWidth) paintCartoonSeabed(context, width, height, cameraX);
  if (zone.plants === false) return context.restore();

  for (let plant = -1; plant < Math.ceil(width / 100) + 1; plant++) {
    const x = plant * 100 + 25 - ((cameraX * 0.38) % 100);
    const baseY = height * 0.92 + Math.sin(x * 0.013) * 9;
    const tall = 38 + (plant * 37 + 120) % 54;
    context.strokeStyle = plant % 3 === 0 ? "#29a6a0" : "#207e8c";
    context.lineWidth = 5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(x, baseY);
    context.quadraticCurveTo(x - 12 + Math.sin(time + plant) * 5, baseY - tall * 0.6,
      x + Math.sin(time * 0.8 + plant) * 12, baseY - tall);
    context.stroke();
    for (let leaf = 1; leaf < 4; leaf++) {
      const leafY = baseY - tall * leaf / 4;
      context.beginPath();
      context.moveTo(x - 3, leafY);
      context.quadraticCurveTo(x + (leaf % 2 ? 24 : -24), leafY - 15,
        x + (leaf % 2 ? 20 : -20), leafY - 27);
      context.stroke();
    }
  }

  for (let coral = 0; coral < Math.ceil(width / 240) + 2; coral++) {
    const x = coral * 240 + 85 - ((cameraX * 0.55) % 240);
    const y = height * 0.94;
    context.strokeStyle = coral % 2 ? "#ef9c8b" : "#ebba85";
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - 4, y - 48);
    context.lineTo(x - 16, y - 62);
    context.moveTo(x - 4, y - 48);
    context.lineTo(x + 13, y - 67);
    context.moveTo(x - 2, y - 28);
    context.lineTo(x + 20, y - 43);
    context.stroke();
  }
  context.restore();
}

function paintCartoonSeabed(context, width, height, cameraX) {
  context.fillStyle = "rgba(5,54,77,.46)";
  context.beginPath();
  context.moveTo(0, height);
  for (let x = 0; x <= width + 20; x += 20) {
    context.lineTo(x, height * 0.82 + Math.sin(x * 0.009 + cameraX * 0.001) * 16);
  }
  context.lineTo(width, height);
  context.fill();

  const sand = context.createLinearGradient(0, height * 0.87, 0, height);
  sand.addColorStop(0, "#0e5870");
  sand.addColorStop(1, "#0b334f");
  context.fillStyle = sand;
  context.beginPath();
  context.moveTo(0, height);
  for (let x = 0; x <= width + 20; x += 20) {
    context.lineTo(x, height * 0.92 + Math.sin(x * 0.015 + cameraX * 0.002) * 10);
  }
  context.lineTo(width, height);
  context.fill();
}

function paintPlankton(context, x, y, time) {
  const pulse = 1 + Math.sin(time * 3) * 0.15;
  const glow = context.createRadialGradient(x, y, 0, x, y, 15 * pulse);
  glow.addColorStop(0, "rgba(255,244,174,.8)");
  glow.addColorStop(1, "rgba(255,244,174,0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(x, y, 15 * pulse, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#fff4ad";
  context.beginPath();
  context.arc(x, y, 3.2 * pulse, 0, Math.PI * 2);
  context.fill();
}
