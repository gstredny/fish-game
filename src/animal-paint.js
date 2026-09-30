// Cartoon drawings of the real animals in the game. Each is drawn facing right around (0, 0);
// the caller mirrors it for left. Floor animals stand on (0, 0), the sea bed.
import { REEF_PAINTERS, REEF_SWATCHES } from "./paint-reef-animals.js";

// role: "player", "prey" (safe to eat, soft glow), "friend" (your own kind, a smile) or
// "predator" (teeth and a frown). extra carries per-animal settings for custom painters, such as
// { puff: 0..1 } for how blown up a pufferfish is.
const FISH = {
  sardine: { back: "#5d8db8", belly: "#eaf4f8", fin: "#8fb6d6", height: 0.42, tail: "fork" },
  mackerel: { back: "#23877b", belly: "#e8f1ea", fin: "#5aa99c", height: 0.4, tail: "fork" },
  // Yellowfin tuna: yellow finlets and fins on top, a dark tail.
  tuna: { back: "#1d4777", belly: "#dfe8ef", fin: "#f2c94c", tailFin: "#2a5383", height: 0.5, tail: "moon" },
  shark: { back: "#8599a8", belly: "#f5f8f9", fin: "#7b8f9e", height: 0.36, tail: "shark" },
  parrotfish: { back: "#27b3a0", belly: "#9fe8d8", fin: "#f28cb1", height: 0.56, tail: "round" }
};

export function paintAnimal(context, kind, x, y, size, direction, time, role, extra = {}) {
  context.save();
  context.translate(x, y + (role === "floor" ? 0 : Math.sin(time * 2.5) * 2));
  context.scale(direction, 1);
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
  const painter = PAINTERS[kind];
  if (painter) painter(context, size, time, role, extra ?? {});
  else paintFish(context, FISH[kind], size, time, role);
  context.restore();
}

function paintFish(context, style, size, time, role) {
  const h = style.height;
  context.fillStyle = style.tailFin ?? style.fin;
  context.save();
  context.translate(-size * 0.86, 0);
  context.rotate(Math.sin(time * 9) * 0.17);
  paintTail(context, style.tail, size);
  context.restore();

  // Fins on the back.
  context.fillStyle = style.tail === "shark" ? style.back : style.fin;
  context.beginPath();
  if (style.tail === "shark") {
    context.moveTo(-size * 0.32, -size * h * 0.8);
    context.lineTo(-size * 0.12, -size * 1.02);
    context.quadraticCurveTo(size * 0.02, -size * 0.6, size * 0.22, -size * h * 0.8);
  } else if (style.tail === "round") {
    context.moveTo(-size * 0.7, -size * h * 0.6);
    context.quadraticCurveTo(-size * 0.2, -size * (h + 0.32), size * 0.45, -size * h * 0.8);
  } else {
    context.moveTo(-size * 0.35, -size * h * 0.8);
    context.quadraticCurveTo(-size * 0.13, -size * (h + 0.42), size * 0.12, -size * h * 0.85);
  }
  context.fill();
  if (style.tail === "moon") paintFinlets(context, size, h, style.fin);

  // Body: dark back, pale belly, like real open-ocean fish.
  context.fillStyle = style.belly;
  context.beginPath();
  context.ellipse(0, 0, size, size * h, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = style.back;
  context.beginPath();
  context.ellipse(0, 0, size, size * h, 0, Math.PI, Math.PI * 2);
  context.quadraticCurveTo(0, size * h * 0.35, -size, 0);
  context.fill();
  if (role === "player") {
    context.strokeStyle = "#fffbe6";
    context.lineWidth = Math.max(2.5, size * 0.07);
    context.beginPath();
    context.ellipse(0, 0, size, size * h, 0, 0, Math.PI * 2);
    context.stroke();
  }

  paintMarks(context, style, size, h);

  // Side fin.
  context.fillStyle = style.tail === "shark" ? style.back : style.tailFin ?? style.fin;
  context.beginPath();
  context.moveTo(size * 0.1, size * h * 0.3);
  context.quadraticCurveTo(-size * 0.12, size * (h + 0.35), size * 0.32, size * (h + 0.05));
  context.quadraticCurveTo(size * 0.3, size * h * 0.4, size * 0.1, size * h * 0.3);
  context.fill();

  paintFace(context, size, h, role, style);
}

function paintTail(context, shape, size) {
  context.beginPath();
  if (shape === "round") {
    context.ellipse(-size * 0.3, 0, size * 0.38, size * 0.5, 0, 0, Math.PI * 2);
    context.fill();
    return;
  }
  const [upX, upY, lowX, lowY, notch] = {
    fork: [-0.8, -0.72, -0.8, 0.72, -0.5],
    moon: [-0.6, -0.95, -0.6, 0.95, -0.22],
    shark: [-0.85, -0.95, -0.55, 0.5, -0.3]
  }[shape].map(value => value * size);
  context.moveTo(0, -size * 0.1);
  context.quadraticCurveTo(upX * 0.5, upY * 0.6, upX, upY);
  context.quadraticCurveTo(notch, 0, lowX, lowY);
  context.quadraticCurveTo(lowX * 0.5, lowY * 0.6, 0, size * 0.1);
  context.fill();
}

function paintFinlets(context, size, h, color) {
  context.fillStyle = color;
  for (let index = 0; index < 4; index++) {
    const x = -size * (0.5 + index * 0.1);
    const reach = size * h * (0.66 - index * 0.1);
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(x + size * 0.05, side * reach * 0.85);
      context.lineTo(x - size * 0.03, side * (reach + size * 0.1));
      context.lineTo(x - size * 0.05, side * reach * 0.8);
      context.fill();
    }
  }
}

function paintMarks(context, style, size, h) {
  if (style === FISH.sardine) {
    context.fillStyle = "rgba(24,52,78,.55)";
    for (let spot = 0; spot < 4; spot++) {
      context.beginPath();
      context.arc(size * (0.25 - spot * 0.2), -size * h * 0.05, Math.max(1, size * 0.06), 0, Math.PI * 2);
      context.fill();
    }
  } else if (style === FISH.mackerel) {
    context.strokeStyle = "rgba(10,40,48,.7)";
    context.lineWidth = Math.max(1.2, size * 0.06);
    for (let bar = 0; bar < 5; bar++) {
      const x = size * (0.3 - bar * 0.2);
      context.beginPath();
      context.moveTo(x, -size * h * 0.85);
      context.quadraticCurveTo(x + size * 0.1, -size * h * 0.5, x, -size * h * 0.15);
      context.stroke();
    }
  } else if (style === FISH.shark) {
    context.strokeStyle = "rgba(60,78,92,.7)";
    context.lineWidth = Math.max(1, size * 0.025);
    for (let slit = 0; slit < 3; slit++) {
      const x = size * (0.32 + slit * 0.07);
      context.beginPath();
      context.moveTo(x, -size * h * 0.25);
      context.quadraticCurveTo(x - size * 0.03, size * h * 0.05, x, size * h * 0.3);
      context.stroke();
    }
  } else if (style === FISH.parrotfish) {
    context.fillStyle = "rgba(255,170,205,.55)";
    for (let patch = 0; patch < 3; patch++) {
      context.beginPath();
      context.ellipse(size * (0.2 - patch * 0.3), -size * h * 0.1, size * 0.1, size * h * 0.4, 0, 0, Math.PI * 2);
      context.fill();
    }
    // The beak: teeth joined into a parrot's bill.
    context.fillStyle = "#f5f1dc";
    context.beginPath();
    context.ellipse(size * 0.93, size * 0.02, size * 0.13, size * 0.15, 0, -Math.PI / 2, Math.PI / 2);
    context.fill();
    context.strokeStyle = "#8aa39a";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(size * 0.93, size * 0.02);
    context.lineTo(size * 1.05, size * 0.02);
    context.stroke();
  }
}

function paintFace(context, size, h, role, style) {
  const eyeX = size * (style === FISH.shark ? 0.66 : 0.6);
  const eyeY = -size * h * 0.3;
  context.fillStyle = "#f7ffef";
  context.beginPath();
  context.arc(eyeX, eyeY, Math.max(2.5, size * (style === FISH.shark ? 0.08 : 0.12)), 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(eyeX + size * 0.03, eyeY, Math.max(1.5, size * (style === FISH.shark ? 0.055 : 0.065)), 0, Math.PI * 2);
  context.fill();

  if (role === "predator") {
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(size * 0.56, size * h * 0.3);
    for (let tooth = 0; tooth < 3; tooth++) {
      context.lineTo(size * (0.56 + 0.1 * tooth + 0.05), size * h * 0.3 + size * 0.13);
      context.lineTo(size * (0.56 + 0.1 * (tooth + 1)), size * h * 0.3);
    }
    context.closePath();
    context.fill();
    paintBrow(context, eyeX, eyeY, size);
    return;
  }
  if (style === FISH.parrotfish) return;
  context.strokeStyle = "rgba(20,55,70,.6)";
  context.lineWidth = Math.max(1, size * 0.03);
  context.beginPath();
  context.arc(size * 0.74, size * h * 0.15, size * 0.15, 0.2, 1.6);
  context.stroke();
}

function paintBrow(context, eyeX, eyeY, size) {
  context.strokeStyle = "#173b52";
  context.lineWidth = Math.max(1.5, size * 0.05);
  context.beginPath();
  context.moveTo(eyeX - size * 0.15, eyeY - size * 0.2);
  context.lineTo(eyeX + size * 0.12, eyeY - size * 0.08);
  context.stroke();
}

// A squid swims arms-first when it hunts: soft mantle behind, fins at its tip, ten arms in front.
function paintSquid(context, size, time, role) {
  const body = "#f29a8c", dark = "#c9665a";
  context.strokeStyle = body;
  context.lineCap = "round";
  for (let arm = 0; arm < 8; arm++) {
    const spread = (arm - 3.5) / 3.5;
    context.lineWidth = Math.max(1.5, size * 0.07);
    context.beginPath();
    context.moveTo(size * 0.35, spread * size * 0.18);
    context.quadraticCurveTo(size * 0.7, spread * size * 0.3 + Math.sin(time * 6 + arm) * size * 0.08,
      size * 0.92, spread * size * 0.34 + Math.sin(time * 5 + arm) * size * 0.12);
    context.stroke();
  }
  context.lineWidth = Math.max(1, size * 0.045);
  for (const side of [-1, 1]) {
    const tipY = side * size * 0.1 + Math.sin(time * 4 + side) * size * 0.1;
    context.beginPath();
    context.moveTo(size * 0.35, side * size * 0.05);
    context.quadraticCurveTo(size * 0.9, side * size * 0.02, size * 1.2, tipY);
    context.stroke();
    context.fillStyle = body;
    context.beginPath();
    context.ellipse(size * 1.22, tipY, size * 0.08, size * 0.05, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = body;
  context.beginPath();
  context.moveTo(-size * 0.72, 0);
  context.lineTo(-size * 1.05, -size * 0.34);
  context.lineTo(-size * 0.98, 0);
  context.lineTo(-size * 1.05, size * 0.34);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(size * 0.42, 0);
  context.bezierCurveTo(size * 0.4, -size * 0.42, -size * 0.6, -size * 0.3, -size * 1.02, 0);
  context.bezierCurveTo(-size * 0.6, size * 0.3, size * 0.4, size * 0.42, size * 0.42, 0);
  context.fill();
  if (role === "player") {
    context.strokeStyle = "#fffbe6";
    context.lineWidth = Math.max(2.5, size * 0.07);
    context.stroke();
  }
  context.fillStyle = dark;
  for (let spot = 0; spot < 5; spot++) {
    context.beginPath();
    context.arc(-size * (0.1 + spot * 0.16), (spot % 2 ? 1 : -1) * size * 0.08, size * 0.035, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#f7ffef";
  context.beginPath();
  context.arc(size * 0.26, -size * 0.1, size * 0.12, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(size * 0.29, -size * 0.1, size * 0.065, 0, Math.PI * 2);
  context.fill();
  if (role === "predator") paintBrow(context, size * 0.26, -size * 0.1, size);
}

function paintTurtle(context, size, time) {
  const skin = "#8fb77a", shell = "#6b7b45", plate = "#a9b86c";
  const paddle = Math.sin(time * 3) * 0.45;
  for (const [x, y, length, swing] of [[0.45, 0.25, 1.05, paddle], [-0.6, 0.3, 0.5, -paddle * 0.6]]) {
    context.save();
    context.translate(size * x, size * y);
    context.rotate(0.9 + swing);
    context.fillStyle = skin;
    context.beginPath();
    context.ellipse(-size * length * 0.5, 0, size * length * 0.5, size * 0.16, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  context.fillStyle = skin;
  context.beginPath();
  context.ellipse(size * 1.08, -size * 0.02, size * 0.3, size * 0.24, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(size * 1.18, -size * 0.08, Math.max(1.5, size * 0.05), 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#e9dfb4";
  context.beginPath();
  context.ellipse(0, size * 0.18, size * 0.95, size * 0.2, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = shell;
  context.beginPath();
  context.ellipse(0, size * 0.12, size, size * 0.68, 0, Math.PI, Math.PI * 2);
  context.closePath();
  context.fill();
  context.strokeStyle = plate;
  context.lineWidth = Math.max(1, size * 0.05);
  for (const x of [-0.45, 0, 0.45]) {
    context.beginPath();
    context.ellipse(size * x, -size * 0.2, size * 0.2, size * 0.18, 0, 0, Math.PI * 2);
    context.stroke();
  }
}

function paintSeahorse(context, size, time) {
  const sway = Math.sin(time * 1.4) * size * 0.12;
  context.strokeStyle = "#3f9a5a";
  context.lineWidth = Math.max(2, size * 0.12);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-size * 0.3, 0);
  context.quadraticCurveTo(-size * 0.5 + sway, -size * 1.4, -size * 0.2 + sway * 1.5, -size * 2.8);
  context.stroke();
  context.save();
  context.translate(sway * 0.5, 0);
  const gold = "#f4b942";
  context.strokeStyle = gold;
  context.lineWidth = Math.max(2, size * 0.18);
  context.beginPath();
  context.moveTo(size * 0.05, -size * 0.95);
  context.quadraticCurveTo(-size * 0.1, -size * 0.45, -size * 0.35, -size * 0.55);
  context.quadraticCurveTo(-size * 0.52, -size * 0.7, -size * 0.3, -size * 0.8);
  context.stroke();
  context.fillStyle = gold;
  context.beginPath();
  context.ellipse(size * 0.12, -size * 1.3, size * 0.3, size * 0.45, 0.25, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(size * 0.02, -size * 1.82, size * 0.24, 0, Math.PI * 2);
  context.fill();
  context.fillRect(size * 0.1, -size * 1.84, size * 0.5, size * 0.13);
  context.fillStyle = "#ffd98a";
  context.beginPath();
  context.moveTo(-size * 0.16, -size * 1.45);
  context.quadraticCurveTo(-size * 0.55 + Math.sin(time * 12) * size * 0.05, -size * 1.3, -size * 0.14, -size * 1.1);
  context.fill();
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(size * 0.08, -size * 1.86, Math.max(1.5, size * 0.07), 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function paintOctopus(context, size, time) {
  const skin = "#e0664f";
  context.strokeStyle = skin;
  context.lineCap = "round";
  for (let arm = 0; arm < 8; arm++) {
    const spread = (arm - 3.5) / 3.5;
    const curl = Math.sin(time * 2 + arm) * size * 0.15;
    context.lineWidth = Math.max(2, size * 0.16);
    context.beginPath();
    context.moveTo(spread * size * 0.35, -size * 0.7);
    context.quadraticCurveTo(spread * size * 0.9, -size * 0.1, spread * size * 1.45 + curl, -size * 0.12);
    context.stroke();
  }
  context.fillStyle = skin;
  context.beginPath();
  context.ellipse(0, -size * 1.15, size * 0.62, size * 0.7, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,210,190,.55)";
  for (let spot = 0; spot < 4; spot++) {
    context.beginPath();
    context.arc(size * (-0.3 + spot * 0.2), -size * (1.45 - (spot % 2) * 0.15), size * 0.06, 0, Math.PI * 2);
    context.fill();
  }
  for (const side of [-1, 1]) {
    context.fillStyle = "#f7ffef";
    context.beginPath();
    context.arc(side * size * 0.24, -size * 0.92, size * 0.14, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#173b52";
    context.beginPath();
    context.arc(side * size * 0.24 + size * 0.03, -size * 0.92, size * 0.07, 0, Math.PI * 2);
    context.fill();
  }
}

function paintStarfish(context, size, time) {
  context.save();
  context.translate(0, -size * 0.75);
  context.rotate(Math.sin(time * 0.6) * 0.08);
  context.fillStyle = "#f28a3c";
  context.beginPath();
  for (let point = 0; point < 10; point++) {
    const angle = -Math.PI / 2 + point * Math.PI / 5;
    const reach = point % 2 ? size * 0.42 : size;
    context.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
  }
  context.closePath();
  context.fill();
  context.fillStyle = "#ffd08a";
  for (let arm = 0; arm < 5; arm++) {
    const angle = -Math.PI / 2 + arm * Math.PI * 2 / 5;
    for (const step of [0.35, 0.6]) {
      context.beginPath();
      context.arc(Math.cos(angle) * size * step, Math.sin(angle) * size * step, Math.max(1, size * 0.07), 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function paintCrab(context, size, time) {
  const shell = "#e2553f";
  context.strokeStyle = shell;
  context.lineCap = "round";
  context.lineWidth = Math.max(1.5, size * 0.1);
  for (let leg = 0; leg < 4; leg++) {
    const step = Math.sin(time * 10 + leg * 2) * size * 0.1;
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(side * size * (0.3 + leg * 0.1), -size * 0.45);
      context.lineTo(side * size * (0.85 + leg * 0.12), -size * 0.55 + step);
      context.lineTo(side * size * (0.95 + leg * 0.15), 0);
      context.stroke();
    }
  }
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(side * size * 0.6, -size * 0.75);
    context.lineTo(side * size * 1.05, -size * 1.15);
    context.stroke();
    context.fillStyle = shell;
    context.beginPath();
    context.ellipse(side * size * 1.15, -size * 1.3, size * 0.28, size * 0.2, side * 0.6, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#0b3345";
    context.lineWidth = Math.max(1, size * 0.05);
    context.beginPath();
    context.moveTo(side * size * 1.35, -size * 1.42);
    context.lineTo(side * size * 1.18, -size * 1.3);
    context.stroke();
    context.strokeStyle = shell;
    context.lineWidth = Math.max(1.5, size * 0.1);
    context.beginPath();
    context.moveTo(side * size * 0.22, -size * 0.95);
    context.lineTo(side * size * 0.3, -size * 1.25);
    context.stroke();
    context.fillStyle = "#f7ffef";
    context.beginPath();
    context.arc(side * size * 0.3, -size * 1.3, size * 0.11, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#173b52";
    context.beginPath();
    context.arc(side * size * 0.3, -size * 1.3, size * 0.055, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = shell;
  context.beginPath();
  context.ellipse(0, -size * 0.7, size * 0.8, size * 0.45, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(90,20,20,.5)";
  context.lineWidth = Math.max(1, size * 0.04);
  context.beginPath();
  context.arc(0, -size * 0.62, size * 0.2, 0.3, Math.PI - 0.3);
  context.stroke();
}

// A sea anemone with its clownfish living among the tentacles.
function paintAnemone(context, size, time) {
  paintAnemoneHome(context, size, time);
  for (let fish = 0; fish < 2; fish++) {
    const phase = time * 1.1 + fish * Math.PI;
    context.save();
    context.translate(Math.cos(phase) * size * 0.8, -size * (1.05 + fish * 0.35) + Math.sin(phase * 2) * size * 0.1);
    context.scale((Math.sin(phase) > 0 ? -1 : 1) * size / 30, size / 30);
    paintClownfish(context);
    context.restore();
  }
}

// The anemone alone, standing on (0, 0).
export function paintAnemoneHome(context, size, time) {
  context.lineCap = "round";
  for (let arm = 0; arm < 13; arm++) {
    const spread = (arm - 6) / 6;
    const tipX = spread * size * 1.1 + Math.sin(time * 1.8 + arm) * size * 0.14;
    const tipY = -size * (1.25 + (1 - Math.abs(spread)) * 0.4);
    context.strokeStyle = "#c86fb2";
    context.lineWidth = Math.max(2, size * 0.14);
    context.beginPath();
    context.moveTo(spread * size * 0.6, -size * 0.3);
    context.quadraticCurveTo(spread * size * 0.8, -size * 0.8, tipX, tipY);
    context.stroke();
    context.fillStyle = "#f7c6e8";
    context.beginPath();
    context.arc(tipX, tipY, Math.max(1.5, size * 0.08), 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#8f4f8a";
  context.beginPath();
  context.ellipse(0, -size * 0.2, size * 0.75, size * 0.25, 0, 0, Math.PI * 2);
  context.fill();
}

export function paintClownfish(context) {
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

// A round cartoon eye looking the way the animal swims.
function paintEye(context, x, y, radius) {
  context.fillStyle = "#f7ffef";
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(x + radius * 0.25, y, radius * 0.56, 0, Math.PI * 2);
  context.fill();
}

// A flipper hanging from (x, y), swung back by angle. Round ends make a paddle; pointed a dolphin's fin.
function paintFlipper(context, x, y, length, width, angle, color, pointed) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = color;
  context.beginPath();
  if (pointed) {
    context.moveTo(-width, 0);
    context.quadraticCurveTo(-width * 0.7, length * 0.7, width * 0.1, length);
    context.quadraticCurveTo(width * 1.2, length * 0.45, width, 0);
    context.closePath();
  } else {
    context.ellipse(0, length * 0.5, width, length * 0.5, 0, 0, Math.PI * 2);
  }
  context.fill();
  context.restore();
}

// Whales and dolphins have flat tail flukes that beat up and down, not a fish's upright tail.
// From the side the far lobe shows just above the near one. Drawn back from the tail stock at (0, 0).
function paintFlukes(context, length, angle, color, farColor) {
  context.save();
  context.rotate(angle);
  context.fillStyle = farColor;
  context.beginPath();
  context.moveTo(length * 0.1, -length * 0.08);
  context.quadraticCurveTo(-length * 0.4, -length * 0.26, -length, -length * 0.2);
  context.quadraticCurveTo(-length * 0.74, -length * 0.06, -length * 0.68, length * 0.02);
  context.lineTo(0, length * 0.06);
  context.fill();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(length * 0.1, length * 0.02);
  context.quadraticCurveTo(-length * 0.4, length * 0.3, -length * 1.04, length * 0.22);
  context.quadraticCurveTo(-length * 0.76, length * 0.06, -length * 0.68, -length * 0.02);
  context.lineTo(0, -length * 0.1);
  context.fill();
  context.restore();
}

// Orca: black back, white chin and belly, a white patch behind the eye, a grey saddle and a tall fin.
function paintOrca(context, size, time, role) {
  const black = "#1c232c", white = "#f3f7f9";
  const beat = Math.sin(time * 2.4);
  const tailY = beat * size * 0.06;

  context.fillStyle = black;
  context.beginPath();
  context.moveTo(size * 0.24, -size * 0.3);
  context.quadraticCurveTo(size * 0.04, -size * 0.6, -size * 0.12, -size * 1.0);
  context.quadraticCurveTo(-size * 0.13, -size * 0.6, -size * 0.28, -size * 0.28);
  context.closePath();
  context.fill();
  context.save();
  context.translate(-size * 0.9, tailY);
  paintFlukes(context, size * 0.46, Math.sin(time * 2.4 - 0.9) * 0.32, black, "#0e1318");
  context.restore();

  context.beginPath();
  context.moveTo(size, size * 0.02);
  context.bezierCurveTo(size, -size * 0.2, size * 0.72, -size * 0.34, size * 0.3, -size * 0.36);
  context.bezierCurveTo(-size * 0.2, -size * 0.37, -size * 0.6, -size * 0.2, -size * 0.92, tailY - size * 0.05);
  context.lineTo(-size * 0.92, tailY + size * 0.05);
  context.bezierCurveTo(-size * 0.6, size * 0.22, -size * 0.1, size * 0.35, size * 0.35, size * 0.32);
  context.bezierCurveTo(size * 0.75, size * 0.29, size * 0.98, size * 0.2, size, size * 0.02);
  context.closePath();
  context.fillStyle = black;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = white;
  context.beginPath();
  context.moveTo(size * 1.1, size * 0.06);
  context.quadraticCurveTo(size * 0.7, size * 0.1, size * 0.35, size * 0.2);
  context.quadraticCurveTo(size * 0.05, size * 0.28, -size * 0.15, size * 0.22);
  context.bezierCurveTo(-size * 0.3, size * 0.14, -size * 0.4, -size * 0.02, -size * 0.64, -size * 0.04 + tailY * 0.5);
  context.bezierCurveTo(-size * 0.52, size * 0.1, -size * 0.55, size * 0.22, -size * 0.7, size * 0.6);
  context.lineTo(size * 1.1, size * 0.6);
  context.fill();
  context.beginPath();
  context.ellipse(size * 0.4, -size * 0.14, size * 0.14, size * 0.065, 0.12, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#9aa6b1";
  context.beginPath();
  context.ellipse(-size * 0.32, -size * 0.33, size * 0.24, size * 0.09, 0.1, 0, Math.PI * 2);
  context.fill();
  context.restore();
  paintFlipper(context, size * 0.42, size * 0.17, size * 0.4, size * 0.11, 1.05 + beat * 0.15, black);

  const eyeX = size * 0.62, eyeY = -size * 0.05, eye = Math.max(2.5, size * 0.06);
  paintEye(context, eyeX, eyeY, eye);
  if (role === "predator") {
    // A hunter's look: a stern brow and a few small teeth, nothing scary.
    context.fillStyle = black;
    context.beginPath();
    context.moveTo(eyeX - eye * 1.4, eyeY - eye * 1.6);
    context.lineTo(eyeX + eye * 1.4, eyeY - eye * 1.6);
    context.lineTo(eyeX + eye * 1.4, eyeY - eye * 0.1);
    context.lineTo(eyeX - eye * 1.4, eyeY - eye * 0.9);
    context.fill();
    context.strokeStyle = "#c9d3db";
    context.lineWidth = Math.max(1.5, size * 0.03);
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(eyeX - eye * 0.9, eyeY - eye * 1.9);
    context.lineTo(eyeX + eye * 1.5, eyeY - eye * 0.8);
    context.stroke();
    context.fillStyle = "#6d2433";
    context.beginPath();
    context.moveTo(size * 0.97, size * 0.06);
    context.lineTo(size * 0.62, size * 0.08);
    context.lineTo(size * 0.9, size * 0.15);
    context.closePath();
    context.fill();
    context.fillStyle = "#ffffff";
    context.beginPath();
    for (let tooth = 0; tooth < 4; tooth++) {
      const x = size * (0.69 + tooth * 0.075);
      const y = size * (0.08 - (tooth + 0.5) * 0.005);
      context.moveTo(x - size * 0.022, y);
      context.lineTo(x + size * 0.022, y);
      context.lineTo(x, y + size * 0.045);
    }
    context.fill();
    return;
  }
  context.strokeStyle = "#0b0f14";
  context.lineWidth = Math.max(1.5, size * 0.025);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(size * 0.99, size * 0.07);
  context.quadraticCurveTo(size * 0.76, size * 0.15, size * 0.62, size * 0.06);
  context.stroke();
}

// Dolphin: grey with a pale belly, a long beak, a curved fin and a built-in smile.
function paintDolphin(context, size, time, role) {
  const back = "#6e8ba3", belly = "#dbe6ee", dark = "#56728b";
  const beat = Math.sin(time * 4);
  const tailY = beat * size * 0.07;

  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(size * 0.2, -size * 0.25);
  context.quadraticCurveTo(size * 0.02, -size * 0.52, -size * 0.3, -size * 0.62);
  context.quadraticCurveTo(-size * 0.16, -size * 0.42, -size * 0.3, -size * 0.2);
  context.closePath();
  context.fill();
  context.save();
  context.translate(-size * 0.88, tailY);
  paintFlukes(context, size * 0.42, Math.sin(time * 4 - 0.9) * 0.4, back, dark);
  context.restore();

  context.beginPath();
  context.moveTo(size * 1.08, size * 0.08);
  context.quadraticCurveTo(size * 0.96, size * 0.02, size * 0.78, 0);
  context.bezierCurveTo(size * 0.74, -size * 0.2, size * 0.58, -size * 0.3, size * 0.35, -size * 0.31);
  context.bezierCurveTo(-size * 0.05, -size * 0.33, -size * 0.55, -size * 0.19, -size * 0.9, tailY - size * 0.045);
  context.lineTo(-size * 0.9, tailY + size * 0.045);
  context.bezierCurveTo(-size * 0.55, size * 0.18, -size * 0.05, size * 0.32, size * 0.35, size * 0.27);
  context.bezierCurveTo(size * 0.6, size * 0.24, size * 0.8, size * 0.16, size * 1.02, size * 0.15);
  context.quadraticCurveTo(size * 1.1, size * 0.14, size * 1.08, size * 0.08);
  context.closePath();
  context.fillStyle = belly;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(size * 1.2, size * 0.06);
  context.quadraticCurveTo(size * 0.85, size * 0.05, size * 0.6, size * 0.07);
  context.quadraticCurveTo(size * 0.2, size * 0.14, -size * 0.3, size * 0.05);
  context.quadraticCurveTo(-size * 0.7, 0, -size, tailY + size * 0.02);
  context.lineTo(-size, -size * 0.7);
  context.lineTo(size * 1.2, -size * 0.7);
  context.fill();
  context.restore();

  // The blowhole: a little bump on top of the head.
  context.fillStyle = back;
  context.beginPath();
  context.ellipse(size * 0.3, -size * 0.305, size * 0.08, size * 0.05, 0, Math.PI, Math.PI * 2);
  context.fill();
  context.strokeStyle = dark;
  context.lineWidth = Math.max(1, size * 0.025);
  context.beginPath();
  context.moveTo(size * 0.26, -size * 0.335);
  context.lineTo(size * 0.34, -size * 0.335);
  context.stroke();
  paintFlipper(context, size * 0.36, size * 0.14, size * 0.3, size * 0.07, 1 + beat * 0.15, dark, true);

  const eyeX = size * 0.55, eyeY = -size * 0.07;
  paintEye(context, eyeX, eyeY, Math.max(2.5, size * 0.1));
  context.strokeStyle = "#2e4557";
  context.lineWidth = Math.max(1, size * 0.03);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(size * 0.98, size * 0.12);
  context.quadraticCurveTo(size * 0.8, size * 0.16, size * 0.68, size * 0.08);
  context.stroke();
  if (role === "predator") paintBrow(context, eyeX, eyeY, size * 0.8);
}

// Jellyfish: a see-through bell that pulses, frilly arms and thin tentacles trailing below.
function paintJellyfish(context, size, time, role) {
  const pulse = Math.sin(time * 3);
  const width = size * (1 + pulse * 0.1);
  const height = size * (0.9 - pulse * 0.14);
  const rim = size * (0.05 + pulse * 0.05);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.strokeStyle = "rgba(250,208,242,.7)";
  context.lineWidth = Math.max(1, size * 0.05);
  context.beginPath();
  for (let strand = 0; strand < 7; strand++) {
    const start = (strand / 6 - 0.5) * width * 1.6;
    const length = size * (1.5 + (strand % 3) * 0.25);
    const bend = Math.sin(time * 2.2 + strand * 1.7) * size * 0.22;
    context.moveTo(start, rim);
    context.bezierCurveTo(start + bend, rim + length * 0.33, start * 0.8 - bend, rim + length * 0.66,
      start * 0.7 + Math.sin(time * 1.6 + strand) * size * 0.15, rim + length);
  }
  context.stroke();

  context.strokeStyle = "rgba(233,134,204,.85)";
  context.lineWidth = Math.max(2, size * 0.14);
  context.beginPath();
  for (let arm = 0; arm < 4; arm++) {
    const start = (arm - 1.5) * width * 0.2;
    context.moveTo(start, rim);
    for (let step = 1; step <= 9; step++) {
      const sway = Math.sin(time * 2 + arm * 1.3 + step * 0.35) * size * 0.012 * step;
      const frill = (step % 2 ? 1 : -1) * size * 0.07;
      context.lineTo(start * (1 + step * 0.06) + sway + frill, rim + step * size * 0.12);
    }
  }
  context.stroke();

  context.fillStyle = "rgba(245,165,225,.8)";
  context.beginPath();
  context.ellipse(0, rim, width, height, 0, Math.PI, Math.PI * 2);
  for (let scallop = 0; scallop < 6; scallop++) {
    const from = width - scallop * width / 3;
    context.quadraticCurveTo(from - width / 6, rim + size * 0.16, from - width / 3, rim);
  }
  context.fill();
  context.fillStyle = "rgba(196,128,226,.45)";
  context.beginPath();
  context.ellipse(0, rim, width * 0.58, height * 0.55, 0, Math.PI, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,232,249,.6)";
  context.beginPath();
  context.ellipse(-width * 0.38, rim - height * 0.62, width * 0.26, height * 0.14, -0.5, 0, Math.PI * 2);
  context.fill();

  const eye = Math.max(1.8, size * 0.1);
  context.fillStyle = "#173b52";
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(side * width * 0.3, rim - height * 0.32, eye, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#ffffff";
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(side * width * 0.3 + eye * 0.35, rim - height * 0.32 - eye * 0.35, eye * 0.35, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = "#7a2f68";
  context.lineWidth = Math.max(1, size * 0.05);
  context.beginPath();
  if (role === "predator") context.arc(0, rim - height * 0.05, size * 0.12, Math.PI + 0.5, -0.5);
  else context.arc(0, rim - height * 0.24, size * 0.12, 0.5, Math.PI - 0.5);
  context.stroke();
}

// Pufferfish: extra.puff runs from 0 (slim, spines flat) to 1 (a round ball ~1.5x bigger, spines out).
function paintPufferfish(context, size, time, role, extra) {
  const puff = Math.min(1, Math.max(0, Number(extra?.puff) || 0));
  const rx = size * (0.9 + 0.42 * puff);
  const ry = size * (0.62 + 0.64 * puff);
  const body = "#f0c14b", belly = "#fff1c4", fin = "#e3a63a";
  const wag = Math.sin(time * 8);

  context.fillStyle = fin;
  context.save();
  context.translate(-rx * 0.92, 0);
  context.rotate(wag * 0.25);
  context.beginPath();
  context.moveTo(size * 0.05, 0);
  context.quadraticCurveTo(-size * 0.25, -size * 0.35, -size * 0.42, -size * 0.3);
  context.quadraticCurveTo(-size * 0.34, 0, -size * 0.42, size * 0.3);
  context.quadraticCurveTo(-size * 0.25, size * 0.35, size * 0.05, 0);
  context.fill();
  context.restore();
  for (const side of [-1, 1]) {
    const x = -rx * 0.5, y = side * ry * 0.8;
    context.beginPath();
    context.moveTo(x + size * 0.14, y);
    context.quadraticCurveTo(x - size * 0.05, y + side * size * 0.38, x - size * 0.32, y + side * size * 0.2);
    context.lineTo(x - size * 0.12, y - side * size * 0.06);
    context.fill();
  }

  // Spines: lying back along the skin when calm, standing straight out when puffed.
  context.fillStyle = "#b8862e";
  context.beginPath();
  const spines = 22;
  const lean = 0.12 + 0.88 * puff;
  for (let spine = 0; spine < spines; spine++) {
    const angle = 0.5 + spine * (Math.PI * 2 - 1) / (spines - 1);
    if (Math.abs(angle - Math.PI) < 0.3) continue;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    let normalX = cos / rx, normalY = sin / ry;
    const normal = Math.hypot(normalX, normalY);
    normalX /= normal;
    normalY /= normal;
    const back = sin >= 0 ? 1 : -1;
    let tangentX = -rx * sin * back, tangentY = ry * cos * back;
    const tangent = Math.hypot(tangentX, tangentY);
    tangentX /= tangent;
    tangentY /= tangent;
    let pointX = tangentX * (1 - lean) + normalX * lean, pointY = tangentY * (1 - lean) + normalY * lean;
    const point = Math.hypot(pointX, pointY);
    const reach = size * (0.14 + 0.2 * puff) / point;
    pointX *= reach;
    pointY *= reach;
    const baseX = rx * cos - normalX * size * 0.03, baseY = ry * sin - normalY * size * 0.03;
    const half = size * 0.06;
    context.moveTo(baseX - tangentX * half, baseY - tangentY * half);
    context.lineTo(baseX + pointX, baseY + pointY);
    context.lineTo(baseX + tangentX * half, baseY + tangentY * half);
  }
  context.fill();

  context.fillStyle = body;
  context.beginPath();
  context.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = belly;
  context.beginPath();
  context.ellipse(rx * 0.05, ry * 0.42, rx * 0.72, ry * 0.48, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#8c6a2f";
  context.beginPath();
  for (const [x, y] of [[-0.5, -0.5], [-0.18, -0.68], [0.14, -0.72], [-0.68, -0.12], [-0.34, -0.2], [-0.02, -0.36]]) {
    const spot = Math.max(1, size * 0.07);
    context.moveTo(rx * x + spot, ry * y);
    context.arc(rx * x, ry * y, spot, 0, Math.PI * 2);
  }
  context.fill();

  context.save();
  context.translate(rx * 0.1, ry * 0.12);
  context.rotate(0.4 + Math.sin(time * 14) * 0.35);
  context.fillStyle = fin;
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(-size * 0.3, -size * 0.18, -size * 0.3, size * 0.06);
  context.quadraticCurveTo(-size * 0.2, size * 0.16, 0, 0);
  context.fill();
  context.restore();

  const eyeX = rx * 0.5, eyeY = -ry * 0.3;
  paintEye(context, eyeX, eyeY, size * (0.2 + 0.04 * puff));
  context.fillStyle = "#f09a62";
  context.beginPath();
  context.ellipse(rx * 0.97, ry * 0.1, size * 0.08, size * 0.07, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#7a4a1f";
  context.lineWidth = Math.max(1, size * 0.05);
  context.lineCap = "round";
  context.beginPath();
  if (puff > 0.5) context.arc(rx * 0.99, ry * 0.1, size * 0.035, 0, Math.PI * 2);
  else context.arc(rx * 0.86, ry * 0.02, size * 0.12, 0.4, 1.5);
  context.stroke();
  if (role === "predator") paintBrow(context, eyeX, eyeY, size * 1.2);
}

// Blue whale: the biggest animal ever, long and blue-grey with pale pleats under its chin.
function paintBlueWhale(context, size, time) {
  const back = "#56789a", dark = "#3f5f7f";
  const beat = Math.sin(time * 1.6);
  const tailY = beat * size * 0.05;

  context.save();
  context.translate(-size * 0.93, tailY);
  paintFlukes(context, size * 0.34, Math.sin(time * 1.6 - 0.9) * 0.3, back, dark);
  context.restore();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(-size * 0.46, -size * 0.13);
  context.quadraticCurveTo(-size * 0.56, -size * 0.16, -size * 0.64, -size * 0.2);
  context.quadraticCurveTo(-size * 0.62, -size * 0.14, -size * 0.66, -size * 0.1);
  context.closePath();
  context.fill();

  context.beginPath();
  context.moveTo(size, size * 0.03);
  context.bezierCurveTo(size * 0.98, -size * 0.08, size * 0.8, -size * 0.16, size * 0.5, -size * 0.19);
  context.bezierCurveTo(size * 0.1, -size * 0.23, -size * 0.45, -size * 0.17, -size * 0.93, tailY - size * 0.03);
  context.lineTo(-size * 0.93, tailY + size * 0.03);
  context.bezierCurveTo(-size * 0.45, size * 0.15, size * 0.05, size * 0.25, size * 0.45, size * 0.22);
  context.bezierCurveTo(size * 0.75, size * 0.2, size * 0.96, size * 0.14, size, size * 0.03);
  context.closePath();
  context.fillStyle = back;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = "#6f8fab";
  context.beginPath();
  context.moveTo(size * 0.4, size * 0.16);
  context.quadraticCurveTo(-size * 0.3, size * 0.1, -size, tailY + size * 0.02);
  context.lineTo(-size, size * 0.4);
  context.lineTo(size * 0.4, size * 0.4);
  context.fill();
  context.fillStyle = "rgba(196,216,232,.22)";
  context.beginPath();
  for (const [x, y, r] of [[0.72, -0.1, 0.018], [0.52, -0.14, 0.024], [0.38, -0.06, 0.016], [0.24, -0.16, 0.02],
    [0.1, -0.09, 0.026], [-0.06, -0.17, 0.018], [-0.2, -0.07, 0.022], [-0.36, -0.13, 0.018], [-0.5, -0.05, 0.02],
    [-0.64, -0.1, 0.014], [0.6, -0.03, 0.014], [-0.1, 0.02, 0.016]]) {
    context.moveTo(size * (x + r * 1.6), size * y);
    context.ellipse(size * x, size * y, size * r * 1.6, size * r, 0, 0, Math.PI * 2);
  }
  context.fill();
  context.fillStyle = "#c6d6e2";
  context.beginPath();
  context.moveTo(size * 1.05, size * 0.05);
  context.lineTo(size * 0.62, size * 0.09);
  context.quadraticCurveTo(size * 0.35, size * 0.12, size * 0.05, size * 0.3);
  context.lineTo(size * 1.05, size * 0.3);
  context.fill();
  context.strokeStyle = "rgba(80,110,135,.6)";
  context.lineWidth = Math.max(1, size * 0.008);
  context.beginPath();
  for (let groove = 0; groove < 4; groove++) {
    context.moveTo(size * (0.93 - groove * 0.03), size * (0.09 + groove * 0.028));
    context.quadraticCurveTo(size * 0.6, size * (0.13 + groove * 0.028), size * (0.2 + groove * 0.06), size * (0.19 + groove * 0.018));
  }
  context.stroke();
  context.restore();

  paintFlipper(context, size * 0.5, size * 0.14, size * 0.34, size * 0.035, 1.15 + beat * 0.12, dark, true);
  paintEye(context, size * 0.66, size * 0.01, Math.max(2.5, size * 0.035));
  context.strokeStyle = "#2b4661";
  context.lineWidth = Math.max(1.5, size * 0.014);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(size, size * 0.05);
  context.quadraticCurveTo(size * 0.75, size * 0.1, size * 0.6, size * 0.06);
  context.stroke();
}

// Manta ray, seen a little from above: wide wings flap (tips lagging behind), two curled horn fins
// at the front, a pale belly showing along the edges, a thin tail.
function paintManta(context, size, time, role) {
  const top = "#2b3a51", under = "#e6eef3";
  // Raising the wings lifts both tips on screen; the tips lag the middle so the wings bend.
  const lift = -Math.sin(time * 2.2) * size * 0.16;
  const tipLift = -Math.sin(time * 2.2 - 0.8) * size * 0.4;
  const farTip = -size * 0.98 + tipLift, farMid = -size * 0.52 + lift;
  const nearTip = size * 1.08 + tipLift, nearMid = size * 0.56 + lift;

  context.strokeStyle = top;
  context.lineWidth = Math.max(1.2, size * 0.04);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-size * 0.4, 0);
  context.quadraticCurveTo(-size * 0.9, Math.sin(time * 2.2 - 1) * size * 0.1, -size * 1.4, Math.sin(time * 2.2 - 2) * size * 0.14);
  context.stroke();

  for (const [color, drop] of [[under, size * 0.08], [top, 0]]) {
    context.save();
    context.translate(0, drop);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(size * 0.5, -size * 0.15);
    context.bezierCurveTo(size * 0.36, -size * 0.35, size * 0.14, farMid, -size * 0.34, farTip);
    context.quadraticCurveTo(-size * 0.14, farTip * 0.3, -size * 0.44, -size * 0.1);
    context.quadraticCurveTo(-size * 0.62, 0, -size * 0.44, size * 0.1);
    context.quadraticCurveTo(-size * 0.14, nearTip * 0.3, -size * 0.38, nearTip);
    context.bezierCurveTo(size * 0.14, nearMid, size * 0.36, size * 0.35, size * 0.5, size * 0.15);
    context.quadraticCurveTo(size * 0.58, 0, size * 0.5, -size * 0.15);
    context.fill();
    context.restore();
  }

  // A raised back down the middle, and the white chevrons on the shoulders.
  context.fillStyle = "#3a4b65";
  context.beginPath();
  context.ellipse(-size * 0.02, 0, size * 0.44, size * 0.16, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(230,238,244,.92)";
  for (const [side, midY] of [[-1, farMid], [1, nearMid]]) {
    context.beginPath();
    context.moveTo(size * 0.3, side * size * 0.24);
    context.quadraticCurveTo(size * 0.14, midY * 0.8, -size * 0.1, midY * 0.9);
    context.quadraticCurveTo(size * 0.02, midY * 0.55, size * 0.12, side * size * 0.2);
    context.fill();
  }

  // The two horn fins beside the mouth, pointing forward with the tips turned in a little.
  context.fillStyle = top;
  context.beginPath();
  for (const side of [-1, 1]) {
    context.moveTo(size * 0.46, side * size * 0.08);
    context.quadraticCurveTo(size * 0.62, side * size * 0.24, size * 0.86, side * size * 0.12);
    context.quadraticCurveTo(size * 0.66, side * size * 0.1, size * 0.5, side * size * 0.03);
  }
  context.fill();
  context.strokeStyle = under;
  context.lineWidth = Math.max(1.2, size * 0.05);
  context.beginPath();
  context.moveTo(size * 0.54, -size * 0.09);
  context.quadraticCurveTo(size * 0.64, 0, size * 0.54, size * 0.09);
  context.stroke();
  for (const side of [-1, 1]) paintEye(context, size * 0.4, side * size * 0.17, Math.max(2, size * 0.085));
  if (role === "predator") paintBrow(context, size * 0.4, -size * 0.17, size * 0.6);
}

// Lobster, alive on the sea bed: deep blue with pale speckles (lobsters only turn red when cooked),
// two big claws, long swaying feelers, a tail made of segments, walking legs.
function paintLobster(context, size, time) {
  const shell = "#2c5484", dark = "#17314f", light = "#4f7cb0", feeler = "#c27a45";
  context.lineCap = "round";
  context.lineJoin = "round";

  context.strokeStyle = feeler;
  context.lineWidth = Math.max(1.2, size * 0.06);
  for (const [lift, phase] of [[1, 0], [0.82, 1.4]]) {
    const wave = Math.sin(time * 1.8 + phase);
    context.beginPath();
    context.moveTo(size * 0.78, -size * 0.8);
    context.quadraticCurveTo(size * 1.6, -size * (1.9 * lift + 0.2) + wave * size * 0.12,
      -size * (0.3 - wave * 0.25), -size * (1.8 * lift + 0.15));
    context.stroke();
  }

  context.strokeStyle = dark;
  context.lineWidth = Math.max(1.4, size * 0.08);
  context.beginPath();
  for (let leg = 0; leg < 4; leg++) {
    const hip = size * (0.55 - leg * 0.2);
    const step = Math.sin(time * 5 + leg * 1.5) * size * 0.03;
    context.moveTo(hip, -size * 0.4);
    context.lineTo(hip + size * 0.14, -size * 0.24 + step);
    context.lineTo(hip + size * 0.06, 0);
  }
  context.stroke();

  paintLobsterClaw(context, size, [size * 0.62, -size * 0.66], [size * 0.9, -size * 1.0], [size * 1.2, -size * 1.2],
    -0.6, Math.sin(time * 2.5 + 1), "#22436b");

  // Tail fan, then the tail's segments from the back forward, then the head shell.
  context.fillStyle = shell;
  context.strokeStyle = dark;
  context.lineWidth = Math.max(1, size * 0.04);
  context.save();
  context.translate(-size * 1.12, -size * 0.3);
  for (const angle of [0.65, 0.1, -0.45]) {
    context.beginPath();
    context.ellipse(-size * 0.16 * Math.cos(angle), size * 0.16 * Math.sin(angle), size * 0.22, size * 0.09, angle, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  context.restore();
  for (let segment = 4; segment >= 0; segment--) {
    context.fillStyle = segment % 2 ? light : shell;
    context.beginPath();
    context.ellipse(-size * (0.14 + segment * 0.19), -size * (0.58 - segment * 0.055), size * 0.15,
      size * (0.27 - segment * 0.028), segment * 0.1, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  context.fillStyle = shell;
  context.beginPath();
  context.moveTo(size * 0.7, -size * 0.8);
  context.lineTo(size * 0.95, -size * 0.74);
  context.lineTo(size * 0.7, -size * 0.64);
  context.fill();
  context.beginPath();
  context.ellipse(size * 0.3, -size * 0.62, size * 0.48, size * 0.3, -0.05, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(size * 0.1, -size * 0.62, size * 0.25, -0.9, 0.9);
  context.stroke();
  context.fillStyle = "rgba(150,190,235,.55)";
  context.beginPath();
  context.ellipse(size * 0.32, -size * 0.8, size * 0.28, size * 0.07, -0.05, 0, Math.PI * 2);
  for (const [x, y] of [[0.45, -0.58], [0.2, -0.5], [0.55, -0.7], [-0.35, -0.55], [-0.72, -0.45]]) {
    context.moveTo(size * (x + 0.04), size * y);
    context.arc(size * x, size * y, size * 0.04, 0, Math.PI * 2);
  }
  context.fill();

  context.strokeStyle = shell;
  context.lineWidth = Math.max(1.4, size * 0.08);
  context.beginPath();
  context.moveTo(size * 0.62, -size * 0.84);
  context.lineTo(size * 0.66, -size * 1.0);
  context.stroke();
  paintEye(context, size * 0.67, -size * 1.04, Math.max(2, size * 0.12));
  context.strokeStyle = dark;
  context.lineWidth = Math.max(1, size * 0.05);
  context.beginPath();
  context.arc(size * 0.64, -size * 0.66, size * 0.1, 0.5, 1.9);
  context.stroke();

  paintLobsterClaw(context, size, [size * 0.62, -size * 0.5], [size * 0.98, -size * 0.62], [size * 1.36, -size * 0.8],
    -0.4, Math.sin(time * 2.5), shell);
}

// A lobster's arm and big claw: a fat hand with two pincer fingers that open and close.
function paintLobsterClaw(context, size, shoulder, elbow, hand, angle, snap, color) {
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.8, size * 0.13);
  context.beginPath();
  context.moveTo(...shoulder);
  context.lineTo(...elbow);
  context.lineTo(...hand);
  context.stroke();
  const open = 0.22 + snap * 0.12;
  context.save();
  context.translate(...hand);
  context.rotate(angle);
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(0, 0, size * 0.36, size * 0.22, 0, 0, Math.PI * 2);
  for (const side of [-1, 1]) {
    const pivotX = size * 0.26, pivotY = side * size * 0.07;
    const tipX = pivotX + Math.cos(side * open) * size * 0.36, tipY = pivotY + Math.sin(side * open) * size * 0.36;
    context.moveTo(pivotX, pivotY - size * 0.09);
    context.quadraticCurveTo(tipX, tipY - side * size * 0.08, tipX, tipY);
    context.quadraticCurveTo(tipX - size * 0.12, tipY + side * size * 0.02, pivotX, pivotY + size * 0.09);
  }
  context.fill();
  context.fillStyle = "rgba(150,190,235,.4)";
  context.beginPath();
  context.ellipse(-size * 0.04, -size * 0.07, size * 0.2, size * 0.06, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

// Sea urchin: a round purple ball of spines sitting on the sea bed.
function paintUrchin(context, size, time) {
  const radius = size * 0.8, centerY = -size * 0.72;
  context.lineCap = "round";
  for (const [color, long, first] of [["#4a2270", 1, 0], ["#8a4bb5", 0.72, 1]]) {
    context.strokeStyle = color;
    context.lineWidth = Math.max(1.2, size * 0.09);
    context.beginPath();
    for (let spike = first; spike < 26; spike += 2) {
      const angle = 0.42 - spike / 25 * (Math.PI + 0.84) + Math.sin(time * 1.3 + spike * 0.7) * 0.06;
      const reach = radius + size * 0.75 * long;
      context.moveTo(Math.cos(angle) * radius * 0.7, centerY + Math.sin(angle) * radius * 0.7);
      context.lineTo(Math.cos(angle) * reach, centerY + Math.sin(angle) * reach);
    }
    context.stroke();
  }
  context.strokeStyle = "#f3c6f5";
  context.lineWidth = Math.max(1, size * 0.05);
  context.beginPath();
  for (const x of [-0.55, -0.25, 0.25, 0.55]) {
    context.moveTo(size * x, centerY + radius * 0.8);
    context.lineTo(size * x * 1.25, 0);
  }
  context.stroke();

  context.fillStyle = "#7a3a9e";
  context.beginPath();
  context.ellipse(0, centerY, radius, radius * 0.94, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(205,160,235,.5)";
  context.beginPath();
  context.ellipse(-radius * 0.35, centerY - radius * 0.45, radius * 0.35, radius * 0.2, -0.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#9d5cc4";
  for (const [x, y] of [[0.55, -0.35], [-0.6, 0.1], [0.62, 0.3], [0, 0.62], [-0.3, 0.5]]) {
    context.beginPath();
    context.arc(radius * x, centerY + radius * y, Math.max(1, size * 0.06), 0, Math.PI * 2);
    context.fill();
  }
  for (const side of [-1, 1]) paintEye(context, side * radius * 0.32, centerY - radius * 0.05, Math.max(1.8, size * 0.14));
  context.strokeStyle = "#3d1a5a";
  context.lineWidth = Math.max(1, size * 0.06);
  context.beginPath();
  context.arc(radius * 0.04, centerY + radius * 0.18, size * 0.14, 0.4, Math.PI - 0.4);
  context.stroke();
}

// The hammerhead's tail (the whale shark uses it too), from the tail stock at (0, 0): the upper lobe is longer.
function paintHammerheadTail(context, size, upper, lower) {
  context.beginPath();
  context.moveTo(size * 0.06, -size * 0.07);
  context.quadraticCurveTo(-size * upper * 0.35, -size * upper * 0.35, -size * upper * 0.82, -size * upper);
  context.quadraticCurveTo(-size * upper * 0.5, -size * upper * 0.35, -size * 0.2, -size * 0.01);
  context.quadraticCurveTo(-size * lower * 0.7, size * lower * 0.45, -size * lower * 0.72, size * lower);
  context.quadraticCurveTo(-size * lower * 0.2, size * lower * 0.5, size * 0.06, size * 0.07);
  context.closePath();
  context.fill();
}

// Hammerhead shark: grey-brown with a tall curved fin; its flat hammer head, seen a little from above,
// has an eye at each end so it can see above and below at the same time.
function paintHammerhead(context, size, time) {
  const back = "#8a8474", belly = "#f1ede3", dark = "#716b5c";
  const beat = Math.sin(time * 5);
  const tailY = beat * size * 0.04;

  context.fillStyle = dark;
  context.save();
  context.translate(-size * 0.86, tailY);
  context.rotate(Math.sin(time * 5 - 0.7) * 0.16);
  paintHammerheadTail(context, size, 0.62, 0.34);
  context.restore();

  // The tall sickle-shaped fin, a small second fin and the fin underneath.
  context.beginPath();
  context.moveTo(size * 0.2, -size * 0.24);
  context.quadraticCurveTo(size * 0.08, -size * 0.62, -size * 0.14, -size * 0.9);
  context.quadraticCurveTo(-size * 0.1, -size * 0.52, -size * 0.28, -size * 0.22);
  context.closePath();
  context.moveTo(-size * 0.5, -size * 0.14);
  context.lineTo(-size * 0.64, -size * 0.28);
  context.lineTo(-size * 0.66, -size * 0.1);
  context.closePath();
  context.moveTo(-size * 0.42, size * 0.14);
  context.lineTo(-size * 0.6, size * 0.26);
  context.lineTo(-size * 0.62, size * 0.08);
  context.closePath();
  context.fill();

  context.beginPath();
  context.moveTo(size * 0.86, 0);
  context.bezierCurveTo(size * 0.82, -size * 0.18, size * 0.55, -size * 0.28, size * 0.2, -size * 0.28);
  context.bezierCurveTo(-size * 0.2, -size * 0.28, -size * 0.6, -size * 0.15, -size * 0.9, tailY - size * 0.04);
  context.lineTo(-size * 0.9, tailY + size * 0.04);
  context.bezierCurveTo(-size * 0.6, size * 0.14, -size * 0.2, size * 0.24, size * 0.2, size * 0.23);
  context.bezierCurveTo(size * 0.55, size * 0.22, size * 0.82, size * 0.16, size * 0.86, 0);
  context.closePath();
  context.fillStyle = belly;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(size, size * 0.06);
  context.quadraticCurveTo(size * 0.3, size * 0.12, -size * 0.3, size * 0.04);
  context.quadraticCurveTo(-size * 0.7, 0, -size, tailY + size * 0.01);
  context.lineTo(-size, -size * 0.5);
  context.lineTo(size, -size * 0.5);
  context.fill();
  context.restore();

  context.strokeStyle = "rgba(70,64,52,.55)";
  context.lineWidth = Math.max(1, size * 0.025);
  context.lineCap = "round";
  context.beginPath();
  for (let slit = 0; slit < 4; slit++) {
    const x = size * (0.46 + slit * 0.06);
    context.moveTo(x, -size * 0.12);
    context.quadraticCurveTo(x - size * 0.03, size * 0.02, x, size * 0.13);
  }
  context.stroke();
  paintFlipper(context, size * 0.34, size * 0.14, size * 0.34, size * 0.08, 0.95 + beat * 0.1, dark, true);

  // The hammer: a wide flat bar across the front, swinging a little as it scans the sand.
  context.save();
  context.translate(size * 0.8, 0);
  context.rotate(Math.sin(time * 1.7) * 0.07);
  // A darker copy just behind shows the hammer's thickness, like a flat plate seen from above.
  for (const [color, shift] of [[dark, -size * 0.035], [back, 0]]) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(size * 0.18 + shift, 0);
    context.quadraticCurveTo(size * 0.18 + shift, -size * 0.34, size * 0.1 + shift, -size * 0.56);
    context.quadraticCurveTo(size * 0.04 + shift, -size * 0.68, -size * 0.06 + shift, -size * 0.61);
    context.quadraticCurveTo(-size * 0.1 + shift, -size * 0.54, -size * 0.05 + shift, -size * 0.44);
    context.quadraticCurveTo(-size * 0.02 + shift, -size * 0.2, -size * 0.1 + shift, -size * 0.1);
    context.lineTo(-size * 0.1 + shift, size * 0.1);
    context.quadraticCurveTo(-size * 0.02 + shift, size * 0.2, -size * 0.05 + shift, size * 0.44);
    context.quadraticCurveTo(-size * 0.1 + shift, size * 0.54, -size * 0.06 + shift, size * 0.61);
    context.quadraticCurveTo(size * 0.04 + shift, size * 0.68, size * 0.1 + shift, size * 0.56);
    context.quadraticCurveTo(size * 0.18 + shift, size * 0.34, size * 0.18 + shift, 0);
    context.fill();
  }
  const eye = Math.max(2.5, size * 0.085);
  paintEye(context, size * 0.03, -size * 0.56, eye);
  paintEye(context, size * 0.03, size * 0.56, eye);
  context.strokeStyle = "#4d4839";
  context.lineWidth = Math.max(1, size * 0.03);
  context.beginPath();
  context.arc(size * 0.02, size * 0.02, size * 0.1, 0.5, 1.9);
  context.stroke();
  context.restore();
}

// Whale shark: the biggest fish, a gentle giant with a wide flat head, a huge mouth for sieving
// plankton, and a dark back covered in white spots and pale stripes like a checkerboard.
function paintWhaleShark(context, size, time) {
  const back = "#46607e", belly = "#dde6ec", dark = "#3a5169";
  const beat = Math.sin(time * 1.8);
  const tailY = beat * size * 0.04;
  const open = 0.5 + 0.5 * Math.sin(time * 1.3);

  context.fillStyle = dark;
  context.save();
  context.translate(-size * 0.86, tailY);
  context.rotate(Math.sin(time * 1.8 - 0.7) * 0.12);
  paintHammerheadTail(context, size, 0.66, 0.36);
  context.restore();

  context.beginPath();
  context.moveTo(-size * 0.08, -size * 0.32);
  context.quadraticCurveTo(-size * 0.22, -size * 0.54, -size * 0.4, -size * 0.7);
  context.quadraticCurveTo(-size * 0.38, -size * 0.46, -size * 0.46, -size * 0.27);
  context.closePath();
  context.moveTo(-size * 0.62, -size * 0.16);
  context.lineTo(-size * 0.74, -size * 0.28);
  context.lineTo(-size * 0.76, -size * 0.1);
  context.closePath();
  context.fill();

  // A broad flat head with a blunt front, and a big heavy body.
  context.beginPath();
  context.moveTo(size * 1.02, -size * 0.08);
  context.bezierCurveTo(size, -size * 0.2, size * 0.85, -size * 0.27, size * 0.55, -size * 0.31);
  context.bezierCurveTo(size * 0.1, -size * 0.37, -size * 0.5, -size * 0.24, -size * 0.9, tailY - size * 0.05);
  context.lineTo(-size * 0.9, tailY + size * 0.05);
  context.bezierCurveTo(-size * 0.5, size * 0.2, size * 0.1, size * 0.33, size * 0.55, size * 0.28);
  context.bezierCurveTo(size * 0.85, size * 0.25, size * 1.02, size * 0.2, size * 1.02, size * 0.1);
  context.closePath();
  context.fillStyle = belly;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(size * 1.1, size * 0.08);
  context.quadraticCurveTo(size * 0.4, size * 0.14, -size * 0.2, size * 0.12);
  context.quadraticCurveTo(-size * 0.6, size * 0.06, -size, tailY + size * 0.02);
  context.lineTo(-size, -size * 0.5);
  context.lineTo(size * 1.1, -size * 0.5);
  context.fill();
  // Pale stripes down the sides, and ridges running along them, make a checkerboard.
  context.strokeStyle = "rgba(225,236,245,.35)";
  context.lineWidth = Math.max(1, size * 0.014);
  context.beginPath();
  for (let stripe = 0; stripe < 13; stripe++) {
    const x = size * (0.52 - stripe * 0.11);
    context.moveTo(x, -size * 0.4);
    context.quadraticCurveTo(x - size * 0.03, 0, x - size * 0.01, size * 0.14);
  }
  context.stroke();
  context.strokeStyle = "rgba(200,218,232,.55)";
  context.lineWidth = Math.max(1, size * 0.02);
  context.beginPath();
  for (const y of [-0.2, -0.09, 0.02]) {
    context.moveTo(size * 0.6, size * y);
    context.quadraticCurveTo(-size * 0.2, size * (y - 0.03), -size * 0.9, tailY + size * y * 0.25);
  }
  context.stroke();
  context.fillStyle = "rgba(244,249,252,.92)";
  context.beginPath();
  for (let column = 0; column < 13; column++) {
    for (let row = 0; row < 4; row++) {
      const x = size * (0.465 - column * 0.11 + (row % 2) * 0.02);
      const y = size * (-0.255 + row * 0.11 + (column % 2) * 0.01);
      const r = Math.max(1, size * (0.022 - column * 0.0008));
      context.moveTo(x + r, y);
      context.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  for (const [x, y] of [[0.92, -0.13], [0.86, -0.2], [0.78, -0.16], [0.71, -0.22], [0.7, -0.09], [0.63, -0.15],
    [0.58, -0.23], [0.66, -0.02]]) {
    const r = Math.max(1, size * 0.016);
    context.moveTo(size * x + r, size * y);
    context.arc(size * x, size * y, r, 0, Math.PI * 2);
  }
  context.fill();
  context.restore();

  // The wide mouth right at the front of the flat head, gently opening and closing to sieve plankton.
  const gape = size * (0.012 + 0.058 * open);
  context.fillStyle = "#b9c9d6";
  traceWhaleSharkMouth(context, size, gape, size * 0.018);
  context.fill();
  context.fillStyle = "#1d2a40";
  traceWhaleSharkMouth(context, size, gape, 0);
  context.fill();
  context.fillStyle = "rgba(214,245,200,.85)";
  context.beginPath();
  for (let speck = 0; speck < 4; speck++) {
    const drift = (time * 0.35 + speck / 4) % 1;
    const x = size * (1.36 - drift * 0.3), y = size * (0.035 + Math.sin(time * 2 + speck * 2.1) * 0.05 * (1 - drift));
    const r = Math.max(1.2, size * 0.014) * (1 - drift * 0.5);
    context.moveTo(x + r, y);
    context.arc(x, y, r, 0, Math.PI * 2);
  }
  context.fill();

  context.strokeStyle = "rgba(34,49,73,.6)";
  context.lineWidth = Math.max(1, size * 0.015);
  context.beginPath();
  for (let slit = 0; slit < 5; slit++) {
    const x = size * (0.5 + slit * 0.045);
    context.moveTo(x, -size * 0.12);
    context.quadraticCurveTo(x - size * 0.02, size * 0.02, x, size * 0.16);
  }
  context.stroke();
  paintFlipper(context, size * 0.36, size * 0.16, size * 0.36, size * 0.08, 1.0 + beat * 0.1, dark, true);
  paintEye(context, size * 0.8, -size * 0.07, Math.max(2.5, size * 0.04));
}

// The whale shark's mouth: a long flat opening across the front with rounded corners; grow widens it for the lips.
function traceWhaleSharkMouth(context, size, gape, grow) {
  const mid = size * 0.035, front = size * 1.05 + grow * 0.5, back = size * 0.8 - grow;
  const top = mid - gape - grow, bottom = mid + gape + grow;
  context.beginPath();
  context.moveTo(front, top);
  context.quadraticCurveTo(size * 0.95, top + size * 0.004, back + size * 0.06, top + gape * 0.25);
  context.bezierCurveTo(back, top + gape * 0.3, back, bottom - gape * 0.3, back + size * 0.06, bottom - gape * 0.25);
  context.quadraticCurveTo(size * 0.95, bottom - size * 0.004, front, bottom);
  context.quadraticCurveTo(front + size * 0.035, mid, front, top);
}

// Narwhal: a small Arctic whale, mottled grey on top and pale below, with a round head, no back fin
// (just a low ridge) and a long spiral tusk, the unicorn of the sea.
function paintNarwhal(context, size, time) {
  const back = "#7f8b95", belly = "#eef1ef", dark = "#5a6671", mottle = "#4d5963";
  const beat = Math.sin(time * 3);
  const tailY = beat * size * 0.06;

  context.save();
  context.translate(-size * 0.78, tailY);
  paintFlukes(context, size * 0.4, Math.sin(time * 3 - 0.9) * 0.38, back, dark);
  context.restore();
  paintNarwhalTusk(context, size, size * 0.52, size * 0.03, size * 0.88, -0.1);

  context.beginPath();
  context.moveTo(size * 0.68, size * 0.04);
  context.bezierCurveTo(size * 0.7, -size * 0.22, size * 0.5, -size * 0.35, size * 0.2, -size * 0.35);
  context.bezierCurveTo(-size * 0.14, -size * 0.35, -size * 0.52, -size * 0.2, -size * 0.8, tailY - size * 0.04);
  context.lineTo(-size * 0.8, tailY + size * 0.04);
  context.bezierCurveTo(-size * 0.52, size * 0.19, -size * 0.14, size * 0.33, size * 0.2, size * 0.31);
  context.bezierCurveTo(size * 0.5, size * 0.29, size * 0.68, size * 0.22, size * 0.68, size * 0.04);
  context.closePath();
  context.fillStyle = belly;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(size * 0.8, size * 0.06);
  context.quadraticCurveTo(size * 0.5, size * 0.02, size * 0.2, size * 0.08);
  context.quadraticCurveTo(-size * 0.3, size * 0.1, -size * 0.9, tailY);
  context.lineTo(-size * 0.9, -size * 0.5);
  context.lineTo(size * 0.8, -size * 0.5);
  context.fill();
  context.fillStyle = mottle;
  context.beginPath();
  for (const [x, y, r] of [[0.3, -0.24, 0.05], [0.12, -0.16, 0.04], [-0.04, -0.26, 0.05], [-0.2, -0.14, 0.045],
    [-0.36, -0.22, 0.04], [-0.5, -0.1, 0.035], [0.44, -0.12, 0.03], [-0.62, -0.08, 0.03], [0.02, -0.06, 0.03]]) {
    context.moveTo(size * (x + r * 1.3), size * y);
    context.ellipse(size * x, size * y, size * r * 1.3, size * r, 0.3, 0, Math.PI * 2);
  }
  context.fill();
  context.fillStyle = "rgba(127,139,149,.6)";
  context.beginPath();
  for (const [x, y, r] of [[0.28, 0.12, 0.03], [0.04, 0.16, 0.035], [-0.18, 0.12, 0.03], [-0.4, 0.08, 0.025], [0.16, 0.06, 0.025]]) {
    context.moveTo(size * (x + r * 1.3), size * y);
    context.ellipse(size * x, size * y, size * r * 1.3, size * r, 0.3, 0, Math.PI * 2);
  }
  context.fill();
  context.restore();

  // No back fin, just a low bumpy ridge.
  context.fillStyle = dark;
  context.beginPath();
  for (let bump = 0; bump < 4; bump++) {
    const x = -size * (0.1 + bump * 0.1);
    const y = -size * (0.325 - bump * 0.04);
    context.moveTo(x + size * 0.045, y + size * 0.02);
    context.ellipse(x, y + size * 0.02, size * 0.045, size * 0.035, 0, Math.PI, Math.PI * 2);
  }
  context.fill();

  paintFlipper(context, size * 0.32, size * 0.2, size * 0.3, size * 0.07, 0.8 + beat * 0.15, dark);
  paintEye(context, size * 0.42, -size * 0.04, Math.max(2.5, size * 0.085));
  context.strokeStyle = "#3d4852";
  context.lineWidth = Math.max(1, size * 0.03);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(size * 0.62, size * 0.12);
  context.quadraticCurveTo(size * 0.52, size * 0.17, size * 0.44, size * 0.11);
  context.stroke();
}

// The narwhal's tusk: a long straight tooth from its upper lip, twisted in a spiral.
function paintNarwhalTusk(context, size, x, y, length, angle) {
  const width = size * 0.065;
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.beginPath();
  context.moveTo(0, -width);
  context.lineTo(length, -width * 0.2);
  context.quadraticCurveTo(length + width * 0.5, 0, length, width * 0.2);
  context.lineTo(0, width);
  context.closePath();
  context.fillStyle = "#f4ecd2";
  context.fill();
  context.clip();
  context.strokeStyle = "#b9a57c";
  context.lineWidth = Math.max(1, size * 0.026);
  context.beginPath();
  for (let along = 0; along < length; along += size * 0.08) {
    context.moveTo(along, width * 1.2);
    context.lineTo(along + width * 1.4, -width * 1.2);
  }
  context.stroke();
  context.restore();
}

// Anglerfish: a lumpy deep-sea fish with a huge goofy toothy grin and a glowing lure on a rod from its forehead.
function paintAnglerfish(context, size, time) {
  const skin = "#553a34", dark = "#3a2622", light = "#76544a";
  const wag = Math.sin(time * 6);
  const bob = Math.sin(time * 1.9);
  const pulse = 0.5 + 0.5 * Math.sin(time * 3.4);
  const lureX = size * (0.96 + bob * 0.04), lureY = -size * (0.94 + bob * 0.05);

  context.fillStyle = dark;
  context.save();
  context.translate(-size * 0.74, 0);
  context.rotate(wag * 0.25);
  context.beginPath();
  context.moveTo(size * 0.05, 0);
  context.quadraticCurveTo(-size * 0.2, -size * 0.42, -size * 0.46, -size * 0.36);
  context.quadraticCurveTo(-size * 0.36, 0, -size * 0.46, size * 0.36);
  context.quadraticCurveTo(-size * 0.2, size * 0.42, size * 0.05, 0);
  context.fill();
  context.restore();
  context.beginPath();
  context.moveTo(-size * 0.1, -size * 0.6);
  context.lineTo(-size * 0.3, -size * 0.88);
  context.lineTo(-size * 0.36, -size * 0.66);
  context.lineTo(-size * 0.5, -size * 0.76);
  context.lineTo(-size * 0.54, -size * 0.46);
  context.fill();

  // A round lumpy body, and the big lower jaw jutting forward and up.
  context.fillStyle = skin;
  context.beginPath();
  for (let bump = 0; bump <= 16; bump++) {
    const angle = bump / 16 * Math.PI * 2;
    const reach = 1 + (bump % 2 ? 0.06 : -0.02);
    const x = -size * 0.05 + Math.cos(angle) * size * 0.78 * reach, y = size * 0.02 + Math.sin(angle) * size * 0.7 * reach;
    const mid = (bump - 0.5) / 16 * Math.PI * 2;
    if (bump === 0) context.moveTo(x, y);
    else context.quadraticCurveTo(-size * 0.05 + Math.cos(mid) * size * 0.84, size * 0.02 + Math.sin(mid) * size * 0.76, x, y);
  }
  context.fill();
  context.beginPath();
  context.moveTo(-size * 0.3, size * 0.7);
  context.quadraticCurveTo(size * 0.82, size * 0.86, size * 1.06, -size * 0.3);
  context.lineTo(size * 0.6, -size * 0.2);
  context.fill();
  context.fillStyle = light;
  context.beginPath();
  for (const [x, y, r] of [[-0.3, -0.36, 0.1], [-0.52, 0.12, 0.07], [-0.1, -0.54, 0.06], [-0.46, -0.16, 0.05], [0.02, 0.56, 0.05]]) {
    context.moveTo(size * (x + r), size * y);
    context.arc(size * x, size * y, size * r, 0, Math.PI * 2);
  }
  context.fill();

  // The huge upturned mouth with little needle teeth.
  const corner = [-size * 0.1, size * 0.1];
  const lower = [[size * 0.48, size * 0.7], [size * 0.99, -size * 0.27]];
  const upper = [[size * 0.36, -size * 0.14], [size * 0.76, -size * 0.28]];
  context.fillStyle = "#1c0f12";
  context.beginPath();
  context.moveTo(...corner);
  context.quadraticCurveTo(...lower[0], ...lower[1]);
  context.lineTo(...upper[1]);
  context.quadraticCurveTo(...upper[0], ...corner);
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = "#b8515f";
  context.beginPath();
  context.ellipse(size * 0.44, size * 0.3, size * 0.32, size * 0.15, -0.45, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.fillStyle = "#f4f1e6";
  context.beginPath();
  for (const [[control, end], from, to, count, side, long] of [[lower, 0.3, 0.92, 5, 1, 0.15], [upper, 0.35, 0.9, 4, -1, 0.11]]) {
    for (let tooth = 0; tooth < count; tooth++) {
      const t = from + (to - from) * tooth / (count - 1);
      const x = (1 - t) * (1 - t) * corner[0] + 2 * (1 - t) * t * control[0] + t * t * end[0];
      const y = (1 - t) * (1 - t) * corner[1] + 2 * (1 - t) * t * control[1] + t * t * end[1];
      let dx = 2 * (1 - t) * (control[0] - corner[0]) + 2 * t * (end[0] - control[0]);
      let dy = 2 * (1 - t) * (control[1] - corner[1]) + 2 * t * (end[1] - control[1]);
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      const half = size * 0.032, reach = size * long;
      context.moveTo(x - dx * half, y - dy * half);
      context.lineTo(x + dy * side * reach, y - dx * side * reach);
      context.lineTo(x + dx * half, y + dy * half);
    }
  }
  context.fill();

  context.save();
  context.translate(-size * 0.2, size * 0.26);
  context.rotate(wag * 0.3);
  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(size * 0.04, 0);
  context.quadraticCurveTo(-size * 0.08, size * 0.24, -size * 0.28, size * 0.26);
  context.quadraticCurveTo(-size * 0.24, size * 0.08, -size * 0.3, -size * 0.08);
  context.quadraticCurveTo(-size * 0.12, -size * 0.1, size * 0.04, 0);
  context.fill();
  context.restore();
  paintEye(context, size * 0.26, -size * 0.42, Math.max(2, size * 0.12));

  // The rod grows from the forehead; its lure glows to lure little fish in the dark.
  context.strokeStyle = "#8a6a5e";
  context.lineWidth = Math.max(1.2, size * 0.07);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(size * 0.12, -size * 0.64);
  context.quadraticCurveTo(size * 0.26, -size * 1.4, lureX, lureY);
  context.stroke();
  const glow = size * (0.62 + pulse * 0.22);
  const halo = context.createRadialGradient(lureX, lureY, 0, lureX, lureY, glow);
  halo.addColorStop(0, `rgba(225,255,255,${0.8 + pulse * 0.2})`);
  halo.addColorStop(0.3, `rgba(120,240,255,${0.35 + pulse * 0.2})`);
  halo.addColorStop(1, "rgba(120,240,255,0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(lureX, lureY, glow, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#a6f6ff";
  context.beginPath();
  context.arc(lureX, lureY, Math.max(2.2, size * (0.13 + pulse * 0.02)), 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(lureX - size * 0.025, lureY - size * 0.025, Math.max(1.1, size * 0.065), 0, Math.PI * 2);
  context.fill();
}

// Sea otter: floats on its back with a rock on its tummy, banging a clam on it to crack it open.
function paintOtter(context, size, time) {
  const s = size;
  const fur = "#86573a", dark = "#5c3923", belly = "#a87653", cream = "#e8ddcc", paw = "#4a2e1d";
  const bob = Math.sin(time * 1.6);
  const lift = 0.5 + 0.5 * Math.sin(time * 3.2);
  context.save();
  context.rotate(bob * 0.05);
  context.lineCap = "round";
  context.lineJoin = "round";

  // A flat tail trailing behind.
  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(-s * 0.6, -s * 0.1);
  context.quadraticCurveTo(-s * 1.0, -s * 0.2, -s * 1.32, -s * 0.16 + bob * s * 0.04);
  context.quadraticCurveTo(-s * 1.4, -s * 0.06, -s * 1.3, -s * 0.02 + bob * s * 0.03);
  context.quadraticCurveTo(-s * 1.0, s * 0.08, -s * 0.6, s * 0.14);
  context.fill();

  // Big webbed back feet sticking up.
  for (const [x, lean, color] of [[-0.74, -0.55, dark], [-0.56, -0.12, paw]]) {
    context.save();
    context.translate(s * x, -s * 0.14);
    context.rotate(lean + Math.sin(time * 2.2 + x * 4) * 0.1);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(-s * 0.06, s * 0.04);
    context.lineTo(-s * 0.17, -s * 0.28);
    for (let toe = 0; toe < 4; toe++) {
      const from = -0.17 + toe * 0.085;
      context.quadraticCurveTo(s * (from + 0.01), -s * 0.4, s * (from + 0.085), -s * 0.3);
    }
    context.lineTo(s * 0.06, s * 0.04);
    context.fill();
    context.restore();
  }

  // Body lying on its back, the paler tummy facing up.
  context.fillStyle = fur;
  context.beginPath();
  context.ellipse(-s * 0.12, 0, s * 0.72, s * 0.3, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = belly;
  context.beginPath();
  context.ellipse(-s * 0.14, -s * 0.09, s * 0.6, s * 0.19, 0, 0, Math.PI * 2);
  context.fill();

  // The rock resting on the tummy, used like an anvil.
  const rockX = s * 0.08, rockY = -s * 0.3;
  context.fillStyle = "#8e959b";
  context.beginPath();
  context.ellipse(rockX, rockY, s * 0.23, s * 0.12, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#b9c0c5";
  context.beginPath();
  context.ellipse(rockX - s * 0.05, rockY - s * 0.04, s * 0.08, s * 0.035, -0.1, 0, Math.PI * 2);
  context.fill();

  // Short arms from the chest, the paws holding a clam just over the rock.
  const clamX = s * 0.22, clamY = -s * (0.46 + lift * 0.08);
  context.strokeStyle = dark;
  context.lineWidth = Math.max(2, s * 0.13);
  context.beginPath();
  context.moveTo(s * 0.5, -s * 0.26);
  context.lineTo(clamX + s * 0.15, clamY + s * 0.02);
  context.stroke();

  // Head raised at the front, pale face looking at you.
  const headX = s * 0.8, headY = -s * 0.3, head = s * 0.35;
  context.fillStyle = fur;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(headX + side * head * 0.7, headY - head * 0.7, s * 0.085, 0, Math.PI * 2);
    context.fill();
  }
  context.beginPath();
  context.arc(headX, headY, head, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = cream;
  context.beginPath();
  context.ellipse(headX, headY + head * 0.12, head * 0.86, head * 0.76, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = fur;
  context.beginPath();
  context.moveTo(s * 0.46, -s * 0.18);
  context.lineTo(clamX - s * 0.15, clamY + s * 0.03);
  context.stroke();
  context.fillStyle = "#f2c9a8";
  context.beginPath();
  context.moveTo(clamX - s * 0.06, clamY + s * 0.07);
  context.lineTo(clamX - s * 0.17, clamY);
  context.quadraticCurveTo(clamX, clamY - s * 0.3, clamX + s * 0.17, clamY);
  context.lineTo(clamX + s * 0.06, clamY + s * 0.07);
  context.closePath();
  context.fill();
  context.strokeStyle = "#c9876a";
  context.lineWidth = Math.max(1, s * 0.025);
  context.beginPath();
  for (const spread of [-0.08, 0, 0.08]) {
    context.moveTo(clamX, clamY + s * 0.05);
    context.lineTo(clamX + s * spread, clamY - s * 0.1);
  }
  context.stroke();
  context.fillStyle = paw;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(clamX + side * s * 0.15, clamY + s * 0.02, Math.max(1.5, s * 0.07), 0, Math.PI * 2);
    context.fill();
  }

  // Face: little dark eyes, a white muzzle with a black nose and whiskers.
  const eye = Math.max(1.6, s * 0.058);
  context.fillStyle = "#23160e";
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(headX + side * head * 0.38, headY - head * 0.12, eye, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#ffffff";
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(headX + side * head * 0.38 + eye * 0.35, headY - head * 0.12 - eye * 0.35, eye * 0.38, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#fbf7f0";
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(headX + side * head * 0.15, headY + head * 0.32, head * 0.2, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = "rgba(70,45,30,.55)";
  context.lineWidth = Math.max(1, s * 0.02);
  context.beginPath();
  for (const side of [-1, 1]) {
    for (const drop of [-0.06, 0.08]) {
      context.moveTo(headX + side * head * 0.3, headY + head * 0.32);
      context.lineTo(headX + side * head * 0.95, headY + head * (0.32 + drop * 2));
    }
  }
  context.stroke();
  context.fillStyle = "#23160e";
  context.beginPath();
  context.ellipse(headX, headY + head * 0.16, head * 0.17, head * 0.12, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

// Penguin: "flies" underwater, a black-and-white torpedo flapping its flipper wings.
function paintPenguin(context, size, time) {
  const s = size, black = "#1c2430", white = "#f6f7f2", gold = "#f6b53a";
  const flap = Math.sin(time * 5);
  context.lineCap = "round";
  context.lineJoin = "round";

  // A few bubbles trailing behind.
  context.strokeStyle = "rgba(225,246,255,.75)";
  context.lineWidth = Math.max(1, s * 0.05);
  for (let bubble = 0; bubble < 3; bubble++) {
    const phase = ((time * 0.7 + bubble / 3) % 1 + 1) % 1;
    context.beginPath();
    context.arc(-s * (1.05 + phase * 0.25), -s * (0.2 + phase * 0.7) + Math.sin(time * 3 + bubble * 2) * s * 0.04,
      s * (0.05 + bubble * 0.02) * (0.6 + phase * 0.6), 0, Math.PI * 2);
    context.stroke();
  }

  // Pink feet trailing at the back.
  context.fillStyle = "#f2946a";
  for (const [drop, phase] of [[0, 0], [0.09, 1.6]]) {
    const kick = Math.sin(time * 5 + phase) * s * 0.05;
    context.beginPath();
    context.moveTo(-s * 0.8, s * (0.1 + drop));
    context.lineTo(-s * 1.2, s * (0.08 + drop) + kick);
    context.lineTo(-s * 1.13, s * (0.24 + drop) + kick);
    context.closePath();
    context.fill();
  }

  context.beginPath();
  context.moveTo(s * 0.98, -s * 0.06);
  context.bezierCurveTo(s * 0.9, -s * 0.38, s * 0.55, -s * 0.46, s * 0.15, -s * 0.44);
  context.bezierCurveTo(-s * 0.35, -s * 0.42, -s * 0.8, -s * 0.22, -s * 1.12, -s * 0.02);
  context.bezierCurveTo(-s * 0.8, s * 0.26, -s * 0.3, s * 0.46, s * 0.2, s * 0.42);
  context.bezierCurveTo(s * 0.6, s * 0.38, s * 0.9, s * 0.22, s * 0.98, s * 0.05);
  context.closePath();
  context.fillStyle = black;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = white;
  context.beginPath();
  context.moveTo(s * 1.1, s * 0.3);
  context.lineTo(s * 0.74, s * 0.2);
  context.quadraticCurveTo(s * 0.5, -s * 0.02, s * 0.12, s * 0.04);
  context.quadraticCurveTo(-s * 0.6, s * 0.06, -s * 1.15, s * 0.02);
  context.lineTo(-s * 1.15, s * 0.6);
  context.lineTo(s * 1.1, s * 0.6);
  context.fill();
  context.fillStyle = "rgba(252,226,140,.75)";
  context.beginPath();
  context.ellipse(s * 0.56, s * 0.2, s * 0.22, s * 0.09, -0.3, 0, Math.PI * 2);
  context.fill();
  context.restore();

  // The golden patch down the side of the neck.
  context.fillStyle = gold;
  context.beginPath();
  context.ellipse(s * 0.52, s * 0.03, s * 0.09, s * 0.17, -0.45, 0, Math.PI * 2);
  context.fill();

  // Long beak: black on top, orange underneath.
  context.fillStyle = black;
  context.beginPath();
  context.moveTo(s * 0.92, -s * 0.1);
  context.quadraticCurveTo(s * 1.2, -s * 0.06, s * 1.38, s * 0.03);
  context.lineTo(s * 0.92, s * 0.03);
  context.fill();
  context.fillStyle = "#f28a3a";
  context.beginPath();
  context.moveTo(s * 0.92, s * 0.02);
  context.lineTo(s * 1.34, s * 0.03);
  context.quadraticCurveTo(s * 1.1, s * 0.1, s * 0.92, s * 0.08);
  context.fill();

  // The flipper wing beats up and down across the white belly.
  paintFlipper(context, s * 0.3, s * 0.08, s * 0.66, s * 0.12, 1.1 + flap * 0.45, black, true);
  paintEye(context, s * 0.72, -s * 0.16, Math.max(2.2, s * 0.1));
}

// Flying fish: a slim shiny fish with huge see-through wing fins for gliding over the waves.
function paintFlyingFish(context, size, time) {
  const s = size, back = "#2a62b6", belly = "#e3ecf3";
  const flutter = Math.sin(time * 7) * 0.06;

  // The far wings spread up behind the body.
  paintFlyingFishWing(context, s * 0.36, -s * 0.08, s * 1.25, -1, flutter, s);
  paintFlyingFishWing(context, -s * 0.34, -s * 0.06, s * 0.6, -1, flutter * 0.7, s);

  // Forked tail with a longer lower lobe.
  context.save();
  context.translate(-s * 0.84, 0);
  context.rotate(Math.sin(time * 9) * 0.12);
  context.fillStyle = "#3a78c8";
  context.beginPath();
  context.moveTo(s * 0.05, -s * 0.05);
  context.quadraticCurveTo(-s * 0.2, -s * 0.2, -s * 0.42, -s * 0.4);
  context.quadraticCurveTo(-s * 0.26, -s * 0.06, -s * 0.28, s * 0.02);
  context.quadraticCurveTo(-s * 0.35, s * 0.22, -s * 0.6, s * 0.5);
  context.quadraticCurveTo(-s * 0.24, s * 0.26, s * 0.05, s * 0.06);
  context.fill();
  context.restore();

  context.beginPath();
  context.moveTo(s * 1.02, s * 0.02);
  context.bezierCurveTo(s * 0.95, -s * 0.18, s * 0.5, -s * 0.26, 0, -s * 0.24);
  context.bezierCurveTo(-s * 0.4, -s * 0.22, -s * 0.7, -s * 0.1, -s * 0.86, -s * 0.04);
  context.lineTo(-s * 0.86, s * 0.05);
  context.bezierCurveTo(-s * 0.7, s * 0.12, -s * 0.4, s * 0.22, 0, s * 0.23);
  context.bezierCurveTo(s * 0.5, s * 0.24, s * 0.95, s * 0.18, s * 1.02, s * 0.02);
  context.closePath();
  context.fillStyle = belly;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(s * 1.1, -s * 0.02);
  context.quadraticCurveTo(s * 0.3, s * 0.06, -s * 0.9, s * 0.02);
  context.lineTo(-s * 0.9, -s * 0.4);
  context.lineTo(s * 1.1, -s * 0.4);
  context.fill();
  context.fillStyle = "rgba(140,200,250,.7)";
  context.beginPath();
  context.ellipse(-s * 0.05, -s * 0.02, s * 0.75, s * 0.04, 0.02, 0, Math.PI * 2);
  context.fill();
  context.restore();

  // The near wings spread down in front.
  paintFlyingFishWing(context, -s * 0.34, s * 0.08, s * 0.6, 1, flutter * 0.7, s);
  paintFlyingFishWing(context, s * 0.36, s * 0.06, s * 1.25, 1, flutter, s);

  paintEye(context, s * 0.68, -s * 0.05, Math.max(2.5, s * 0.15));
  context.strokeStyle = "rgba(20,55,70,.6)";
  context.lineWidth = Math.max(1, s * 0.03);
  context.lineCap = "round";
  context.beginPath();
  context.arc(s * 0.88, s * 0.02, s * 0.1, 0.4, 1.6);
  context.stroke();
}

// A flying fish's wing: a rounded fan of fin rays from (x, y) sweeping back, up (side -1) or down (side 1).
function paintFlyingFishWing(context, x, y, length, side, flutter, size) {
  const rays = 7, tips = [];
  for (let ray = 0; ray < rays; ray++) {
    const t = ray / (rays - 1);
    const angle = Math.PI - side * (1.05 + flutter - t * 0.72);
    const reach = length * (0.96 - 0.4 * t * t + (ray === 1 ? 0.04 : 0));
    tips.push([x + Math.cos(angle) * reach, y + Math.sin(angle) * reach]);
  }
  context.fillStyle = "rgba(165,222,255,.66)";
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(...tips[0]);
  for (let ray = 1; ray < rays; ray++) {
    const [fromX, fromY] = tips[ray - 1], [toX, toY] = tips[ray];
    const midX = (fromX + toX) / 2, midY = (fromY + toY) / 2;
    context.quadraticCurveTo(midX + (midX - x) * 0.05, midY + (midY - y) * 0.05, toX, toY);
  }
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(50,120,200,.5)";
  context.lineWidth = Math.max(1, size * 0.03);
  context.beginPath();
  for (let ray = 1; ray < rays; ray++) {
    context.moveTo(x, y);
    context.lineTo(...tips[ray]);
  }
  context.stroke();
  context.strokeStyle = "#2f78c8";
  context.lineWidth = Math.max(1.2, size * 0.07);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(...tips[0]);
  context.stroke();
}

// Portuguese man o' war: a see-through blue gas float with a pink sail on top and long stinging
// tentacles hanging below. It is not a jellyfish but a whole team of tiny animals living together.
function paintManOfWar(context, size, time) {
  const s = size;
  context.save();
  context.rotate(Math.sin(time * 1.3) * 0.05);
  context.lineCap = "round";
  context.lineJoin = "round";

  // Long tentacles streaming back as it drifts; some beaded with stinging cells, some coiled up.
  const strands = [[-0.3, 1.3, 0], [-0.14, 1.75, 1], [0.02, 1.45, 2], [0.18, 1.95, 1], [0.32, 1.5, 0],
    [0.46, 1.8, 2], [0.6, 1.35, 1]];
  const beads = [];
  for (const [color, pick] of [["rgba(112,150,255,.85)", 0], ["rgba(170,124,238,.85)", 1]]) {
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, s * 0.045);
    context.beginPath();
    strands.forEach(([rootX, length, style], index) => {
      if (index % 2 !== pick) return;
      const steps = style === 2 ? 40 : 12;
      for (let step = 0; step <= steps; step++) {
        const d = step / steps;
        let px = s * rootX - d * d * s * 0.45 + Math.sin(time * 1.7 + index * 1.1 - d * 3) * s * 0.1 * d;
        let py = -s * 0.08 + d * length * s;
        if (style === 2 && d > 0.4) {
          // Coiled up: little loops, growing in from nothing so the strand stays joined.
          const turn = (d - 0.4) * 26 + time * 2;
          const loop = s * 0.075 * Math.min(1, (d - 0.4) * 8);
          px += Math.cos(turn) * loop;
          py += Math.sin(turn) * loop;
        }
        if (step === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
        if (style === 1 && step % 3 === 0 && step > 0) beads.push(px, py);
      }
    });
    context.stroke();
  }
  context.fillStyle = "rgba(214,228,255,.95)";
  context.beginPath();
  const bead = Math.max(1, s * 0.05);
  for (let index = 0; index < beads.length; index += 2) {
    context.moveTo(beads[index] + bead, beads[index + 1]);
    context.arc(beads[index], beads[index + 1], bead, 0, Math.PI * 2);
  }
  context.fill();

  // The sail: a ruffled pink crest standing along the top of the float, a ripple running along it.
  const crest = [];
  for (let point = 0; point <= 18; point++) {
    const t = point / 18;
    const height = 0.06 + 0.36 * Math.pow(Math.sin(Math.PI * t), 0.7);
    const ripple = Math.sin(t * Math.PI * 6 - time * 2.4) * 0.07 * (height / 0.42);
    crest.push([s * (-0.74 + t * 1.36), -s * (0.64 + height + ripple)]);
  }
  context.fillStyle = "rgba(236,128,212,.9)";
  context.beginPath();
  context.moveTo(s * 0.62, -s * 0.56);
  context.lineTo(-s * 0.74, -s * 0.56);
  for (const [x, y] of crest) context.lineTo(x, y);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(160,60,160,.4)";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  for (let point = 3; point < crest.length - 1; point += 3) {
    context.moveTo(crest[point][0] + s * 0.05, -s * 0.6);
    context.lineTo(crest[point][0], crest[point][1] + s * 0.03);
  }
  context.stroke();
  context.strokeStyle = "#d955b6";
  context.lineWidth = Math.max(1.2, s * 0.05);
  context.beginPath();
  crest.forEach(([x, y], point) => point ? context.lineTo(x, y) : context.moveTo(x, y));
  context.stroke();

  // The float: a lopsided see-through balloon full of gas, fat at the front and pointed at the back.
  context.beginPath();
  context.moveTo(-s * 1.02, -s * 0.5);
  context.bezierCurveTo(-s * 0.8, -s * 0.72, s * 0.45, -s * 0.86, s * 0.82, -s * 0.62);
  context.bezierCurveTo(s * 1.08, -s * 0.45, s * 1.02, -s * 0.06, s * 0.62, -s * 0.04);
  context.bezierCurveTo(s * 0.1, -s * 0.02, -s * 0.5, -s * 0.1, -s * 0.82, -s * 0.3);
  context.quadraticCurveTo(-s * 0.98, -s * 0.38, -s * 1.02, -s * 0.5);
  context.fillStyle = "rgba(118,160,255,.84)";
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = "rgba(204,180,255,.6)";
  context.beginPath();
  context.ellipse(0, -s * 0.86, s * 1.1, s * 0.3, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(70,110,230,.45)";
  context.beginPath();
  context.ellipse(s * 0.05, -s * 0.02, s * 1.0, s * 0.16, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.fillStyle = "rgba(255,255,255,.6)";
  context.beginPath();
  context.ellipse(-s * 0.28, -s * 0.56, s * 0.34, s * 0.06, -0.1, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(s * 0.84, -s * 0.5, s * 0.05, 0, Math.PI * 2);
  context.fill();

  // A tiny friendly face on the front of the float.
  const eye = Math.max(1.6, s * 0.08);
  context.fillStyle = "#173b52";
  for (const x of [0.46, 0.72]) {
    context.beginPath();
    context.arc(s * x, -s * 0.36, eye, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#ffffff";
  for (const x of [0.46, 0.72]) {
    context.beginPath();
    context.arc(s * x + eye * 0.35, -s * 0.36 - eye * 0.35, eye * 0.35, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = "#2c3f8a";
  context.lineWidth = Math.max(1, s * 0.05);
  context.beginPath();
  context.arc(s * 0.59, -s * 0.32, s * 0.1, 0.5, Math.PI - 0.5);
  context.stroke();
  context.restore();
}

// Peacock mantis shrimp: green segmented body, googly eyes on stalks and a spotted club arm that punches in a flash.
function paintMantisShrimp(context, size, time) {
  const s = size;
  const green = "#2fae55", light = "#6fdc8a", dark = "#145f33", orange = "#ff8a3a";
  context.lineCap = "round";
  context.lineJoin = "round";

  // Punch: every 2.2 seconds the club flies out faster than a blink, holds, then folds back.
  const period = 2.2;
  const phase = ((time % period) + period) % period;
  const punch = phase < 0.05 ? phase / 0.05 : phase < 0.22 ? 1 : phase < 0.45 ? 1 - (phase - 0.22) / 0.23 : 0;

  // Feelers and the two orange paddles (antennal scales) behind the head.
  context.strokeStyle = orange;
  context.lineWidth = Math.max(1, s * 0.05);
  context.beginPath();
  for (const [reach, lift, shift] of [[1.3, 1.45, 0], [1.05, 1.8, 1.3]]) {
    const wave = Math.sin(time * 2 + shift) * s * 0.08;
    context.moveTo(s * 0.7, -s * 0.95);
    context.quadraticCurveTo(s * (reach - 0.05), -s * 1.0 + wave, s * reach, -s * lift + wave);
  }
  context.stroke();
  context.fillStyle = "#ff7a50";
  context.strokeStyle = "#a8341c";
  context.lineWidth = Math.max(0.8, s * 0.03);
  for (const [x, y, tilt] of [[0.8, -1.08, -0.75], [0.86, -0.98, -0.35]]) {
    context.beginPath();
    context.ellipse(s * x, s * y, s * 0.15, s * 0.065, tilt + Math.sin(time * 2.5 + x * 9) * 0.1, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  // Walking legs under the body.
  context.strokeStyle = "#f2623a";
  context.lineWidth = Math.max(1.2, s * 0.08);
  context.beginPath();
  for (let pair = 0; pair < 4; pair++) {
    const hip = s * (0.28 - pair * 0.26);
    const step = Math.sin(time * 4 + pair * 1.6) * s * 0.04;
    context.moveTo(hip, -s * 0.4);
    context.lineTo(hip + s * 0.09 + step, -s * 0.2);
    context.lineTo(hip + step * 0.6, 0);
  }
  context.stroke();

  // Tail fan: blue paddles with orange tips, spread behind the last segment.
  context.save();
  context.translate(-s * 0.98, -s * 0.42);
  context.strokeStyle = dark;
  context.lineWidth = Math.max(1, s * 0.035);
  for (const angle of [0.85, 0.25, -0.35]) {
    context.fillStyle = "#3d8fe8";
    context.beginPath();
    context.ellipse(-s * 0.2 * Math.cos(angle), s * 0.2 * Math.sin(angle), s * 0.24, s * 0.1, -angle, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#ff6a3a";
    context.beginPath();
    context.arc(-s * 0.36 * Math.cos(angle), s * 0.36 * Math.sin(angle), Math.max(0.8, s * 0.055), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  // The long body in bands, thick at the front and tapering to the tail.
  context.fillStyle = green;
  context.strokeStyle = dark;
  context.lineWidth = Math.max(1, s * 0.04);
  context.beginPath();
  context.moveTo(s * 0.2, -s * 0.86);
  context.quadraticCurveTo(-s * 0.45, -s * 0.98, -s * 1.02, -s * 0.6);
  context.quadraticCurveTo(-s * 1.12, -s * 0.42, -s * 1.0, -s * 0.3);
  context.quadraticCurveTo(-s * 0.4, -s * 0.24, s * 0.2, -s * 0.36);
  context.closePath();
  context.fill();
  context.stroke();
  context.save();
  context.clip();
  context.fillStyle = light;
  context.beginPath();
  for (let band = 0; band < 6; band++) {
    const x = s * (0.02 - band * 0.19);
    context.moveTo(x + s * 0.08, -s * 0.8);
    context.ellipse(x, -s * 0.8, s * 0.08, s * 0.07, 0, 0, Math.PI * 2);
  }
  context.fill();
  context.strokeStyle = "rgba(20,95,51,.75)";
  context.beginPath();
  for (let band = 0; band < 6; band++) {
    const x = s * (0.12 - band * 0.19);
    context.moveTo(x, -s);
    context.quadraticCurveTo(x - s * 0.08, -s * 0.6, x, -s * 0.2);
  }
  context.stroke();
  context.restore();

  // Head shell, raised at the front, with a turquoise nose plate.
  context.fillStyle = green;
  context.beginPath();
  context.ellipse(s * 0.34, -s * 0.68, s * 0.3, s * 0.25, -0.35, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = light;
  context.beginPath();
  context.ellipse(s * 0.28, -s * 0.8, s * 0.14, s * 0.06, -0.35, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#0f4a28";
  context.beginPath();
  for (const [x, y] of [[0.2, -0.62], [0.34, -0.56], [0.46, -0.66], [0.3, -0.7], [0.5, -0.8]]) {
    context.moveTo(s * x + Math.max(0.6, s * 0.03), s * y);
    context.arc(s * x, s * y, Math.max(0.6, s * 0.03), 0, Math.PI * 2);
  }
  context.fill();
  context.fillStyle = "#2fb8c9";
  context.beginPath();
  context.ellipse(s * 0.6, -s * 0.86, s * 0.1, s * 0.08, -0.4, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Eye stalks, and big googly eyes that each look their own way.
  context.strokeStyle = orange;
  context.lineWidth = Math.max(1, s * 0.07);
  const eyes = [[0.52, -1.36, 0.9], [0.72, -1.3, 2.1]];
  context.beginPath();
  for (const [x, y] of eyes) {
    context.moveTo(s * 0.6, -s * 0.9);
    context.lineTo(s * x, s * y);
  }
  context.stroke();
  for (const [x, y, look] of eyes) paintMantisShrimpEye(context, s * x, s * y, Math.max(2, s * 0.19), time * 1.3 + look);

  paintMantisShrimpClub(context, s, punch);
}

// A mantis shrimp eye: a turquoise ring (it sees colors we can't) around a googly eye.
function paintMantisShrimpEye(context, x, y, radius, look) {
  context.fillStyle = "#29c7b5";
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f7ffef";
  context.beginPath();
  context.arc(x, y, radius * 0.76, 0, Math.PI * 2);
  context.fill();
  const angle = Math.sin(look) * 1.4;
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(x + Math.cos(angle) * radius * 0.3, y + Math.sin(angle) * radius * 0.3, radius * 0.42, 0, Math.PI * 2);
  context.fill();
}

// The club arm, folded up in front of the face like a praying mantis; punch 0..1 swings the club out.
function paintMantisShrimpClub(context, s, punch) {
  const shoulder = [s * 0.5, -s * 0.5];
  const elbow = [s * (0.82 + punch * 0.04), -s * (0.32 + punch * 0.04)];
  const angle = -1.9 + punch * 1.8;
  const club = [elbow[0] + Math.cos(angle) * s * 0.3, elbow[1] + Math.sin(angle) * s * 0.3];
  context.strokeStyle = "#e8483a";
  context.lineWidth = Math.max(1.6, s * 0.13);
  context.beginPath();
  context.moveTo(...shoulder);
  context.lineTo(...elbow);
  context.lineTo(...club);
  context.stroke();
  context.save();
  context.translate(...club);
  context.rotate(angle);
  context.fillStyle = "#ff5a45";
  context.strokeStyle = "#8a1f18";
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  context.ellipse(s * 0.03, 0, s * 0.16, s * 0.12, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#ffe8b0";
  context.beginPath();
  for (const [dx, dy] of [[-0.05, -0.04], [0.05, 0.04], [0.08, -0.05], [-0.04, 0.05]]) {
    context.moveTo(s * (dx + 0.03), s * dy);
    context.arc(s * dx, s * dy, Math.max(0.6, s * 0.03), 0, Math.PI * 2);
  }
  context.fill();
  context.restore();
  if (punch > 0.6) {
    // POW: a flash of lines and a little popping bubble in front of the club.
    context.strokeStyle = "#fff27a";
    context.lineWidth = Math.max(1, s * 0.06);
    context.beginPath();
    for (let ray = 0; ray < 5; ray++) {
      const spoke = -1.2 + ray * 0.6;
      context.moveTo(club[0] + Math.cos(spoke) * s * 0.19, club[1] + Math.sin(spoke) * s * 0.19);
      context.lineTo(club[0] + Math.cos(spoke) * s * 0.27, club[1] + Math.sin(spoke) * s * 0.27);
    }
    context.stroke();
  }
}

// Sea cucumber: a soft, lumpy red-orange sausage on the sand with frilly feeding tentacles and tiny tube feet.
function paintSeaCucumber(context, size, time) {
  const s = size;
  const breathe = Math.sin(time * 1.3);
  const half = s * (1.02 + breathe * 0.05);
  const tall = s * (0.6 - breathe * 0.035);
  const body = "#d9502c", edge = "#8e2a16";
  const r = tall * 0.5;
  // A slow squeeze runs from tail to head, like it is breathing.
  const height = x => tall * (1 + 0.07 * Math.sin(x / s * 2.6 - time * 2) * (1 - (x / half) ** 2));
  context.lineCap = "round";
  context.lineJoin = "round";

  // Tiny tube feet peeking out underneath.
  context.fillStyle = "#ffd6a8";
  context.beginPath();
  for (let foot = 0; foot < 9; foot++) {
    const x = -half * 0.75 + foot * half * 0.19, y = Math.sin(time * 3 + foot) * s * 0.012;
    context.moveTo(x + s * 0.05, y);
    context.arc(x, y, Math.max(1, s * 0.05), 0, Math.PI * 2);
  }
  context.fill();

  // Soft round bumps along the back, drawn first so the body's top edge tucks them in.
  const knobs = [-0.72, -0.46, -0.2, 0.06, 0.32, 0.56];
  context.fillStyle = body;
  context.strokeStyle = edge;
  context.lineWidth = Math.max(1, s * 0.045);
  for (const u of knobs) {
    const x = half * u, y = -height(x) + s * 0.02;
    context.beginPath();
    context.arc(x, y, s * 0.11, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  // The body: a squishy capsule, round at both ends.
  context.fillStyle = body;
  context.beginPath();
  context.moveTo(-half + r, 0);
  context.arc(-half + r, -r, r, Math.PI / 2, Math.PI * 1.5);
  for (let step = 0; step <= 16; step++) {
    const x = -half + r + (half * 2 - r * 2) * step / 16;
    context.lineTo(x, -height(x));
  }
  context.arc(half - r, -r, r, -Math.PI / 2, Math.PI / 2);
  context.closePath();
  context.fill();
  context.stroke();

  // Yellow tips on the bumps, freckles on the sides and a paler belly.
  context.fillStyle = "rgba(255,170,120,.55)";
  context.beginPath();
  context.ellipse(0, -tall * 0.16, half * 0.8, tall * 0.12, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffc247";
  context.beginPath();
  for (const u of knobs) {
    const x = half * u, y = -height(x) - s * 0.03;
    context.moveTo(x + s * 0.06, y);
    context.arc(x, y, Math.max(1.2, s * 0.06), 0, Math.PI * 2);
  }
  for (const [u, v] of [[-0.62, 0.55], [-0.34, 0.42], [-0.06, 0.6], [0.2, 0.44], [-0.84, 0.4]]) {
    context.moveTo(half * u + s * 0.05, -tall * v);
    context.arc(half * u, -tall * v, Math.max(1, s * 0.05), 0, Math.PI * 2);
  }
  context.fill();

  // Feeding tentacles: a ring of little frilly bushes at the front that open and close.
  const mouthX = half - r * 0.2, mouthY = -r * 1.05;
  for (let arm = 0; arm < 7; arm++) {
    const angle = -1.35 + arm * 0.38 + Math.sin(time * 1.6 + arm) * 0.08;
    const reach = s * (0.26 + 0.05 * Math.sin(time * 1.8 + arm * 0.9));
    const tipX = mouthX + Math.cos(angle) * reach, tipY = mouthY + Math.sin(angle) * reach;
    context.strokeStyle = "#ffd98f";
    context.lineWidth = Math.max(1, s * 0.055);
    context.beginPath();
    context.moveTo(mouthX, mouthY);
    context.lineTo(tipX, tipY);
    context.stroke();
    context.fillStyle = "#fff1c9";
    context.beginPath();
    for (const spread of [-0.7, 0, 0.7]) {
      const x = tipX + Math.cos(angle + spread) * s * 0.055, y = tipY + Math.sin(angle + spread) * s * 0.055;
      context.moveTo(x + s * 0.045, y);
      context.arc(x, y, Math.max(0.9, s * 0.045), 0, Math.PI * 2);
    }
    context.fill();
  }

  // A small friendly face near the front.
  paintEye(context, half * 0.58, -tall * 0.6, Math.max(1.8, s * 0.11));
  context.strokeStyle = "#6a1e10";
  context.lineWidth = Math.max(1, s * 0.045);
  context.beginPath();
  context.arc(half * 0.7, -tall * 0.4, s * 0.1, 0.3, Math.PI - 0.6);
  context.stroke();
}

// Moray eel: a green eel peeking out of a rock hole, opening and closing its mouth to breathe (it isn't grumpy!).
function paintMoray(context, size, time) {
  const s = size;
  const green = "#4cbf40", fin = "#2e9a36", hole = [s * 0.2, -s * 0.44];
  context.lineCap = "round";
  context.lineJoin = "round";
  paintMorayRock(context, s, hole);

  // The body follows an S-curve out of the hole and up, swaying gently.
  const sway = Math.sin(time * 1.1);
  const p0 = hole, p1 = [s * 1.02, -s * 0.36 + sway * s * 0.03];
  const p2 = [s * (0.18 + sway * 0.06), -s * 1.2], p3 = [s * (0.56 + sway * 0.08), -s * 1.48];
  const point = t => {
    const u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  };
  const width = s * 0.13, steps = 18;
  const back = [], belly = [], ridge = [], pale = [];
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const [x, y] = point(t);
    const [ax, ay] = point(Math.max(0, t - 0.02)), [bx, by] = point(Math.min(1, t + 0.02));
    const length = Math.hypot(bx - ax, by - ay) || 1;
    const nx = (by - ay) / length, ny = -(bx - ax) / length;
    back.push([x + nx * width, y + ny * width]);
    belly.push([x - nx * width, y - ny * width]);
    pale.push([x - nx * width * 0.3, y - ny * width * 0.3]);
    const lift = width + s * (0.09 + 0.03 * Math.sin(t * 26 - time * 3)) * Math.min(1, t * 5);
    ridge.push([x + nx * lift, y + ny * lift]);
  }
  const band = (from, to) => {
    context.beginPath();
    from.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
    for (let step = steps; step >= 0; step--) context.lineTo(...to[step]);
    context.fill();
  };
  context.fillStyle = fin;
  band(back, ridge);
  context.fillStyle = green;
  band(back, belly);
  context.fillStyle = "#8fdc5c";
  band(pale, belly);

  // The rock's lip in front of the hole, so the eel really comes out of it.
  context.strokeStyle = "#6b645c";
  context.lineWidth = Math.max(2, s * 0.09);
  context.beginPath();
  context.ellipse(hole[0], hole[1], s * 0.24, s * 0.28, 0, 0.5, Math.PI - 0.3);
  context.stroke();

  const [nx, ny] = point(1), [px, py] = point(0.94);
  paintMorayHead(context, s, nx, ny, Math.atan2(ny - py, nx - px) * 0.4 + sway * 0.05, width, time, green, fin);
}

// The rock with a dark hole on its right side.
function paintMorayRock(context, s, hole) {
  context.fillStyle = "#7d766d";
  context.beginPath();
  context.moveTo(-s * 1.32, 0);
  context.quadraticCurveTo(-s * 1.3, -s * 0.7, -s * 0.85, -s * 0.88);
  context.quadraticCurveTo(-s * 0.45, -s * 1.1, -s * 0.02, -s * 0.92);
  context.quadraticCurveTo(s * 0.42, -s * 0.8, s * 0.5, -s * 0.4);
  context.quadraticCurveTo(s * 0.56, -s * 0.15, s * 0.6, 0);
  context.closePath();
  context.fill();
  context.fillStyle = "#968f84";
  context.beginPath();
  context.ellipse(-s * 0.58, -s * 0.78, s * 0.42, s * 0.13, -0.12, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#645e56";
  context.beginPath();
  context.ellipse(-s * 0.38, -s * 0.1, s * 0.88, s * 0.1, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#e98aa6";
  context.beginPath();
  context.arc(-s * 0.98, -s * 0.78, s * 0.07, 0, Math.PI * 2);
  context.arc(-s * 0.88, -s * 0.84, s * 0.06, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f2c14e";
  context.beginPath();
  context.arc(-s * 0.25, -s * 0.98, s * 0.05, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#2a2430";
  context.beginPath();
  context.ellipse(hole[0], hole[1], s * 0.24, s * 0.28, 0, 0, Math.PI * 2);
  context.fill();
}

// The moray's head at the neck (x, y), turned by angle: a long snout, a round eye, and a lower jaw that
// opens and closes to pump water over its gills.
function paintMorayHead(context, s, x, y, angle, width, time, green, fin) {
  const open = 0.03 + 0.4 * (0.5 + 0.5 * Math.sin(time * 1.5));
  const L = s * 0.6, hinge = [L * 0.3, s * 0.05], tipX = L;
  context.save();
  context.translate(x, y);
  context.rotate(angle);

  // Inside of the mouth and two little teeth show only in the gap between the jaws.
  const lowTip = [hinge[0] + (tipX - hinge[0]) * Math.cos(open), hinge[1] + (tipX - hinge[0]) * Math.sin(open)];
  context.fillStyle = "#c2506a";
  context.beginPath();
  context.moveTo(...hinge);
  context.lineTo(tipX, s * 0.04);
  context.lineTo(...lowTip);
  context.closePath();
  context.fill();
  context.fillStyle = "#ffffff";
  context.beginPath();
  for (const tooth of [0.62, 0.84]) {
    context.moveTo(L * tooth - s * 0.025, s * 0.04);
    context.lineTo(L * tooth + s * 0.025, s * 0.04);
    context.lineTo(L * tooth, s * 0.085);
  }
  context.fill();

  // Lower jaw, turned open around the hinge.
  context.save();
  context.translate(...hinge);
  context.rotate(open);
  context.fillStyle = "#8fdc5c";
  context.beginPath();
  context.moveTo(-s * 0.02, 0);
  context.lineTo(tipX - hinge[0] - s * 0.03, 0);
  context.quadraticCurveTo(tipX - hinge[0] + s * 0.03, s * 0.02, tipX - hinge[0] - s * 0.04, s * 0.07);
  context.quadraticCurveTo(L * 0.25, s * 0.12, -L * 0.3, width - hinge[1]);
  context.closePath();
  context.fill();
  context.restore();

  // Upper head: a round forehead with the fin running up over it, sloping down to the snout.
  context.fillStyle = fin;
  context.beginPath();
  context.moveTo(-L * 0.45, -width - s * 0.1);
  context.quadraticCurveTo(-L * 0.1, -width - s * 0.14, L * 0.2, -width - s * 0.05);
  context.lineTo(-L * 0.45, -width + s * 0.04);
  context.fill();
  context.fillStyle = green;
  context.beginPath();
  context.moveTo(-L * 0.45, -width);
  context.bezierCurveTo(-L * 0.05, -width - s * 0.1, L * 0.55, -width - s * 0.06, L * 0.9, -s * 0.06);
  context.quadraticCurveTo(L * 1.04, -s * 0.02, tipX, s * 0.04);
  context.lineTo(...hinge);
  context.quadraticCurveTo(L * 0.05, width * 0.9, -L * 0.45, width);
  context.closePath();
  context.fill();

  // Nostril tube, a big friendly eye and a smile at the corner of the mouth.
  context.strokeStyle = green;
  context.lineWidth = Math.max(1, s * 0.04);
  context.beginPath();
  context.moveTo(L * 0.9, -s * 0.05);
  context.lineTo(L * 0.97, -s * 0.11);
  context.stroke();
  paintEye(context, L * 0.52, -width * 0.62, Math.max(2.2, s * 0.115));
  context.strokeStyle = "#1f5e25";
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  context.moveTo(hinge[0] + s * 0.03, hinge[1]);
  context.quadraticCurveTo(hinge[0] - s * 0.05, hinge[1] - s * 0.005, hinge[0] - s * 0.07, hinge[1] - s * 0.06);
  context.stroke();
  context.restore();
}

// Horseshoe crab: a domed horseshoe shell, a spiny back shell and a spike tail. Older than dinosaurs, not a crab.
function paintHorseshoeCrab(context, size, time) {
  const s = size;
  const rim = "#58491f", shell = "#8c7a40", shine = "#ae9b60", line = "#3b3118";
  const R = s * 0.7, squash = 0.56, cx = s * 0.26, cy = -s * 0.5, lift = s * 0.15;
  context.lineCap = "round";
  context.lineJoin = "round";

  // Little legs walking underneath.
  context.strokeStyle = "#3a2f17";
  context.lineWidth = Math.max(1, s * 0.06);
  context.beginPath();
  for (let leg = 0; leg < 5; leg++) {
    const hip = cx + s * (0.3 - leg * 0.2);
    const step = Math.sin(time * 3 + leg * 1.3) * s * 0.05;
    context.moveTo(hip, -s * 0.22);
    context.lineTo(hip + s * 0.07 + step, -s * 0.1);
    context.lineTo(hip + step, 0);
  }
  context.stroke();

  // Spike tail (telson), trailing back to the sand.
  context.save();
  context.translate(cx - R * 1.28, cy - lift * 0.3);
  context.rotate(0.34 + Math.sin(time * 0.9) * 0.05);
  context.fillStyle = rim;
  context.strokeStyle = line;
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  context.moveTo(s * 0.05, -s * 0.065);
  context.lineTo(-s * 0.78, 0);
  context.lineTo(s * 0.05, s * 0.065);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();

  // Everything else is drawn as if seen from above, then squashed so we look at it from the side and a
  // little above.
  context.save();
  context.translate(cx, cy);
  context.scale(1, squash);
  context.lineWidth = Math.max(1, s * 0.035) / squash;
  context.strokeStyle = line;

  // Back shell: a smaller plate hinged into the notch of the front shell, with spines along its edges.
  const raised = lift * 0.55 / squash;
  const edge = x => x > -R * 0.95 ? R * (0.55 + (x + R * 0.3) / (R * 0.65) * 0.15) : R * (0.4 + (x + R * 0.95) / (R * 0.35) * 0.28);
  context.fillStyle = shell;
  context.beginPath();
  for (const side of [-1, 1]) {
    for (let spine = 0; spine < 4; spine++) {
      const x = -R * (0.52 + spine * 0.17);
      const z = side < 0 ? -edge(x) - raised : edge(x);
      context.moveTo(x + R * 0.06, z - side * R * 0.04);
      context.lineTo(x - R * 0.06, z + side * R * 0.24);
      context.lineTo(x - R * 0.06, z - side * R * 0.04);
      context.closePath();
    }
  }
  context.fill();
  context.stroke();
  for (const [color, raise] of [[rim, 0], [shell, raised]]) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(-R * 0.3, -R * 0.55 - raise);
    context.lineTo(-R * 0.95, -R * 0.4 - raise);
    context.lineTo(-R * 1.3, -R * 0.12 - raise);
    context.lineTo(-R * 1.3, R * 0.12 - raise);
    context.lineTo(-R * 0.95, R * 0.4 - raise);
    context.lineTo(-R * 0.3, R * 0.55 - raise);
    context.closePath();
    context.fill();
    context.stroke();
  }
  context.beginPath();
  context.moveTo(-R * 0.5, -raised);
  context.lineTo(-R * 1.2, -raised);
  context.stroke();

  // Front shell: a dark rim, the domed top raised above it, and a shine on the top of the dome.
  for (const [color, scale, raise, dx] of [[rim, 1, 0, 0], [shell, 0.94, lift, 0], [shine, 0.56, lift * 1.7, R * 0.08]]) {
    context.fillStyle = color;
    context.beginPath();
    paintHorseshoeCrabShellPath(context, R * scale, dx, -raise / squash);
    context.fill();
    if (color !== shine) context.stroke();
  }
  // The ridges on top of the shell: one down the middle and one on each side, where the big eyes sit.
  context.strokeStyle = "rgba(59,49,24,.5)";
  context.beginPath();
  context.moveTo(R * 0.5, -lift * 1.6 / squash);
  context.lineTo(-R * 0.22, -lift * 1.6 / squash);
  for (const side of [-1, 1]) {
    context.moveTo(R * 0.4, side * R * 0.38 - lift * 1.35 / squash);
    context.quadraticCurveTo(R * 0.05, side * R * 0.58 - lift * 1.2 / squash, -R * 0.4, side * R * 0.66 - lift * 1.1 / squash);
  }
  context.stroke();
  context.restore();

  // Tiny eyes on top: two side eyes on the ridges and two little ones at the front.
  for (const side of [-1, 1]) {
    paintEye(context, cx - R * 0.02, cy + side * R * 0.56 * squash - lift * 1.25, Math.max(1.3, s * (side < 0 ? 0.055 : 0.065)));
  }
  context.fillStyle = "#173b52";
  context.beginPath();
  for (const side of [-1, 1]) {
    const x = cx + R * 0.6, y = cy - lift * 1.55 + side * R * 0.07 * squash, dot = Math.max(0.8, s * 0.028);
    context.moveTo(x + dot, y);
    context.arc(x, y, dot, 0, Math.PI * 2);
  }
  context.fill();
}

// The front shell seen from above: a round front, points at the back corners and a notch between them.
function paintHorseshoeCrabShellPath(context, R, dx, dy) {
  context.moveTo(dx - R * 0.72, dy - R * 0.9);
  context.quadraticCurveTo(dx - R * 0.4, dy - R * 1.02, dx, dy - R);
  context.ellipse(dx, dy, R * 0.98, R, 0, -Math.PI / 2, Math.PI / 2);
  context.quadraticCurveTo(dx - R * 0.4, dy + R * 1.02, dx - R * 0.72, dy + R * 0.9);
  context.quadraticCurveTo(dx - R * 0.45, dy + R * 0.6, dx - R * 0.3, dy + R * 0.5);
  context.quadraticCurveTo(dx - R * 0.15, dy, dx - R * 0.3, dy - R * 0.5);
  context.quadraticCurveTo(dx - R * 0.45, dy - R * 0.6, dx - R * 0.72, dy - R * 0.9);
  context.closePath();
}

// One colour per food-chain animal, for the HUD dot and the snack burst.
export const SWATCHES = {
  plankton: "#ffe39a", sardine: "#9cc7e4", mackerel: "#4fb3a4", squid: "#f29a8c", tuna: "#5d8fc8", shark: "#a9bccb",
  orca: "#1f262d",
  ...REEF_SWATCHES
};

export function swatch(kind) {
  return SWATCHES[kind] ?? "#ffffff";
}

// Each zone's drawings live in their own paint-*-animals.js and are registered here.
const PAINTERS = {
  ...REEF_PAINTERS,
  squid: paintSquid,
  turtle: paintTurtle,
  seahorse: paintSeahorse,
  octopus: paintOctopus,
  starfish: paintStarfish,
  crab: paintCrab,
  clownfish: paintAnemone,
  orca: paintOrca,
  dolphin: paintDolphin,
  jellyfish: paintJellyfish,
  pufferfish: paintPufferfish,
  bluewhale: paintBlueWhale,
  manta: paintManta,
  lobster: paintLobster,
  urchin: paintUrchin,
  hammerhead: paintHammerhead,
  whaleshark: paintWhaleShark,
  narwhal: paintNarwhal,
  anglerfish: paintAnglerfish,
  otter: paintOtter,
  penguin: paintPenguin,
  flyingfish: paintFlyingFish,
  manofwar: paintManOfWar,
  mantisshrimp: paintMantisShrimp,
  seacucumber: paintSeaCucumber,
  moray: paintMoray,
  horseshoecrab: paintHorseshoeCrab
};
