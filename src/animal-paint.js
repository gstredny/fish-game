// Cartoon drawings of the real animals in the game. Each is drawn facing right around (0, 0);
// the caller mirrors it for left. Floor animals stand on (0, 0), the sea bed.
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

// A shiny dark eye, the way seals and otters look: big and black with two glints of light.
function paintDarkEye(context, x, y, radius) {
  context.fillStyle = "#1b2530";
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(x + radius * 0.35, y - radius * 0.35, radius * 0.36, 0, Math.PI * 2);
  context.arc(x - radius * 0.3, y + radius * 0.35, radius * 0.16, 0, Math.PI * 2);
  context.fill();
}

// Penguin, flying underwater: a torpedo with a black back and a white front, stiff flipper wings
// beating fast, an orange beak, and orange feet trailing behind.
function paintPenguin(context, size, time) {
  const black = "#20272f", white = "#f4f7f8", orange = "#f39436";
  const flap = Math.sin(time * 5);
  // Webbed feet trailing under the tail, kicking a little.
  context.fillStyle = orange;
  for (const [y, phase] of [[0.04, 0], [0.16, 2]]) {
    context.save();
    context.translate(-size * 0.82, size * y);
    context.rotate(0.25 + Math.sin(time * 5 + phase) * 0.2);
    context.beginPath();
    context.moveTo(0, -size * 0.05);
    context.lineTo(-size * 0.34, -size * 0.12);
    for (let toe = 0; toe < 3; toe++) {
      context.quadraticCurveTo(-size * 0.42, -size * (0.08 - toe * 0.08), -size * 0.34, -size * (0.04 - toe * 0.08));
    }
    context.lineTo(0, size * 0.05);
    context.fill();
    context.restore();
  }

  context.fillStyle = black;
  context.beginPath();
  context.moveTo(-size * 1.0, -size * 0.08);
  context.lineTo(-size * 1.3, -size * 0.02 + Math.sin(time * 5) * size * 0.03);
  context.lineTo(-size * 1.0, size * 0.06);
  context.fill();

  context.beginPath();
  context.moveTo(size * 0.95, -size * 0.04);
  context.bezierCurveTo(size * 0.92, -size * 0.4, size * 0.45, -size * 0.5, 0, -size * 0.46);
  context.bezierCurveTo(-size * 0.5, -size * 0.42, -size * 0.88, -size * 0.2, -size * 1.14, -size * 0.02);
  context.lineTo(-size * 1.14, size * 0.04);
  context.bezierCurveTo(-size * 0.88, size * 0.28, -size * 0.45, size * 0.48, 0, size * 0.46);
  context.bezierCurveTo(size * 0.45, size * 0.44, size * 0.88, size * 0.32, size * 0.95, size * 0.04);
  context.closePath();
  context.fillStyle = white;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = black;
  context.beginPath();
  context.moveTo(size * 1.2, size * 0.08);
  context.quadraticCurveTo(size * 0.7, size * 0.2, size * 0.38, size * 0.06);
  context.quadraticCurveTo(-size * 0.3, -size * 0.05, -size * 1.2, size * 0.06);
  context.lineTo(-size * 1.2, -size * 0.6);
  context.lineTo(size * 1.2, -size * 0.6);
  context.fill();
  context.restore();

  context.fillStyle = orange;
  context.beginPath();
  context.moveTo(size * 0.88, -size * 0.12);
  context.quadraticCurveTo(size * 1.12, -size * 0.1, size * 1.3, size * 0.01);
  context.quadraticCurveTo(size * 1.12, size * 0.07, size * 0.88, size * 0.08);
  context.fill();
  paintFlipper(context, size * 0.28, size * 0.06, size * 0.66, size * 0.13, 1.3 + flap * 0.55, "#46525f", true);
  paintEye(context, size * 0.62, -size * 0.17, Math.max(2.2, size * 0.12));
}

// Sea otter, floating on its back the way otters nap and eat: brown fur, a pale round face turned
// to us with whiskers, little paws held on its tummy, back feet and a flat tail paddling slowly.
function paintOtter(context, size, time) {
  const fur = "#8b5a35", dark = "#5a3721", chest = "#b4814f", face = "#ecd7b5";
  const paddle = Math.sin(time * 2.2);
  context.save();
  context.rotate(Math.sin(time * 1.1) * 0.04);
  context.lineCap = "round";

  context.fillStyle = fur;
  context.beginPath();
  context.moveTo(-size * 0.55, -size * 0.12);
  context.quadraticCurveTo(-size * 1.05, -size * 0.14 + paddle * size * 0.03, -size * 1.42, -size * 0.04 + paddle * size * 0.07);
  context.quadraticCurveTo(-size * 1.08, size * 0.14, -size * 0.55, size * 0.16);
  context.fill();
  for (const [x, phase] of [[-0.66, 0], [-0.48, 1.8]]) {
    paintFlipper(context, size * x, -size * 0.12, size * 0.38, size * 0.12,
      Math.PI - 0.6 + Math.sin(time * 2.2 + phase) * 0.3, dark);
  }

  context.fillStyle = fur;
  context.beginPath();
  context.ellipse(-size * 0.05, size * 0.02, size * 0.78, size * 0.32, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = chest;
  context.beginPath();
  context.ellipse(size * 0.12, -size * 0.13, size * 0.56, size * 0.15, 0, 0, Math.PI * 2);
  context.fill();

  // Round head with little ears, and a pale face looking at us.
  const headX = size * 0.82, headY = -size * 0.24;
  context.fillStyle = dark;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.arc(headX + side * size * 0.29, headY - size * 0.27, size * 0.09, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = fur;
  context.beginPath();
  context.arc(headX, headY, size * 0.4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = face;
  context.beginPath();
  context.ellipse(headX, headY + size * 0.08, size * 0.33, size * 0.26, 0, 0, Math.PI * 2);
  context.fill();
  for (const side of [-1, 1]) paintDarkEye(context, headX + side * size * 0.15, headY - size * 0.06, Math.max(1.8, size * 0.075));
  context.strokeStyle = "rgba(90,60,40,.75)";
  context.lineWidth = Math.max(0.8, size * 0.018);
  context.beginPath();
  for (const side of [-1, 1]) {
    for (const lift of [-0.05, 0.03]) {
      context.moveTo(headX + side * size * 0.12, headY + size * 0.14);
      context.lineTo(headX + side * size * 0.5, headY + size * (0.12 + lift));
    }
  }
  context.stroke();
  context.fillStyle = "#2a1c14";
  context.beginPath();
  context.ellipse(headX, headY + size * 0.07, size * 0.075, size * 0.05, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = dark;
  context.lineWidth = Math.max(1, size * 0.028);
  context.beginPath();
  context.arc(headX - size * 0.05, headY + size * 0.14, size * 0.05, 0.2, Math.PI - 0.2);
  context.moveTo(headX + size * 0.1, headY + size * 0.14);
  context.arc(headX + size * 0.05, headY + size * 0.14, size * 0.05, 0.2, Math.PI - 0.2);
  context.stroke();

  // Paws on the tummy, holding a little shell.
  const hold = Math.sin(time * 1.6) * size * 0.02;
  context.fillStyle = "#f2b3a8";
  context.beginPath();
  context.ellipse(size * 0.21, -size * 0.4 + hold, size * 0.11, size * 0.075, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = dark;
  for (const x of [0.1, 0.32]) {
    context.beginPath();
    context.ellipse(size * x, -size * 0.34 + hold, size * 0.075, size * 0.1, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

// Harbour seal: a round grey head with big dark eyes and whiskers, a spotty coat, front flippers,
// and two back flippers held together that sweep like a tail.
function paintSeal(context, size, time) {
  const coat = "#8e9ba6", belly = "#d8e0e5", spot = "#5d6a76", flipper = "#6c7985";
  const sweep = Math.sin(time * 3);
  const tailY = sweep * size * 0.05;

  context.save();
  context.translate(-size * 0.9, tailY);
  context.rotate(Math.sin(time * 3 - 0.8) * 0.25);
  for (const [angle, color] of [[-0.3, spot], [0.28, flipper]]) {
    context.save();
    context.rotate(angle);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(size * 0.05, -size * 0.06);
    context.quadraticCurveTo(-size * 0.2, -size * 0.1, -size * 0.42, -size * 0.14);
    context.quadraticCurveTo(-size * 0.36, 0, -size * 0.44, size * 0.12);
    context.quadraticCurveTo(-size * 0.2, size * 0.08, size * 0.05, size * 0.06);
    context.fill();
    context.restore();
  }
  context.restore();

  context.beginPath();
  context.moveTo(size * 0.98, size * 0.04);
  context.bezierCurveTo(size * 1.0, -size * 0.14, size * 0.82, -size * 0.34, size * 0.56, -size * 0.35);
  context.bezierCurveTo(size * 0.1, -size * 0.38, -size * 0.5, -size * 0.28, -size * 0.94, tailY - size * 0.06);
  context.lineTo(-size * 0.94, tailY + size * 0.06);
  context.bezierCurveTo(-size * 0.5, size * 0.3, size * 0.1, size * 0.38, size * 0.5, size * 0.28);
  context.bezierCurveTo(size * 0.76, size * 0.22, size * 0.94, size * 0.2, size * 0.98, size * 0.04);
  context.closePath();
  context.fillStyle = coat;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = belly;
  context.beginPath();
  context.moveTo(size * 1.1, size * 0.08);
  context.quadraticCurveTo(size * 0.4, size * 0.2, -size * 0.3, size * 0.14);
  context.quadraticCurveTo(-size * 0.7, size * 0.1, -size, tailY + size * 0.03);
  context.lineTo(-size, size * 0.5);
  context.lineTo(size * 1.1, size * 0.5);
  context.fill();
  context.fillStyle = spot;
  context.beginPath();
  for (const [x, y, r] of [[0.3, -0.24, 0.035], [0.12, -0.3, 0.028], [0.02, -0.16, 0.04], [-0.18, -0.26, 0.032],
    [-0.3, -0.1, 0.026], [-0.46, -0.2, 0.034], [-0.62, -0.1, 0.024], [0.2, -0.08, 0.022], [-0.1, -0.02, 0.022],
    [0.42, -0.1, 0.02], [-0.78, -0.06, 0.02]]) {
    context.moveTo(size * (x + r), size * y);
    context.arc(size * x, size * y, size * r, 0, Math.PI * 2);
  }
  context.fill();
  context.restore();
  paintFlipper(context, size * 0.34, size * 0.18, size * 0.36, size * 0.1, 0.8 + sweep * 0.2, flipper);

  // Face: a puffy muzzle with a dark nose and whiskers, big dark eyes, a little smile.
  context.fillStyle = "#b3bec6";
  context.beginPath();
  context.ellipse(size * 0.86, size * 0.04, size * 0.13, size * 0.1, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#2a3139";
  context.beginPath();
  context.ellipse(size * 0.95, -size * 0.04, size * 0.05, size * 0.04, 0.4, 0, Math.PI * 2);
  context.fill();
  paintDarkEye(context, size * 0.6, -size * 0.13, Math.max(2.5, size * 0.1));
  context.strokeStyle = "rgba(245,250,252,.85)";
  context.lineWidth = Math.max(0.8, size * 0.015);
  context.lineCap = "round";
  context.beginPath();
  for (const [x, y] of [[1.2, -0.02], [1.22, 0.06], [1.16, 0.14]]) {
    context.moveTo(size * 0.9, size * 0.04);
    context.lineTo(size * x, size * y);
  }
  context.stroke();
  context.strokeStyle = "#3d4852";
  context.lineWidth = Math.max(1, size * 0.025);
  context.beginPath();
  context.arc(size * 0.84, size * 0.08, size * 0.07, 0.4, 2.2);
  context.stroke();
}

// Narwhal: a pale, spotty Arctic whale with no back fin, a round head, and one long twisted tusk.
function paintNarwhal(context, size, time) {
  const back = "#7f8d99", dark = "#5b6874", belly = "#eef2f4", ivory = "#f2e8cc";
  const beat = Math.sin(time * 2);
  const tailY = beat * size * 0.06;

  context.save();
  context.translate(-size * 0.9, tailY);
  paintFlukes(context, size * 0.4, Math.sin(time * 2 - 0.9) * 0.35, back, dark);
  context.restore();

  context.save();
  context.translate(size * 0.84, -size * 0.05);
  context.rotate(-0.1);
  context.beginPath();
  context.moveTo(0, -size * 0.05);
  context.lineTo(size * 1.05, 0);
  context.lineTo(0, size * 0.05);
  context.closePath();
  context.fillStyle = ivory;
  context.fill();
  context.clip();
  context.strokeStyle = "#b8a680";
  context.lineWidth = Math.max(1, size * 0.018);
  context.beginPath();
  for (let twist = 0; twist < 10; twist++) {
    const x = size * (0.08 + twist * 0.1);
    context.moveTo(x, size * 0.06);
    context.lineTo(x + size * 0.07, -size * 0.06);
  }
  context.stroke();
  context.restore();

  context.beginPath();
  context.moveTo(size, size * 0.06);
  context.bezierCurveTo(size * 1.02, -size * 0.14, size * 0.86, -size * 0.3, size * 0.56, -size * 0.31);
  context.bezierCurveTo(size * 0.1, -size * 0.34, -size * 0.45, -size * 0.22, -size * 0.92, tailY - size * 0.045);
  context.lineTo(-size * 0.92, tailY + size * 0.045);
  context.bezierCurveTo(-size * 0.45, size * 0.2, size * 0.05, size * 0.33, size * 0.45, size * 0.29);
  context.bezierCurveTo(size * 0.76, size * 0.26, size * 0.97, size * 0.2, size, size * 0.06);
  context.closePath();
  context.fillStyle = belly;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(size * 1.1, -size * 0.02);
  context.quadraticCurveTo(size * 0.5, size * 0.06, -size * 0.2, size * 0.02);
  context.quadraticCurveTo(-size * 0.7, 0, -size, tailY);
  context.lineTo(-size, -size * 0.5);
  context.lineTo(size * 1.1, -size * 0.5);
  context.fill();
  // Mottled: dark blotches on the back, a few grey ones spilling down the pale sides.
  context.beginPath();
  for (const [x, y, r] of [[0.1, 0.1, 0.04], [-0.12, 0.12, 0.03], [-0.36, 0.08, 0.035], [0.32, 0.12, 0.025],
    [-0.56, 0.06, 0.025], [0.52, 0.08, 0.02]]) {
    context.moveTo(size * (x + r), size * y);
    context.arc(size * x, size * y, size * r, 0, Math.PI * 2);
  }
  context.fill();
  context.fillStyle = dark;
  context.beginPath();
  for (const [x, y, r] of [[0.4, -0.2, 0.035], [0.2, -0.26, 0.04], [0.02, -0.16, 0.045], [-0.2, -0.24, 0.035],
    [-0.32, -0.1, 0.03], [-0.5, -0.17, 0.035], [-0.68, -0.08, 0.025], [0.28, -0.08, 0.025], [-0.06, -0.3, 0.025]]) {
    context.moveTo(size * (x + r), size * y);
    context.arc(size * x, size * y, size * r, 0, Math.PI * 2);
  }
  context.fill();
  context.restore();

  paintFlipper(context, size * 0.42, size * 0.17, size * 0.22, size * 0.07, 0.9 + beat * 0.2, dark);
  paintEye(context, size * 0.62, -size * 0.04, Math.max(2.5, size * 0.075));
  context.strokeStyle = "#3f4b56";
  context.lineWidth = Math.max(1, size * 0.025);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(size * 0.97, size * 0.12);
  context.quadraticCurveTo(size * 0.84, size * 0.17, size * 0.74, size * 0.1);
  context.stroke();
}

// Whale shark: the biggest fish of all, and a gentle one that only eats tiny plankton. A wide flat
// mouth right at the front, a dark blue-grey back covered in white spots and pale stripes, a tall tail.
function paintWhaleShark(context, size, time) {
  const back = "#446682", dark = "#324f69", belly = "#dfe9ef";
  const wag = Math.sin(time * 1.8);

  context.fillStyle = dark;
  context.save();
  context.translate(-size * 0.86, 0);
  context.rotate(wag * 0.12);
  paintTail(context, "shark", size * 0.62);
  context.restore();
  context.beginPath();
  context.moveTo(-size * 0.04, -size * 0.3);
  context.quadraticCurveTo(-size * 0.2, -size * 0.42, -size * 0.34, -size * 0.58);
  context.quadraticCurveTo(-size * 0.36, -size * 0.4, -size * 0.5, -size * 0.2);
  context.moveTo(-size * 0.6, -size * 0.14);
  context.lineTo(-size * 0.72, -size * 0.25);
  context.quadraticCurveTo(-size * 0.73, -size * 0.15, -size * 0.8, -size * 0.1);
  context.moveTo(-size * 0.5, size * 0.14);
  context.lineTo(-size * 0.64, size * 0.24);
  context.quadraticCurveTo(-size * 0.66, size * 0.14, -size * 0.74, size * 0.09);
  context.fill();

  context.beginPath();
  context.moveTo(size * 1.02, size * 0.03);
  context.bezierCurveTo(size * 1.03, -size * 0.13, size * 0.92, -size * 0.24, size * 0.62, -size * 0.29);
  context.bezierCurveTo(size * 0.2, -size * 0.36, -size * 0.45, -size * 0.24, -size * 0.9, -size * 0.07);
  context.lineTo(-size * 0.9, size * 0.07);
  context.bezierCurveTo(-size * 0.45, size * 0.2, size * 0.1, size * 0.3, size * 0.55, size * 0.26);
  context.bezierCurveTo(size * 0.85, size * 0.23, size * 1.0, size * 0.17, size * 1.02, size * 0.03);
  context.closePath();
  context.fillStyle = back;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = belly;
  context.beginPath();
  context.moveTo(size * 1.1, size * 0.1);
  context.quadraticCurveTo(size * 0.5, size * 0.17, -size * 0.2, size * 0.14);
  context.quadraticCurveTo(-size * 0.6, size * 0.1, -size, size * 0.05);
  context.lineTo(-size, size * 0.4);
  context.lineTo(size * 1.1, size * 0.4);
  context.fill();
  // Pale stripes across the back and two long ridges down the side, then the spots between them.
  context.strokeStyle = "rgba(226,238,245,.5)";
  context.lineWidth = Math.max(1, size * 0.018);
  context.beginPath();
  for (let stripe = 0; stripe < 7; stripe++) {
    const x = size * (0.42 - stripe * 0.18);
    context.moveTo(x, -size * 0.4);
    context.quadraticCurveTo(x - size * 0.04, -size * 0.1, x, size * 0.14);
  }
  context.moveTo(size * 0.58, -size * 0.17);
  context.quadraticCurveTo(0, -size * 0.24, -size * 0.9, -size * 0.04);
  context.moveTo(size * 0.52, -size * 0.03);
  context.quadraticCurveTo(0, -size * 0.07, -size * 0.9, size * 0.02);
  context.stroke();
  context.fillStyle = "rgba(238,246,250,.92)";
  context.beginPath();
  for (let column = 0; column < 7; column++) {
    for (let row = 0; row < 4; row++) {
      const x = size * (0.33 - column * 0.18), y = size * (-0.27 + row * 0.1 + (column % 2) * 0.04);
      const r = Math.max(0.8, size * 0.02);
      context.moveTo(x + r, y);
      context.arc(x, y, r, 0, Math.PI * 2);
    }
  }
  for (const [x, y] of [[0.62, -0.22], [0.72, -0.18], [0.84, -0.18], [0.66, -0.12], [0.92, -0.1], [0.74, -0.04],
    [0.56, -0.08], [0.88, 0.0]]) {
    const r = Math.max(0.7, size * 0.015);
    context.moveTo(size * x + r, size * y);
    context.arc(size * x, size * y, r, 0, Math.PI * 2);
  }
  context.fill();
  context.strokeStyle = "rgba(34,56,76,.6)";
  context.lineWidth = Math.max(1, size * 0.014);
  context.beginPath();
  for (let gill = 0; gill < 4; gill++) {
    const x = size * (0.46 + gill * 0.045);
    context.moveTo(x, -size * 0.12);
    context.quadraticCurveTo(x - size * 0.03, size * 0.02, x, size * 0.14);
  }
  context.stroke();
  context.restore();

  paintFlipper(context, size * 0.36, size * 0.18, size * 0.42, size * 0.09, 1.05 + wag * 0.08, dark, true);
  paintEye(context, size * 0.8, -size * 0.09, Math.max(2.5, size * 0.045));
  context.strokeStyle = "#1f3548";
  context.lineWidth = Math.max(1.5, size * 0.02);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(size * 1.02, size * 0.04);
  context.quadraticCurveTo(size * 0.92, size * 0.1, size * 0.8, size * 0.06);
  context.stroke();
}

// Stingray resting on the sand, seen a little from above: a flat diamond whose wings ripple gently,
// eyes on top, bright blue spots and a long thin tail.
function paintStingray(context, size, time) {
  const top = "#b98c5c", ridge = "#a67a4c", under = "#efe3cf";
  const lift = (1 - Math.cos(time * 1.3)) * size * 0.03;
  const y0 = -size * 0.47 - lift;
  const wing = Math.sin(time * 2.4) * size * 0.05;

  context.fillStyle = "rgba(0,20,30,.28)";
  context.beginPath();
  context.ellipse(0, -size * 0.03, size * 1.15, size * 0.13, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = top;
  context.lineWidth = Math.max(1.2, size * 0.07);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-size * 0.6, y0);
  context.quadraticCurveTo(-size * 1.3, y0 + Math.sin(time * 1.6) * size * 0.1,
    -size * 2.1, y0 - size * 0.05 + Math.sin(time * 1.6 - 1) * size * 0.14);
  context.stroke();

  const disc = () => {
    context.beginPath();
    context.moveTo(size * 1.0, y0);
    context.quadraticCurveTo(size * 0.55, y0 - size * 0.38, -size * 0.04, y0 - size * 0.46 - wing);
    context.quadraticCurveTo(-size * 0.45, y0 - size * 0.24 - wing * 0.5, -size * 0.76, y0);
    context.quadraticCurveTo(-size * 0.45, y0 + size * 0.26 - wing * 0.5, -size * 0.04, y0 + size * 0.4 - wing);
    context.quadraticCurveTo(size * 0.55, y0 + size * 0.34, size * 1.0, y0);
  };
  context.save();
  context.translate(0, size * 0.06);
  disc();
  context.fillStyle = under;
  context.fill();
  context.restore();
  disc();
  context.fillStyle = top;
  context.fill();
  context.save();
  context.clip();
  context.fillStyle = ridge;
  context.beginPath();
  context.ellipse(-size * 0.02, y0, size * 0.6, size * 0.15, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#56b8ec";
  context.beginPath();
  for (const [x, y, r] of [[0.12, -0.28, 0.05], [-0.18, -0.26, 0.045], [0.38, -0.18, 0.04], [-0.44, -0.1, 0.04],
    [-0.08, 0.26, 0.05], [0.24, 0.2, 0.045], [-0.38, 0.13, 0.04], [0.56, 0.1, 0.03], [0.02, -0.03, 0.04],
    [-0.58, 0.02, 0.028], [0.6, -0.08, 0.028]]) {
    context.moveTo(size * (x + r * 1.3), y0 + size * y);
    context.ellipse(size * x, y0 + size * y, size * r * 1.3, size * r, 0, 0, Math.PI * 2);
  }
  context.fill();
  context.restore();

  for (const y of [-0.14, 0.06]) paintEye(context, size * 0.44, y0 + size * y, Math.max(2, size * 0.1));
  context.strokeStyle = "#6e4a2a";
  context.lineWidth = Math.max(1, size * 0.035);
  context.beginPath();
  context.arc(size * 0.7, y0 - size * 0.04, size * 0.1, 0.5, 2.2);
  context.stroke();
}

// Green moray eel peeking out of its hole in a rock, swaying, slowly opening and closing its mouth
// the way morays breathe. No fangs: just a friendly face.
function paintEel(context, size, time) {
  const green = "#5a9e3e", light = "#a3d26c", dark = "#3f7f2e", rock = "#6f6a78";
  const sway = Math.sin(time * 1.1) * size * 0.14;
  const gape = (1 - Math.cos(time * 1.7)) / 2;
  const holeX = size * 0.1, holeY = -size * 0.52;

  context.fillStyle = rock;
  context.beginPath();
  context.moveTo(-size * 1.2, 0);
  context.bezierCurveTo(-size * 1.22, -size * 0.8, -size * 0.6, -size * 1.12, -size * 0.1, -size * 1.02);
  context.bezierCurveTo(size * 0.5, -size * 0.96, size * 1.02, -size * 0.6, size * 1.06, 0);
  context.closePath();
  context.fill();
  context.fillStyle = "rgba(170,165,185,.45)";
  context.beginPath();
  context.ellipse(-size * 0.45, -size * 0.86, size * 0.34, size * 0.09, -0.2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#f09aa6";
  context.beginPath();
  for (const [x, y] of [[-0.8, -0.3], [0.7, -0.25], [-0.6, -0.62], [0.55, -0.62]]) {
    context.moveTo(size * x + Math.max(1, size * 0.05), size * y);
    context.arc(size * x, size * y, Math.max(1, size * 0.05), 0, Math.PI * 2);
  }
  context.fill();
  context.fillStyle = "#1a2029";
  context.beginPath();
  context.ellipse(holeX, holeY, size * 0.34, size * 0.27, 0, 0, Math.PI * 2);
  context.fill();

  // The long body rising out of the hole: a thick green tube with a fin along its back and a paler
  // belly along the front.
  const neckX = size * 0.3 + sway, neckY = -size * 2.0;
  context.lineCap = "round";
  for (const [color, width, shift] of [[dark, 0.16, -0.2], [green, 0.42, 0], [light, 0.12, 0.12]]) {
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, size * width);
    context.beginPath();
    context.moveTo(holeX + size * shift, holeY + size * 0.05);
    context.quadraticCurveTo(holeX + size * (shift - 0.25) + sway * 0.3, -size * 1.35,
      neckX + size * shift * 0.6, neckY + size * 0.1);
    context.stroke();
  }
  context.fillStyle = rock;
  context.beginPath();
  context.ellipse(holeX, holeY + size * 0.25, size * 0.4, size * 0.13, 0, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(neckX, neckY);
  context.rotate(-0.12 + Math.sin(time * 1.1 - 0.5) * 0.06);
  context.scale(1.25, 1.25);
  const jaw = gape * 0.32;
  context.fillStyle = "#8e3446";
  context.beginPath();
  context.moveTo(size * 0.06, size * 0.05);
  context.lineTo(size * 0.58, -size * 0.01);
  context.lineTo(size * (0.06 + Math.cos(jaw) * 0.46), size * (0.06 + Math.sin(jaw) * 0.46));
  context.fill();
  context.save();
  context.translate(size * 0.06, size * 0.06);
  context.rotate(jaw);
  context.fillStyle = green;
  context.beginPath();
  context.moveTo(-size * 0.2, -size * 0.04);
  context.lineTo(size * 0.52, -size * 0.04);
  context.quadraticCurveTo(size * 0.54, size * 0.06, size * 0.4, size * 0.1);
  context.quadraticCurveTo(size * 0.1, size * 0.16, -size * 0.2, size * 0.14);
  context.fill();
  context.fillStyle = light;
  context.beginPath();
  context.ellipse(size * 0.14, size * 0.1, size * 0.2, size * 0.04, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.fillStyle = green;
  context.beginPath();
  context.moveTo(-size * 0.2, size * 0.1);
  context.bezierCurveTo(-size * 0.24, -size * 0.22, size * 0.14, -size * 0.3, size * 0.4, -size * 0.17);
  context.quadraticCurveTo(size * 0.62, -size * 0.1, size * 0.64, -size * 0.01);
  context.lineTo(size * 0.06, size * 0.06);
  context.closePath();
  context.fill();
  context.strokeStyle = dark;
  context.lineWidth = Math.max(1, size * 0.04);
  context.beginPath();
  context.moveTo(size * 0.12, size * 0.04);
  context.quadraticCurveTo(size * 0.04, size * 0.02, size * 0.03, -size * 0.04);
  context.stroke();
  paintEye(context, size * 0.32, -size * 0.12, Math.max(2, size * 0.11));
  context.restore();
}

// Hermit crab: a little crab living in a borrowed spiral snail shell, carrying it along as it
// walks, with eyes on stalks and one big claw.
function paintHermitCrab(context, size, time) {
  const leg = "#e3643c", far = "#b9492c", shell = "#f2c79c", shellDark = "#c47f55";
  const bob = Math.abs(Math.sin(time * 5)) * size * 0.05;
  context.lineCap = "round";
  context.lineJoin = "round";

  const legs = (color, hips, phase) => {
    context.strokeStyle = color;
    context.lineWidth = Math.max(1.2, size * 0.1);
    context.beginPath();
    hips.forEach((hip, index) => {
      const step = Math.sin(time * 10 + phase + index * 2) * size * 0.08;
      context.moveTo(size * hip, -size * 0.42 - bob);
      context.lineTo(size * (hip + 0.3), -size * 0.62 - bob + step);
      context.lineTo(size * (hip + 0.42) + step, 0);
    });
    context.stroke();
  };
  legs(far, [0.12, 0.3], 1);

  // The shell: a big round whorl with a spiral, a pointed spire behind, the opening at the front.
  const shellX = -size * 0.28, shellY = -size * 0.8 - bob;
  context.fillStyle = shell;
  context.beginPath();
  context.moveTo(shellX - size * 0.3, shellY - size * 0.5);
  context.quadraticCurveTo(shellX - size * 0.7, shellY - size * 0.72, shellX - size * 0.98, shellY - size * 0.94);
  context.quadraticCurveTo(shellX - size * 0.82, shellY - size * 0.46, shellX - size * 0.55, shellY - size * 0.1);
  context.fill();
  context.beginPath();
  context.arc(shellX, shellY, size * 0.62, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = shellDark;
  context.lineWidth = Math.max(1, size * 0.07);
  context.beginPath();
  for (let step = 0; step <= 40; step++) {
    const angle = step / 40 * Math.PI * 3.6;
    const reach = size * (0.04 + 0.44 * step / 40);
    const x = shellX - size * 0.04 + Math.cos(angle + 2.4) * reach, y = shellY - size * 0.04 + Math.sin(angle + 2.4) * reach;
    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.moveTo(shellX - size * 0.6, shellY - size * 0.56);
  context.lineTo(shellX - size * 0.72, shellY - size * 0.46);
  context.stroke();
  context.fillStyle = "#6d3b2a";
  context.beginPath();
  context.ellipse(shellX + size * 0.44, shellY + size * 0.3, size * 0.24, size * 0.2, -0.6, 0, Math.PI * 2);
  context.fill();

  // The crab peeking out of the opening.
  const headX = size * 0.28, headY = -size * 0.58 - bob;
  context.fillStyle = leg;
  context.beginPath();
  context.ellipse(headX, headY, size * 0.26, size * 0.2, -0.3, 0, Math.PI * 2);
  context.fill();
  legs(leg, [0.2, 0.4], 0);

  // Claws: an arm out to a round hand with two pincer fingers. The far one is small and darker.
  const claw = (color, x, y, scale, snap) => {
    context.strokeStyle = color;
    context.lineWidth = Math.max(1.2, size * 0.13 * scale);
    context.beginPath();
    context.moveTo(headX + size * 0.1, headY + size * 0.06);
    context.lineTo(headX + size * (x - 0.16 * scale), headY + size * y);
    context.stroke();
    context.save();
    context.translate(headX + size * x, headY + size * y);
    context.rotate(-0.15);
    context.scale(scale, scale);
    context.fillStyle = color;
    context.beginPath();
    context.ellipse(0, 0, size * 0.24, size * 0.17, 0, 0, Math.PI * 2);
    context.ellipse(size * 0.24, -size * 0.07, size * 0.14, size * 0.06, -0.3 - snap, 0, Math.PI * 2);
    context.ellipse(size * 0.22, size * 0.07, size * 0.12, size * 0.05, 0.3 + snap, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };
  const snap = Math.sin(time * 2.5) * 0.12;
  claw(far, 0.52, 0.28, 0.6, -snap);
  claw(leg, 0.66, 0.02, 1, snap);

  context.strokeStyle = "#c2472a";
  context.lineWidth = Math.max(0.8, size * 0.03);
  context.beginPath();
  context.moveTo(headX + size * 0.2, headY - size * 0.12);
  context.quadraticCurveTo(headX + size * 0.6, headY - size * 0.5, headX + size * 0.8, headY - size * 0.36 + Math.sin(time * 2) * size * 0.06);
  context.stroke();
  context.strokeStyle = leg;
  context.lineWidth = Math.max(1, size * 0.07);
  for (const [x, y] of [[0.08, -0.5], [0.24, -0.46]]) {
    context.beginPath();
    context.moveTo(headX + size * (x - 0.06), headY - size * 0.1);
    context.lineTo(headX + size * x, headY + size * y);
    context.stroke();
    paintEye(context, headX + size * x, headY + size * y, Math.max(1.6, size * 0.12));
  }
  context.strokeStyle = "#7a2a18";
  context.lineWidth = Math.max(1, size * 0.04);
  context.beginPath();
  context.arc(headX + size * 0.1, headY - size * 0.02, size * 0.08, 0.4, 2.0);
  context.stroke();
}

const PAINTERS = {
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
  penguin: paintPenguin,
  otter: paintOtter,
  seal: paintSeal,
  narwhal: paintNarwhal,
  whaleshark: paintWhaleShark,
  stingray: paintStingray,
  eel: paintEel,
  hermitcrab: paintHermitCrab
};
