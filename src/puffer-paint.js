import { paintAnimal } from "./animal-paint.js";
import { ZONES } from "./zones.js";

let reef;

export function paintPufferAdventure(context, state, width, height) {
  if (!reef) {
    reef = new Image();
    reef.src = ZONES.reef.backdrop;
  }
  const water = context.createLinearGradient(0, 0, 0, height);
  ZONES.reef.water.forEach((color, index) => water.addColorStop(index / 2, color));
  context.fillStyle = water;
  context.fillRect(0, 0, width, height);
  if (reef.naturalWidth) {
    const scale = Math.max(width / reef.naturalWidth, height / reef.naturalHeight);
    const w = reef.naturalWidth * scale, h = reef.naturalHeight * scale;
    context.drawImage(reef, (width - w) / 2, height - h, w, h);
  }
  paintShelter(context, state.shelter);
  const hunter = state.hunter;
  if (hunter.phase !== "gone") {
    paintAnimal(context, "grouper", hunter.x, hunter.y, 55, hunter.direction, state.time, "predator");
    if (hunter.phase === "warning" || hunter.phase === "approaching") {
      context.font = "bold 24px 'Trebuchet MS', sans-serif";
      context.textAlign = "center";
      context.fillStyle = "#ffdd93";
      context.strokeStyle = "#073c5e";
      context.lineWidth = 4;
      context.strokeText("!", hunter.x - 85, hunter.y - 58);
      context.fillText("!", hunter.x - 85, hunter.y - 58);
    }
  }
  paintAnimal(context, "pufferfish", state.player.x, state.player.y, 35,
    state.player.direction, state.time, "player", { puff: state.puff });
}

function paintShelter(context, shelter) {
  context.save();
  context.translate(shelter.x, shelter.y);
  context.fillStyle = "#426777";
  context.strokeStyle = "#8eb0b8";
  context.lineWidth = 4;
  context.beginPath();
  context.ellipse(0, 18, 66, 52, 0, Math.PI, Math.PI * 2);
  context.lineTo(66, 46);
  context.lineTo(-66, 46);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#073044";
  context.beginPath();
  context.ellipse(0, 26, 39, 30, 0, Math.PI, Math.PI * 2);
  context.lineTo(39, 46);
  context.lineTo(-39, 46);
  context.closePath();
  context.fill();
  context.textAlign = "center";
  context.font = "bold 18px 'Trebuchet MS', sans-serif";
  context.strokeStyle = "#073c5e";
  context.lineWidth = 4;
  context.strokeText("Rock shelter", 0, -63);
  context.fillStyle = "#f4fff6";
  context.fillText("Rock shelter", 0, -63);
  context.fillStyle = "#ffdd93";
  context.beginPath();
  context.moveTo(0, -40);
  context.lineTo(-9, -52);
  context.lineTo(9, -52);
  context.closePath();
  context.fill();
  context.restore();
}
