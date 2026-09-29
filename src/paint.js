import { CREATURES, FORMS } from "./rules.js";
import { paintOwnedReef } from "./reef-paint.js";

export function paintOcean(context, world, width, height, time) {
  const cameraX = world.player.x - width / 2;
  const cameraY = world.player.y - height / 2;
  paintWater(context, width, height, time, cameraX);
  paintReef(context, width, height, time, cameraX);
  paintOwnedReef(context, world, width, height, time);

  for (const creature of world.creatures) {
    const x = creature.x - cameraX;
    const y = creature.y - cameraY;
    if (x < -100 || x > width + 100 || y < -100 || y > height + 100) continue;
    if (creature.tier === 0) paintPlankton(context, x, y, time + creature.wobble);
    else paintFish(context, x, y, CREATURES[creature.tier].size, creature.tier,
      CREATURES[creature.tier].color, creature.direction, time + creature.wobble,
      creature.tier > world.stage ? "predator" : "prey");
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
    paintFish(context, width / 2, height / 2, form.size, world.stage,
      form.color, world.player.direction, time, "player");
  }
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

// role: "player", "prey" (safe to eat, soft glow) or "predator" (teeth and a frown).
function paintFish(context, x, y, size, tier, color, direction, time, role) {
  context.save();
  context.translate(x, y + Math.sin(time * 2.5) * 2);
  context.scale(direction, 1);
  const tail = Math.sin(time * 9) * 0.17;

  if (role === "prey") {
    context.strokeStyle = "rgba(220,255,236,.35)";
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(0, 0, size * 1.28, size * 0.9, 0, 0, Math.PI * 2);
    context.stroke();
  }

  if (role === "player") {
    const halo = context.createRadialGradient(0, 0, size * 0.4, 0, 0, size * 1.85);
    halo.addColorStop(0, "rgba(214,255,238,.22)");
    halo.addColorStop(1, "rgba(214,255,238,0)");
    context.fillStyle = halo;
    context.beginPath();
    context.arc(0, 0, size * 1.85, 0, Math.PI * 2);
    context.fill();
  }

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
  if (role === "player") {
    context.strokeStyle = "#fffbe6";
    context.lineWidth = Math.max(2.5, size * 0.07);
    context.stroke();
  }

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

  context.fillStyle = "#f7ffef";
  context.beginPath();
  context.arc(size * 0.58, -size * 0.17, Math.max(2.5, size * 0.13), 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(size * 0.62, -size * 0.17, Math.max(1.5, size * 0.07), 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(20,55,70,.55)";
  context.lineWidth = Math.max(1, size * 0.026);
  context.beginPath();
  context.arc(size * 0.75, size * 0.14, size * 0.17, 0.1, 1.7);
  context.stroke();

  if (role === "predator") {
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(size * 0.58, size * 0.2);
    for (let tooth = 0; tooth < 3; tooth++) {
      context.lineTo(size * (0.58 + 0.11 * tooth + 0.055), size * 0.34);
      context.lineTo(size * (0.58 + 0.11 * (tooth + 1)), size * 0.2);
    }
    context.closePath();
    context.fill();
    context.strokeStyle = "#173b52";
    context.lineWidth = Math.max(1.5, size * 0.05);
    context.beginPath();
    context.moveTo(size * 0.44, -size * 0.4);
    context.lineTo(size * 0.7, -size * 0.28);
    context.stroke();
  }

  if (role === "player" && tier < 4) {
    context.fillStyle = "#fff1b8";
    context.beginPath();
    context.arc(-size * 0.08, -size * 0.18, Math.max(2, size * 0.09), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
