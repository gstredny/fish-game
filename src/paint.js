import { CREATURES, FORMS } from "./rules.js";
import { FRAME, paintFace, paintHalo, TAIL_JOINT } from "./art.js";

const NO_ART = { player: null, npc: [] };

export function paintOcean(context, world, width, height, time, art = NO_ART) {
  const cameraX = world.player.x - width / 2;
  const cameraY = world.player.y - height / 2;
  paintWater(context, width, height, time, cameraX);
  paintReef(context, width, height, time, cameraX);

  for (const creature of world.creatures) {
    const x = creature.x - cameraX;
    const y = creature.y - cameraY;
    if (x < -100 || x > width + 100 || y < -100 || y > height + 100) continue;
    const drawing = creature.art === null || creature.art === undefined ? null : art.npc[creature.art];
    if (creature.tier === 0) paintPlankton(context, x, y, time + creature.wobble);
    else if (drawing) paintArtFish(context, drawing, x, y, CREATURES[creature.tier].size,
      creature.tier, creature.direction, time + creature.wobble, false);
    else paintFish(context, x, y, CREATURES[creature.tier].size, creature.tier,
      CREATURES[creature.tier].color, creature.direction, time + creature.wobble, false);
  }

  for (const particle of world.particles) {
    context.globalAlpha = Math.max(0, particle.life / 0.55);
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x - cameraX, particle.y - cameraY, 3.5, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  if (world.invulnerable <= 0 || Math.floor(time * 9) % 2 === 0) {
    const form = FORMS[world.stage];
    if (art.player) paintArtFish(context, art.player, width / 2, height / 2, form.size,
      world.stage, world.player.direction, time, true);
    else paintFish(context, width / 2, height / 2, form.size, world.stage,
      form.color, world.player.direction, time, true);
  }
}

// A child's drawing as a still picture, sized for menus and the HUD.
export function portrait(drawing, stage) {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 220;
  paintArtFish(canvas.getContext("2d"), drawing, 175, 130, 80, stage, 1, 0, false);
  return canvas.toDataURL("image/png");
}

function paintWater(context, width, height, time, cameraX) {
  const water = context.createLinearGradient(0, 0, 0, height);
  water.addColorStop(0, "#137ea0");
  water.addColorStop(0.42, "#096681");
  water.addColorStop(1, "#073c5e");
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

function paintReef(context, width, height, time, cameraX) {
  context.save();
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

function paintFish(context, x, y, size, tier, color, direction, time, player) {
  context.save();
  context.translate(x, y + Math.sin(time * 2.5) * 2);
  context.scale(direction, 1);
  const tail = Math.sin(time * 9) * 0.17;

  if (player) paintHalo(context, size);

  context.fillStyle = color;
  context.save();
  context.translate(-size * 0.83, 0);
  context.rotate(tail);
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(-size * 0.55, -size * 0.8, -size * 0.8, -size * 0.72);
  context.quadraticCurveTo(-size * 0.55, 0, -size * 0.8, size * 0.72);
  context.quadraticCurveTo(-size * 0.4, size * 0.6, 0, 0);
  context.fill();
  context.restore();

  context.beginPath();
  context.moveTo(-size * 0.35, -size * 0.45);
  context.quadraticCurveTo(-size * 0.13, -size * 1.03, size * 0.15, -size * 0.52);
  context.fill();

  context.beginPath();
  context.ellipse(0, 0, size, size * (tier === 4 ? 0.46 : 0.59), 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(239,255,246,.42)";
  context.beginPath();
  context.ellipse(size * 0.02, size * 0.25, size * 0.72, size * 0.24, -0.08, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = color;
  context.beginPath();
  context.moveTo(-size * 0.2, size * 0.28);
  context.quadraticCurveTo(-size * 0.45, size * 0.86, size * 0.1, size * 0.58);
  context.quadraticCurveTo(size * 0.18, size * 0.35, -size * 0.2, size * 0.28);
  context.fill();

  if (tier === 1 || tier === 2) {
    context.strokeStyle = "rgba(255,255,255,.45)";
    context.lineWidth = Math.max(2, size * 0.1);
    context.beginPath();
    context.moveTo(-size * 0.32, -size * 0.43);
    context.lineTo(-size * 0.2, size * 0.41);
    if (tier === 2) {
      context.moveTo(size * 0.1, -size * 0.45);
      context.lineTo(size * 0.2, size * 0.42);
    }
    context.stroke();
  }

  paintFace(context, size, false);

  if (player && tier < 4) {
    context.fillStyle = "#fff1b8";
    context.beginPath();
    context.arc(-size * 0.08, -size * 0.18, Math.max(2, size * 0.09), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function paintArtFish(context, drawing, x, y, size, tier, direction, time, player) {
  context.save();
  context.translate(x, y + Math.sin(time * 2.5) * 2);
  context.scale(direction, 1);
  if (player) paintHalo(context, size);

  const left = FRAME.left * size;
  const top = FRAME.top * size;
  const frameWidth = FRAME.width * size;
  const frameHeight = FRAME.height * size;
  context.save();
  context.translate(TAIL_JOINT * size, 0);
  context.rotate(Math.sin(time * 9) * 0.17);
  context.translate(-TAIL_JOINT * size, 0);
  context.drawImage(drawing.tail, left, top, frameWidth, frameHeight);
  context.restore();

  if (tier === 4) {
    context.fillStyle = "#8eaec2";
    context.strokeStyle = "rgba(23,59,82,.6)";
    context.lineWidth = Math.max(1, size * 0.03);
    context.beginPath();
    context.moveTo(-size * 0.42, -size * 0.4);
    context.quadraticCurveTo(-size * 0.1, -size * 0.72, -size * 0.04, -size * 1.24);
    context.quadraticCurveTo(size * 0.12, -size * 0.72, size * 0.38, -size * 0.42);
    context.closePath();
    context.fill();
    context.stroke();
  }
  context.drawImage(drawing.body, left, top, frameWidth, frameHeight);
  if (tier === 4) {
    context.strokeStyle = "rgba(23,59,82,.55)";
    context.lineWidth = Math.max(1, size * 0.035);
    context.beginPath();
    for (let gill = 0; gill < 3; gill++) {
      const gillX = size * (0.24 + gill * 0.09);
      context.moveTo(gillX, -size * 0.14);
      context.quadraticCurveTo(gillX - size * 0.06, size * 0.02, gillX, size * 0.18);
    }
    context.stroke();
  }
  paintFace(context, size, true);
  context.restore();
}
