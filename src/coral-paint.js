import { paintAnemoneHome } from "./animal-paint.js";

// A coral colony for the trophy case: one is earned for every level finished. `sway` picks the
// bend of the branches, so each level's coral looks a little different.
export function paintColony(context, sway = 0) {
  const glow = context.createRadialGradient(0, 0, 12, 0, 0, 100);
  glow.addColorStop(0, "rgba(97,250,189,.25)");
  glow.addColorStop(1, "rgba(97,250,189,0)");
  context.fillStyle = glow;
  context.fillRect(-100, -100, 200, 200);
  context.fillStyle = "#287d7d";
  context.beginPath();
  context.ellipse(0, 75, 82, 18, 0, 0, Math.PI * 2);
  context.fill();
  context.lineCap = "round";
  for (let branch = 0; branch < 7; branch++) {
    const base = (branch - 3) * 19;
    const tip = base * 1.2 + Math.sin(sway * 0.7 + branch) * 2;
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
  // Clownfish live in sea anemones on the reef; theirs grows in the middle of your coral.
  context.save();
  context.translate(0, 32);
  paintAnemoneHome(context, 24, sway);
  context.restore();
}
