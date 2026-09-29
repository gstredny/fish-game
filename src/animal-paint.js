// Cartoon drawings of the real animals in the game. Each is drawn facing right around (0, 0);
// the caller mirrors it for left. Floor animals stand on (0, 0), the sea bed.
// role: "player", "prey" (safe to eat, soft glow), "friend" (your own kind, a smile) or
// "predator" (teeth and a frown).
const FISH = {
  sardine: { back: "#5d8db8", belly: "#eaf4f8", fin: "#8fb6d6", height: 0.42, tail: "fork" },
  mackerel: { back: "#23877b", belly: "#e8f1ea", fin: "#5aa99c", height: 0.4, tail: "fork" },
  // Yellowfin tuna: yellow finlets and fins on top, a dark tail.
  tuna: { back: "#1d4777", belly: "#dfe8ef", fin: "#f2c94c", tailFin: "#2a5383", height: 0.5, tail: "moon" },
  shark: { back: "#8599a8", belly: "#f5f8f9", fin: "#7b8f9e", height: 0.36, tail: "shark" },
  parrotfish: { back: "#27b3a0", belly: "#9fe8d8", fin: "#f28cb1", height: 0.56, tail: "round" }
};

export function paintAnimal(context, kind, x, y, size, direction, time, role) {
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
  if (painter) painter(context, size, time, role);
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
  for (let leg = 0; leg < 3; leg++) {
    const step = Math.sin(time * 10 + leg * 2) * size * 0.1;
    for (const side of [-1, 1]) {
      context.beginPath();
      context.moveTo(side * size * 0.5, -size * 0.45);
      context.lineTo(side * size * (0.95 + leg * 0.12), -size * 0.55 + step);
      context.lineTo(side * size * (1.05 + leg * 0.15), 0);
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
  for (let fish = 0; fish < 2; fish++) {
    const phase = time * 1.1 + fish * Math.PI;
    context.save();
    context.translate(Math.cos(phase) * size * 0.8, -size * (1.05 + fish * 0.35) + Math.sin(phase * 2) * size * 0.1);
    context.scale((Math.sin(phase) > 0 ? -1 : 1) * size / 30, size / 30);
    paintClownfish(context);
    context.restore();
  }
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

const PAINTERS = {
  squid: paintSquid,
  turtle: paintTurtle,
  seahorse: paintSeahorse,
  octopus: paintOctopus,
  starfish: paintStarfish,
  crab: paintCrab,
  clownfish: paintAnemone
};
