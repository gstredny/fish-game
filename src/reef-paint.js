import { canPlantCoral, CORAL_RADIUS, reefResidents } from "./reef.js";

export function paintOwnedReef(context, world, width, height, time) {
  const cameraX = world.player.x - width / 2;
  const cameraY = world.player.y - height / 2;
  for (const coral of world.reef.corals) {
    const x = coral.x - cameraX, y = coral.y - cameraY;
    if (x < -130 || x > width + 130 || y < -130 || y > height + 130) continue;
    context.save();
    context.translate(x, y);
    paintColony(context, time);
    context.fillStyle = "#daf8ed";
    context.textAlign = "center";
    context.font = "bold 12px 'Trebuchet MS', sans-serif";
    context.fillText("Your coral", 0, 106);
    context.font = "11px 'Trebuchet MS', sans-serif";
    context.fillText("Small fish shelter", 0, 122);
    context.restore();
  }
  for (const fish of reefResidents(world)) {
    context.save();
    context.translate(fish.x - cameraX, fish.y - cameraY);
    context.scale(fish.direction, 1);
    paintClownfish(context);
    context.restore();
  }
  if (world.sheltered) {
    context.save();
    context.strokeStyle = "#b4ffde";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(width / 2, height / 2, 32, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
  if (world.phase === "planting") {
    const { x, y } = world.plantSpot;
    context.save();
    context.translate(x - cameraX, y - cameraY);
    context.globalAlpha = 0.6;
    paintColony(context, time);
    context.globalAlpha = 1;
    context.strokeStyle = canPlantCoral(world.reef, x, y) ? "#e7ffd8" : "#ff9387";
    context.lineWidth = 3;
    context.setLineDash([6, 5]);
    context.strokeRect(-92, -86, 184, 178);
    context.restore();
  }
}

function paintColony(context, time) {
  const glow = context.createRadialGradient(0, 0, 12, 0, 0, 100);
  glow.addColorStop(0, "rgba(97,250,189,.25)");
  glow.addColorStop(1, "rgba(97,250,189,0)");
  context.fillStyle = glow;
  context.fillRect(-100, -100, 200, 200);
  context.fillStyle = "#287d7d";
  context.beginPath();
  context.ellipse(0, 75, 82, 18, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(168,255,210,.6)";
  context.lineWidth = 1.5;
  context.setLineDash([3, 7]);
  context.beginPath();
  context.arc(0, 0, CORAL_RADIUS, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
  context.lineCap = "round";
  for (let branch = 0; branch < 7; branch++) {
    const base = (branch - 3) * 19;
    const tip = base * 1.2 + Math.sin(time * 0.7 + branch) * 2;
    const top = -68 + Math.abs(branch - 3) * 12;
    context.strokeStyle = branch % 2 ? "#ffb293" : "#f78091";
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(base * 0.7, 69);
    context.bezierCurveTo(base - 10, 30, tip + 8, -12, tip, top);
    context.moveTo(tip, top + 27);
    context.lineTo(tip - 16, top + 10);
    context.moveTo(base, 16);
    context.lineTo(base + 17, -5);
    context.stroke();
    context.strokeStyle = "rgba(255,225,175,.65)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(tip - 1, top + 18);
    context.lineTo(tip - 1, top);
    context.stroke();
  }
  context.fillStyle = "rgba(8,67,77,.7)";
  context.beginPath();
  context.ellipse(0, 18, 30, 38, 0, 0, Math.PI * 2);
  context.fill();
}

function paintClownfish(context) {
  context.fillStyle = "#ffb058";
  context.strokeStyle = "#233f50";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(-9, 0);
  context.lineTo(-17, -7);
  context.lineTo(-17, 7);
  context.closePath();
  context.fill();
  context.stroke();
  context.beginPath();
  context.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.strokeStyle = "#fff9df";
  context.lineWidth = 3;
  for (const x of [-6, 4]) {
    context.beginPath();
    context.moveTo(x, -5);
    context.lineTo(x + 1, 5);
    context.stroke();
  }
  context.fillStyle = "#163b4b";
  context.beginPath();
  context.arc(8, -2, 1.5, 0, Math.PI * 2);
  context.fill();
}
