// Cartoon drawings of the animals of the deep; registered into PAINTERS by animal-paint.js.
// Same rules as animal-paint.js: drawn facing right around (0, 0), the caller mirrors for left.
// role "predator" shows a stern brow, a frown and teeth; every other role smiles. The viperfish always shows its needle teeth.
// These animals live in the dark, so most carry their own lights: bright cyan, blue and green on dark bodies.
const TAU = Math.PI * 2;

// One colour per chain animal, for the HUD dot and the snack burst.
export const DEEP_SWATCHES = {
  marinesnow: "#b8cfdd", deepshrimp: "#f0894b", lanternfish: "#3f8fc4", viperfish: "#3f9f86", giantsquid: "#c14b5e", spermwhale: "#8a98a3"
};

// The colour of each glowing animal's own light.
export const DEEP_GLOWS = {
  marinesnow: "#9be7ff", deepshrimp: "#4aa8ff", lanternfish: "#4dffd0", viperfish: "#6bff9a",
  hatchetfish: "#7de3ff", vampiresquid: "#4d7dff", combjelly: "#88b4ff"
};

// "#rrggbb" and an alpha, as an rgba() string.
function tint(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
}

function paintEye(context, x, y, radius) {
  context.fillStyle = "#f7ffef";
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(x + radius * 0.25, y, radius * 0.56, 0, TAU);
  context.fill();
}

// The eye and the mouth, drawn in `ink`. The mouth runs from its tip (front) back to its corner, at height mouthY.
// eye: false when the animal draws its own eye; teeth: 0 when it draws its own teeth.
function paintLook(context, size, role, { eyeX, eyeY, eyeR, tipX, backX, mouthY, teeth = 4, ink, eye = true }) {
  if (eye) paintEye(context, eyeX, eyeY, eyeR);
  const span = tipX - backX, midX = (tipX + backX) / 2;
  const depth = Math.max(size * 0.05, span * 0.2);
  context.lineCap = "round";
  context.strokeStyle = ink;
  if (role !== "predator") {
    context.lineWidth = Math.max(1, size * 0.03);
    context.beginPath();
    context.moveTo(tipX, mouthY);
    context.quadraticCurveTo(midX, mouthY + depth, backX, mouthY - depth * 0.3);
    context.stroke();
    return;
  }
  context.lineWidth = Math.max(1.2, size * 0.035);
  context.beginPath();
  context.moveTo(tipX, mouthY);
  context.quadraticCurveTo(midX, mouthY - depth, backX, mouthY + depth * 0.6);
  context.stroke();
  if (teeth) {
    const width = Math.max(1.6, span * 0.11), height = Math.max(1.8, size * 0.07);
    context.fillStyle = "#ffffff";
    context.beginPath();
    for (let tooth = 0; tooth < teeth; tooth++) {
      const t = (tooth + 0.7) / (teeth + 0.2), u = 1 - t;
      const x = u * u * tipX + 2 * u * t * midX + t * t * backX;
      const y = u * u * mouthY + 2 * u * t * (mouthY - depth) + t * t * (mouthY + depth * 0.6);
      context.moveTo(x - width / 2, y);
      context.lineTo(x + width / 2, y);
      context.lineTo(x, y + height);
    }
    context.fill();
  }
  context.lineWidth = Math.max(1.5, size * 0.04);
  context.beginPath();
  context.moveTo(eyeX - eyeR * 1.6, eyeY - eyeR * 1.9);
  context.lineTo(eyeX + eyeR * 1.7, eyeY - eyeR * 0.7);
  context.stroke();
}

// A row of lights, each [x, y]: a soft halo, a bright core and a white glint, all breathing a little with time.
function paintLights(context, points, radius, colour, time) {
  for (const [scale, fill] of [[2.4, tint(colour, 0.22)], [1, colour], [0.4, "rgba(255,255,255,.85)"]]) {
    context.fillStyle = fill;
    context.beginPath();
    points.forEach(([x, y], index) => {
      const r = radius * scale * (1 + Math.sin(time * 3 + index * 0.9) * 0.14);
      context.moveTo(x + r, y);
      context.arc(x, y, r, 0, TAU);
    });
    context.fill();
  }
}

// Points along a wavy line that starts at (x, y), heads along `angle` for `length`, and sways more toward its tip.
function wavyPoints(x, y, angle, length, sway, time, phase, count = 9) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count, along = length * t, side = Math.sin(t * 3.2 - time * 2.4 + phase) * sway * t;
    return [x + Math.cos(angle) * along - Math.sin(angle) * side, y + Math.sin(angle) * along + Math.cos(angle) * side];
  });
}

// The two edges of a ribbon along `points`; widthAt gives its full width from 0 (first point) to 1 (last point).
function ribbonEdges(points, widthAt) {
  const left = [], right = [], last = points.length - 1;
  points.forEach(([x, y], i) => {
    const [ax, ay] = points[Math.max(0, i - 1)], [bx, by] = points[Math.min(last, i + 1)];
    const length = Math.hypot(bx - ax, by - ay) || 1, half = widthAt(i / last) / 2;
    const nx = -(by - ay) / length * half, ny = (bx - ax) / length * half;
    left.push([x + nx, y + ny]);
    right.push([x - nx, y - ny]);
  });
  return { left, right };
}

function fillEdges(context, first, second) {
  context.beginPath();
  first.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
  for (let i = second.length - 1; i >= 0; i--) context.lineTo(second[i][0], second[i][1]);
  context.closePath();
  context.fill();
}

function fillRibbon(context, points, widthAt) {
  const edges = ribbonEdges(points, widthAt);
  fillEdges(context, edges.left, edges.right);
  return edges;
}

function tracePoints(context, points) {
  points.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
}

// Marine snow: a few pale flakes of dead plankton and slime drifting down. One sparkles with glowing bacteria.
function paintMarineSnow(context, size, time) {
  const s = size, glow = DEEP_GLOWS.marinesnow;
  context.lineCap = "round";
  const flakes = [[-1.7, -0.7, 0.55, 0.3], [-0.7, 0.9, 0.45, 1.2], [0.1, -0.9, 0.7, 2.1], [1, 0.3, 0.6, 3.3],
    [1.9, -0.5, 0.4, 4], [1.4, 1.3, 0.34, 5.1], [-1.5, 1.2, 0.36, 0.9]];
  flakes.forEach(([x, y, radius, phase], index) => {
    const r = s * radius;
    context.save();
    context.translate(s * x + Math.cos(time * 0.7 + phase) * s * 0.1, s * y + Math.sin(time * 0.9 + phase) * s * 0.14);
    context.rotate(Math.sin(time * 0.5 + phase) * 0.6);
    context.strokeStyle = "rgba(226,238,246,.35)";
    context.lineWidth = Math.max(0.6, s * 0.06);
    context.beginPath();
    context.moveTo(r * 0.9, 0);
    context.quadraticCurveTo(r * 1.3, -r * 0.35, r * 1.55, -r * 0.15);
    context.moveTo(-r * 0.9, r * 0.1);
    context.quadraticCurveTo(-r * 1.2, r * 0.4, -r * 1.45, r * 0.4);
    context.stroke();
    context.fillStyle = "rgba(226,238,246,.85)";
    context.beginPath();
    context.ellipse(0, 0, r, r * 0.62, 0, 0, TAU);
    context.moveTo(r * 0.95, -r * 0.25);
    context.ellipse(r * 0.4, -r * 0.25, r * 0.55, r * 0.4, 0, 0, TAU);
    context.moveTo(-r * 0.0, r * 0.2);
    context.ellipse(-r * 0.5, r * 0.2, r * 0.5, r * 0.36, 0, 0, TAU);
    context.fill();
    context.fillStyle = "rgba(140,170,195,.55)";
    context.beginPath();
    context.ellipse(0, 0, r * 0.4, r * 0.25, 0, 0, TAU);
    context.fill();
    if (index === 2) {
      const pulse = 0.65 + Math.sin(time * 3) * 0.35, reach = r * (0.7 + pulse * 0.4);
      const halo = context.createRadialGradient(0, 0, 0, 0, 0, r * 2);
      halo.addColorStop(0, tint(glow, 0.7 * pulse));
      halo.addColorStop(1, tint(glow, 0));
      context.fillStyle = halo;
      context.beginPath();
      context.arc(0, 0, r * 2, 0, TAU);
      context.fill();
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.moveTo(0, -reach);
      context.quadraticCurveTo(0, 0, reach, 0);
      context.quadraticCurveTo(0, 0, 0, reach);
      context.quadraticCurveTo(0, 0, -reach, 0);
      context.quadraticCurveTo(0, 0, 0, -reach);
      context.fill();
    }
    context.restore();
  });
}

// Deep-sea shrimp: an orange-red shrimp with an arched back, long feelers, and a faint blue glow.
function paintDeepShrimp(context, size, time, role) {
  const s = size, glow = DEEP_GLOWS.deepshrimp, flex = Math.sin(time * 3) * 0.06;
  const head = [s * 0.62, -s * 0.05], bend = [-s * 0.2, -s * (0.85 - flex)], tail = [-s * 0.95, s * (0.28 + flex * 2)];
  const at = t => [0, 1].map(k => (1 - t) * (1 - t) * head[k] + 2 * (1 - t) * t * bend[k] + t * t * tail[k]);
  const angle = t => Math.atan2(2 * (1 - t) * (bend[1] - head[1]) + 2 * t * (tail[1] - bend[1]),
    2 * (1 - t) * (bend[0] - head[0]) + 2 * t * (tail[0] - bend[0]));
  context.lineCap = "round";
  context.lineJoin = "round";

  const aura = context.createRadialGradient(0, -s * 0.15, 0, 0, -s * 0.15, s * 1.3);
  aura.addColorStop(0, tint(glow, 0.26));
  aura.addColorStop(1, tint(glow, 0));
  context.fillStyle = aura;
  context.beginPath();
  context.arc(0, -s * 0.15, s * 1.3, 0, TAU);
  context.fill();

  // Long feelers, then the little legs beating under the belly.
  context.strokeStyle = "#f0a080";
  context.lineWidth = Math.max(0.8, s * 0.05);
  for (const [tilt, sway, phase] of [[-0.6, 0.3, 0], [-0.1, 0.25, 2]]) {
    context.beginPath();
    tracePoints(context, wavyPoints(s * 0.85, -s * 0.16, tilt, s * 1.15, s * sway, time, phase, 8));
    context.stroke();
  }
  context.lineWidth = Math.max(0.8, s * 0.06);
  context.beginPath();
  for (let leg = 0; leg < 5; leg++) {
    const t = 0.25 + leg * 0.12, [x, y] = at(t), a = angle(t);
    const wave = Math.sin(time * 10 + leg) * s * 0.08;
    context.moveTo(x + Math.sin(a) * s * 0.15, y - Math.cos(a) * s * 0.15);
    context.lineTo(x + Math.sin(a) * s * 0.42 + wave, y - Math.cos(a) * s * 0.42);
  }
  context.stroke();

  // The tail fan.
  context.save();
  const [fanX, fanY] = at(0.93);
  context.translate(fanX, fanY);
  context.rotate(angle(0.93) + flex * 2);
  context.fillStyle = "#c9452f";
  context.strokeStyle = "#7c2620";
  context.lineWidth = Math.max(0.8, s * 0.04);
  for (const [turn, lift] of [[-0.5, -0.08], [0.5, 0.08], [0, 0]]) {
    context.save();
    context.translate(s * 0.02, s * lift);
    context.rotate(turn);
    context.beginPath();
    context.ellipse(s * 0.1, 0, s * 0.22, s * 0.075, 0, 0, TAU);
    context.fill();
    context.stroke();
    context.restore();
  }
  context.restore();

  // The body: overlapping plates from the tail forward, then the head shield with its spike.
  const lights = [];
  for (let plate = 0; plate < 6; plate++) {
    const t = 0.88 - plate * 0.11, [x, y] = at(t), a = angle(t), rise = s * (0.14 + 0.16 * (1 - t) * 1.3);
    context.fillStyle = plate % 2 ? "#e2693f" : "#d8563a";
    context.strokeStyle = "#8c2a26";
    context.lineWidth = Math.max(0.8, s * 0.04);
    context.beginPath();
    context.ellipse(x, y, s * 0.21, rise, a, 0, TAU);
    context.fill();
    context.stroke();
    if (t < 0.7 && t > 0.25) lights.push([x + Math.sin(a) * rise * 0.6, y - Math.cos(a) * rise * 0.6]);
  }
  const [hx, hy] = at(0.06);
  context.fillStyle = "#e2693f";
  context.beginPath();
  context.moveTo(hx + s * 0.28, hy - s * 0.12);
  context.lineTo(hx + s * 0.85, hy - s * 0.3);
  context.lineTo(hx + s * 0.25, hy + s * 0.08);
  context.closePath();
  context.fill();
  context.strokeStyle = "#8c2a26";
  context.beginPath();
  context.ellipse(hx, hy, s * 0.4, s * 0.3, 0.15, 0, TAU);
  context.fillStyle = "#e8744a";
  context.fill();
  context.stroke();
  paintLights(context, lights, Math.max(1, s * 0.055), glow, time);
  paintLook(context, s, role, {
    eyeX: hx + s * 0.2, eyeY: hy - s * 0.08, eyeR: Math.max(2.2, s * 0.17),
    tipX: hx + s * 0.4, backX: hx + s * 0.14, mouthY: hy + s * 0.15, teeth: 2, ink: "#5a1a18"
  });
}

// Lanternfish: a slim blue fish with big eyes and rows of little lights along its belly, like tiny lanterns.
function paintLanternfish(context, size, time, role) {
  const s = size, glow = DEEP_GLOWS.lanternfish;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(-s * 0.62, 0);
  context.rotate(Math.sin(time * 7) * 0.2);
  context.fillStyle = "#2f668f";
  context.beginPath();
  context.moveTo(s * 0.1, -s * 0.07);
  context.lineTo(-s * 0.34, -s * 0.34);
  context.quadraticCurveTo(-s * 0.2, 0, -s * 0.34, s * 0.34);
  context.lineTo(s * 0.1, s * 0.07);
  context.closePath();
  context.fill();
  context.restore();

  // Little fins: one on the back, a tiny one behind it, one under the tail end.
  context.fillStyle = "#2c5f86";
  context.beginPath();
  context.moveTo(s * 0.4, -s * 0.34);
  context.quadraticCurveTo(s * 0.12, -s * 0.66, -s * 0.12, -s * 0.34);
  context.closePath();
  context.moveTo(-s * 0.38, -s * 0.2);
  context.quadraticCurveTo(-s * 0.44, -s * 0.36, -s * 0.5, -s * 0.16);
  context.closePath();
  context.moveTo(-s * 0.1, s * 0.34);
  context.quadraticCurveTo(-s * 0.3, s * 0.56, -s * 0.5, s * 0.16);
  context.closePath();
  context.fill();

  context.save();
  context.translate(s * 0.32, s * 0.3);
  context.rotate(0.7 + Math.sin(time * 6) * 0.2);
  context.fillStyle = "#2c5f86";
  context.beginPath();
  context.ellipse(0, s * 0.1, s * 0.07, s * 0.17, 0, 0, TAU);
  context.fill();
  context.restore();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.96, s * 0.03);
    context.bezierCurveTo(s * 0.92, -s * 0.16, s * 0.6, -s * 0.36, s * 0.15, -s * 0.37);
    context.bezierCurveTo(-s * 0.25, -s * 0.37, -s * 0.5, -s * 0.2, -s * 0.66, -s * 0.09);
    context.lineTo(-s * 0.66, s * 0.09);
    context.bezierCurveTo(-s * 0.5, s * 0.2, -s * 0.25, s * 0.4, s * 0.15, s * 0.4);
    context.bezierCurveTo(s * 0.6, s * 0.4, s * 0.9, s * 0.22, s * 0.96, s * 0.03);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.37, 0, s * 0.4);
  skin.addColorStop(0, "#173a5e");
  skin.addColorStop(0.5, "#3b78a6");
  skin.addColorStop(1, "#a8d2de");
  context.fillStyle = skin;
  body();
  context.fill();
  context.strokeStyle = "rgba(190,230,245,.35)";
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  context.moveTo(s * 0.72, s * 0.02);
  context.quadraticCurveTo(s * 0.1, -s * 0.06, -s * 0.55, 0);
  context.stroke();

  // The lights: a curved row along the belly, a short row on the flank, a lamp under the eye and one at the tail.
  const belly = Array.from({ length: 8 }, (_, i) => {
    const x = 0.62 - i * 0.15;
    return [s * x, s * (0.3 - 0.3 * Math.pow((x - 0.2) / 0.9, 2))];
  });
  const flank = [0.5, 0.25, 0, -0.25].map(x => [s * x, s * 0.1]);
  paintLights(context, [...belly, ...flank, [s * 0.68, s * 0.14], [-s * 0.6, -s * 0.02]], Math.max(1.1, s * 0.055), glow, time);
  paintLook(context, s, role, {
    eyeX: s * 0.62, eyeY: -s * 0.08, eyeR: Math.max(2.5, s * 0.15),
    tipX: s * 0.94, backX: s * 0.6, mouthY: s * 0.07, teeth: 3, ink: "rgba(230,246,252,.9)"
  });
}

// Viperfish: a dark, slim fish with needle teeth too long for its mouth, light rows, and a glowing lure on a long thread.
function paintViperfish(context, size, time, role) {
  const s = size, glow = DEEP_GLOWS.viperfish, ink = "#c8f7ea";
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(-s * 0.84, 0);
  context.rotate(Math.sin(time * 5) * 0.16);
  context.fillStyle = "#123040";
  context.beginPath();
  context.moveTo(s * 0.06, -s * 0.05);
  context.lineTo(-s * 0.3, -s * 0.28);
  context.quadraticCurveTo(-s * 0.18, 0, -s * 0.3, s * 0.28);
  context.lineTo(s * 0.06, s * 0.05);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = "rgba(18,48,64,.85)";
  context.beginPath();
  context.moveTo(-s * 0.08, -s * 0.24);
  context.lineTo(-s * 0.3, -s * 0.52);
  context.lineTo(-s * 0.5, -s * 0.15);
  context.closePath();
  context.moveTo(s * 0.1, s * 0.3);
  context.quadraticCurveTo(-s * 0.05, s * 0.52, -s * 0.22, s * 0.2);
  context.closePath();
  context.fill();

  // The lure: a thread arching up from the back and over the snout, with a light on its end.
  const bob = Math.sin(time * 2.2) * s * 0.06, lure = [s * 1.1 + bob, -s * 0.6 + Math.cos(time * 1.7) * s * 0.05];
  context.strokeStyle = "#4d8a86";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.moveTo(s * 0.3, -s * 0.28);
  context.bezierCurveTo(s * 0.3, -s * 0.95, s * 0.85, -s * 1.05, lure[0], lure[1]);
  context.stroke();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.99, 0);
    context.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.62, -s * 0.32, s * 0.3, -s * 0.3);
    context.bezierCurveTo(-s * 0.1, -s * 0.3, -s * 0.5, -s * 0.18, -s * 0.86, -s * 0.06);
    context.lineTo(-s * 0.86, s * 0.06);
    context.bezierCurveTo(-s * 0.5, s * 0.14, -s * 0.1, s * 0.32, s * 0.3, s * 0.3);
    context.bezierCurveTo(s * 0.6, s * 0.3, s * 0.82, s * 0.28, s * 0.9, s * 0.2);
    context.quadraticCurveTo(s * 0.99, s * 0.1, s * 0.99, 0);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.3, 0, s * 0.3);
  skin.addColorStop(0, "#07141d");
  skin.addColorStop(0.55, "#123040");
  skin.addColorStop(1, "#2c5a66");
  context.fillStyle = skin;
  body();
  context.fill();
  context.strokeStyle = "rgba(110,220,200,.5)";
  context.lineWidth = Math.max(1, s * 0.03);
  context.stroke();
  context.strokeStyle = "rgba(130,230,220,.3)";
  context.beginPath();
  context.moveTo(s * 0.55, -s * 0.02);
  context.quadraticCurveTo(-s * 0.1, -s * 0.1, -s * 0.8, -s * 0.01);
  context.stroke();

  context.fillStyle = "#2c5a66";
  context.save();
  context.translate(s * 0.32, s * 0.18);
  context.rotate(0.8 + Math.sin(time * 4) * 0.15);
  context.beginPath();
  context.ellipse(0, s * 0.1, s * 0.05, s * 0.14, 0, 0, TAU);
  context.fill();
  context.restore();

  // The needle teeth: long ones up from the lower jaw, shorter ones down from the upper lip, all standing on the mouth line.
  const mouthY = s * 0.1, tipX = s * 0.98, backX = s * 0.44, depth = Math.max(s * 0.05, (tipX - backX) * 0.2);
  const lipY = x => {
    const t = (tipX - x) / (tipX - backX);
    return mouthY + (role === "predator" ? -depth * 2 * (1 - t) * t + depth * 0.6 * t * t : depth * 2 * (1 - t) * t - depth * 0.3 * t * t);
  };
  context.fillStyle = "#f4f8ea";
  context.beginPath();
  for (const [x, length] of [[0.95, 0.44], [0.86, 0.38], [0.77, 0.3], [0.68, 0.2]]) {
    const y = lipY(s * x);
    context.moveTo(s * (x - 0.025), y);
    context.lineTo(s * (x + 0.02), y);
    context.quadraticCurveTo(s * (x + 0.05), y - s * length * 0.5, s * (x + 0.05 + length * 0.12), y - s * length);
    context.quadraticCurveTo(s * (x - 0.02), y - s * length * 0.5, s * (x - 0.025), y);
  }
  for (const [x, length] of [[0.9, 0.2], [0.8, 0.16]]) {
    const y = lipY(s * x);
    context.moveTo(s * (x - 0.02), y);
    context.lineTo(s * (x + 0.02), y);
    context.lineTo(s * (x - 0.01), y + s * length);
  }
  context.fill();

  const rows = Array.from({ length: 11 }, (_, i) => {
    const x = 0.72 - i * 0.14;
    return [s * x, s * (x > 0.3 ? 0.2 : 0.04 + 0.15 * (x + 0.86) / 1.16)];
  });
  paintLights(context, rows, Math.max(1, s * 0.03), glow, time);
  const halo = context.createRadialGradient(lure[0], lure[1], 0, lure[0], lure[1], s * 0.5);
  halo.addColorStop(0, tint(glow, 0.55 + Math.sin(time * 4) * 0.15));
  halo.addColorStop(1, tint(glow, 0));
  context.fillStyle = halo;
  context.beginPath();
  context.arc(lure[0], lure[1], s * 0.5, 0, TAU);
  context.fill();
  paintLights(context, [lure], Math.max(1.6, s * 0.075), glow, time);
  paintLook(context, s, role, {
    eyeX: s * 0.55, eyeY: -s * 0.1, eyeR: Math.max(2.4, s * 0.1),
    tipX, backX, mouthY, teeth: 0, ink
  });
}

// Giant squid: a red squid with a long mantle, two fins at its tip, ten arms in front and a huge eye.
function paintGiantSquid(context, size, time, role) {
  const s = size, dark = "#7a1730", mid = "#b8405a", pale = "#e58a86";
  context.lineCap = "round";
  context.lineJoin = "round";

  // Two long feeding tentacles, each ending in a club with pale suckers.
  for (const side of [-1, 1]) {
    const points = wavyPoints(s * 0.42, side * s * 0.07, side * 0.16, s * 0.75, s * 0.16, time, side * 1.7);
    context.fillStyle = mid;
    fillRibbon(context, points, t => s * (0.07 - 0.03 * t));
    const [x, y] = points[points.length - 1];
    context.beginPath();
    context.ellipse(x, y, s * 0.1, s * 0.055, side * 0.16, 0, TAU);
    context.fill();
    context.fillStyle = pale;
    context.beginPath();
    for (let sucker = 0; sucker < 3; sucker++) {
      context.moveTo(x - s * (0.03 - sucker * 0.03) + s * 0.02, y);
      context.arc(x - s * (0.03 - sucker * 0.03), y, Math.max(0.8, s * 0.02), 0, TAU);
    }
    context.fill();
  }
  // Eight shorter arms.
  for (let arm = 0; arm < 8; arm++) {
    const spread = (arm - 3.5) / 3.5;
    const points = wavyPoints(s * 0.4, spread * s * 0.14, spread * 0.62, s * (0.62 - Math.abs(spread) * 0.1), s * 0.08, time, arm * 0.8);
    context.fillStyle = arm % 2 ? dark : mid;
    fillRibbon(context, points, t => s * (0.13 - 0.1 * t));
  }

  // The two fins at the tip of the mantle, flapping.
  const flap = Math.sin(time * 3) * s * 0.06;
  context.fillStyle = dark;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(-s * 0.5, side * s * 0.2);
    context.quadraticCurveTo(-s * 0.85, side * (s * 0.52 + flap), -s * 1.1, side * s * 0.05);
    context.lineTo(-s * 0.9, side * s * 0.1);
    context.closePath();
    context.fill();
  }

  const mantle = () => {
    context.beginPath();
    context.moveTo(s * 0.3, -s * 0.27);
    context.bezierCurveTo(-s * 0.15, -s * 0.38, -s * 0.65, -s * 0.25, -s * 1.04, 0);
    context.bezierCurveTo(-s * 0.65, s * 0.25, -s * 0.15, s * 0.38, s * 0.3, s * 0.27);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.38, 0, s * 0.38);
  skin.addColorStop(0, dark);
  skin.addColorStop(0.5, mid);
  skin.addColorStop(1, pale);
  context.fillStyle = skin;
  mantle();
  context.fill();
  context.save();
  mantle();
  context.clip();
  context.fillStyle = "rgba(70,10,30,.32)";
  for (const [x, y, r] of [[-0.75, -0.08, 0.05], [-0.55, 0.1, 0.04], [-0.4, -0.15, 0.05], [-0.2, 0.05, 0.04],
    [-0.05, -0.12, 0.045], [-0.3, 0.2, 0.035], [-0.62, -0.22, 0.03], [0.05, 0.14, 0.035]]) {
    context.beginPath();
    context.arc(s * x, s * y, s * r, 0, TAU);
    context.fill();
  }
  context.restore();
  context.strokeStyle = "rgba(255,190,180,.35)";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.moveTo(s * 0.2, -s * 0.3);
  context.bezierCurveTo(-s * 0.2, -s * 0.34, -s * 0.6, -s * 0.22, -s * 0.9, -s * 0.05);
  context.stroke();

  // The head, its funnel and the huge eye.
  context.fillStyle = mid;
  context.beginPath();
  context.ellipse(s * 0.28, 0, s * 0.27, s * 0.3, 0, 0, TAU);
  context.fill();
  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(s * 0.1, s * 0.24);
  context.lineTo(s * 0.32, s * 0.44);
  context.lineTo(s * 0.4, s * 0.26);
  context.closePath();
  context.moveTo(s * 0.3 + s * 0.22, -s * 0.03);
  context.ellipse(s * 0.3, -s * 0.03, s * 0.22, s * 0.22, 0, 0, TAU);
  context.fill();
  paintLook(context, s, role, {
    eyeX: s * 0.3, eyeY: -s * 0.03, eyeR: s * 0.18,
    tipX: s * 0.5, backX: s * 0.3, mouthY: s * 0.22, teeth: 3, ink: "#3b0f1c"
  });
}

// Sperm whale: a huge grey whale with a big blunt head, a narrow lower jaw, wrinkled skin and squid-sucker scars.
function paintSpermWhale(context, size, time, role) {
  const s = size;
  const beat = Math.sin(time * 1.6);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(-s * 0.92, s * 0.01);
  context.rotate(beat * 0.1);
  context.fillStyle = "#4a5763";
  context.beginPath();
  context.moveTo(s * 0.08, -s * 0.05);
  context.quadraticCurveTo(-s * 0.16, -s * 0.12, -s * 0.28, -s * 0.44);
  context.quadraticCurveTo(-s * 0.3, -s * 0.2, -s * 0.2, -s * 0.03);
  context.quadraticCurveTo(-s * 0.3, s * 0.2, -s * 0.28, s * 0.44);
  context.quadraticCurveTo(-s * 0.16, s * 0.12, s * 0.08, s * 0.05);
  context.closePath();
  context.fill();
  context.restore();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.95, -s * 0.46);
    context.quadraticCurveTo(s * 1.03, -s * 0.44, s * 1.03, -s * 0.3);
    context.lineTo(s * 1.03, s * 0.08);
    context.quadraticCurveTo(s * 1.03, s * 0.2, s * 0.92, s * 0.26);
    context.bezierCurveTo(s * 0.6, s * 0.36, s * 0.3, s * 0.44, -s * 0.1, s * 0.4);
    context.bezierCurveTo(-s * 0.5, s * 0.36, -s * 0.75, s * 0.16, -s * 0.94, s * 0.05);
    context.lineTo(-s * 0.94, -s * 0.05);
    context.bezierCurveTo(-s * 0.75, -s * 0.2, -s * 0.55, -s * 0.36, -s * 0.36, -s * 0.42);
    context.lineTo(-s * 0.3, -s * 0.5);
    context.lineTo(-s * 0.2, -s * 0.42);
    context.bezierCurveTo(s * 0.1, -s * 0.42, s * 0.5, -s * 0.5, s * 0.95, -s * 0.46);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.5, 0, s * 0.44);
  skin.addColorStop(0, "#3f4b57");
  skin.addColorStop(0.5, "#66747f");
  skin.addColorStop(1, "#a4afb7");
  context.fillStyle = skin;
  body();
  context.fill();
  context.save();
  body();
  context.clip();
  // The pale lower jaw, then wrinkles along the back half.
  context.fillStyle = "#8a96a0";
  context.beginPath();
  context.moveTo(s * 1.1, s * 0.18);
  context.lineTo(s * 1.1, s * 0.6);
  context.lineTo(s * 0.4, s * 0.6);
  context.lineTo(s * 0.4, s * 0.34);
  context.quadraticCurveTo(s * 0.7, s * 0.28, s * 1.1, s * 0.18);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(20,28,34,.22)";
  context.lineWidth = Math.max(1, s * 0.015);
  context.beginPath();
  for (let fold = 0; fold < 12; fold++) {
    const x = -s * (0.8 - fold * 0.09), lean = (fold % 3 - 1) * s * 0.03;
    context.moveTo(x, -s * 0.3 + (fold % 2) * s * 0.06);
    context.quadraticCurveTo(x + lean, -s * 0.05, x - lean * 0.5, s * (0.12 + (fold % 4) * 0.03));
  }
  context.stroke();
  // Round scars from the suckers of squid it fought.
  context.strokeStyle = "rgba(225,235,240,.4)";
  context.lineWidth = Math.max(1, s * 0.018);
  context.beginPath();
  for (const [x, y, r] of [[0.1, -0.02, 0.035], [0.18, 0.05, 0.03], [0.02, 0.1, 0.03], [0.28, -0.1, 0.028], [0.22, 0.16, 0.025]]) {
    context.moveTo(s * (x + r), s * y);
    context.arc(s * x, s * y, s * r, 0, TAU);
  }
  context.stroke();
  context.restore();
  context.strokeStyle = "rgba(160,190,205,.35)";
  context.lineWidth = Math.max(1, s * 0.02);
  body();
  context.stroke();

  context.save();
  context.translate(s * 0.25, s * 0.3);
  context.rotate(0.9 + beat * 0.15);
  context.fillStyle = "#56646f";
  context.beginPath();
  context.ellipse(s * 0.1, 0, s * 0.18, s * 0.07, 0, 0, TAU);
  context.fill();
  context.restore();

  context.fillStyle = "#1f2830";
  context.beginPath();
  context.ellipse(s * 0.82, -s * 0.44, s * 0.05, s * 0.014, -0.2, 0, TAU);
  context.fill();
  paintLook(context, s, role, {
    eyeX: s * 0.5, eyeY: s * 0.1, eyeR: Math.max(2.6, s * 0.06),
    tipX: s * 0.99, backX: s * 0.46, mouthY: s * 0.22, teeth: 6, ink: "#1e262d"
  });
}

// Hatchetfish: a thin, deep, mirror-silver fish shaped like a little axe, with lights along its belly and big eyes.
function paintHatchetfish(context, size, time, role) {
  const s = size, glow = DEEP_GLOWS.hatchetfish;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(-s * 0.72, 0);
  context.rotate(Math.sin(time * 6) * 0.18);
  context.fillStyle = "rgba(120,160,190,.75)";
  context.beginPath();
  context.moveTo(s * 0.06, -s * 0.05);
  context.lineTo(-s * 0.34, -s * 0.3);
  context.quadraticCurveTo(-s * 0.22, 0, -s * 0.34, s * 0.3);
  context.lineTo(s * 0.06, s * 0.05);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = "rgba(90,130,165,.8)";
  context.beginPath();
  context.moveTo(s * 0.1, -s * 0.46);
  context.lineTo(-s * 0.16, -s * 0.76);
  context.lineTo(-s * 0.3, -s * 0.32);
  context.closePath();
  context.fill();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.98, -s * 0.02);
    context.quadraticCurveTo(s * 0.92, -s * 0.38, s * 0.5, -s * 0.48);
    context.lineTo(-s * 0.2, -s * 0.34);
    context.lineTo(-s * 0.72, -s * 0.08);
    context.lineTo(-s * 0.72, s * 0.08);
    context.quadraticCurveTo(-s * 0.3, s * 0.34, s * 0.08, s * 0.74);
    context.quadraticCurveTo(s * 0.62, s * 0.62, s * 0.98, -s * 0.02);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.48, 0, s * 0.74);
  skin.addColorStop(0, "#3b5875");
  skin.addColorStop(0.3, "#b9d3e4");
  skin.addColorStop(0.7, "#e4eff5");
  skin.addColorStop(1, "#8fb2c8");
  context.fillStyle = skin;
  body();
  context.fill();
  // A shimmer slides over the mirror sides.
  context.save();
  body();
  context.clip();
  const slide = ((time * 0.4) % 2.4 - 1.2) * s;
  context.fillStyle = "rgba(255,255,255,.4)";
  context.beginPath();
  context.moveTo(slide, -s * 0.6);
  context.lineTo(slide + s * 0.16, -s * 0.6);
  context.lineTo(slide - s * 0.1, s * 0.8);
  context.lineTo(slide - s * 0.26, s * 0.8);
  context.closePath();
  context.fill();
  context.restore();
  context.strokeStyle = "rgba(150,190,215,.6)";
  context.lineWidth = Math.max(1, s * 0.03);
  body();
  context.stroke();

  context.save();
  context.translate(s * 0.4, s * 0.16);
  context.rotate(0.6 + Math.sin(time * 5) * 0.2);
  context.fillStyle = "rgba(90,130,165,.85)";
  context.beginPath();
  context.ellipse(0, s * 0.1, s * 0.06, s * 0.16, 0, 0, TAU);
  context.fill();
  context.restore();

  // Belly lights along the sharp lower edge, shining down: two curves that meet at the keel, pulled a little inside.
  const along = (from, bend, to, t) => [0, 1].map(k => (1 - t) * (1 - t) * from[k] + 2 * (1 - t) * t * bend[k] + t * t * to[k]);
  const edge = [0.3, 0.48, 0.66, 0.84, 1].map(t => along([-0.72, 0.08], [-0.3, 0.34], [0.08, 0.74], t))
    .concat([0.15, 0.3, 0.45, 0.6, 0.75].map(t => along([0.08, 0.74], [0.62, 0.62], [0.98, -0.02], t)));
  const lights = edge.map(([x, y]) => [s * (0.1 + (x - 0.1) * 0.86), s * (0.05 + (y - 0.05) * 0.86)]);
  paintLights(context, lights, Math.max(1.1, s * 0.045), glow, time);
  paintLook(context, s, role, {
    eyeX: s * 0.58, eyeY: -s * 0.16, eyeR: Math.max(2.6, s * 0.19),
    tipX: s * 0.95, backX: s * 0.72, mouthY: s * 0.08, teeth: 3, ink: "#1c3550"
  });
}

// Barreleye: a dark fish with a see-through dome for a head. Its green tube eyes look up through it.
function paintBarreleye(context, size, time, role) {
  const s = size;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(-s * 0.85, 0);
  context.rotate(Math.sin(time * 4.5) * 0.15);
  context.fillStyle = "#33241d";
  context.beginPath();
  context.moveTo(s * 0.06, -s * 0.07);
  context.quadraticCurveTo(-s * 0.2, -s * 0.12, -s * 0.36, -s * 0.36);
  context.quadraticCurveTo(-s * 0.26, 0, -s * 0.36, s * 0.36);
  context.quadraticCurveTo(-s * 0.2, s * 0.12, s * 0.06, s * 0.07);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = "#33241d";
  context.beginPath();
  context.moveTo(-s * 0.05, -s * 0.44);
  context.quadraticCurveTo(-s * 0.3, -s * 0.72, -s * 0.5, -s * 0.28);
  context.closePath();
  context.fill();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.92, s * 0.1);
    context.bezierCurveTo(s * 0.9, -s * 0.1, s * 0.6, -s * 0.44, s * 0.15, -s * 0.46);
    context.bezierCurveTo(-s * 0.3, -s * 0.46, -s * 0.6, -s * 0.24, -s * 0.85, -s * 0.08);
    context.lineTo(-s * 0.85, s * 0.08);
    context.bezierCurveTo(-s * 0.6, s * 0.28, -s * 0.3, s * 0.42, s * 0.15, s * 0.42);
    context.bezierCurveTo(s * 0.6, s * 0.42, s * 0.88, s * 0.28, s * 0.92, s * 0.1);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.46, 0, s * 0.42);
  skin.addColorStop(0, "#241814");
  skin.addColorStop(1, "#4a3427");
  context.fillStyle = skin;
  body();
  context.fill();
  context.strokeStyle = "rgba(210,175,140,.45)";
  context.lineWidth = Math.max(1, s * 0.03);
  body();
  context.stroke();

  // Two green tube eyes inside the head (the far one is dimmer). Each ends in a lens looking up and a little forward.
  const swing = Math.sin(time * 0.8) * 0.1, radius = s * 0.09, length = s * 0.42;
  let lens = [0, 0];
  for (const [x, y, tilt, tone, top] of [[0.24, -0.08, -1.0, "#1d5a33", "#4f9d63"], [0.36, -0.06, -1.15 + swing, "#3fae5f", "#a8ffb0"]]) {
    context.save();
    context.translate(s * x, s * y);
    context.rotate(tilt);
    const tube = context.createLinearGradient(0, 0, length, 0);
    tube.addColorStop(0, tone);
    tube.addColorStop(1, top);
    context.fillStyle = tube;
    context.beginPath();
    context.moveTo(0, -radius);
    context.lineTo(length, -radius);
    context.lineTo(length, radius);
    context.lineTo(0, radius);
    context.closePath();
    context.fill();
    context.fillStyle = top;
    context.beginPath();
    context.arc(length, 0, radius * 1.25, 0, TAU);
    context.fill();
    context.restore();
    lens = [s * x + Math.cos(tilt) * length, s * y + Math.sin(tilt) * length];
  }
  paintEye(context, lens[0], lens[1], s * 0.11);

  // The clear dome over the head, with a glint.
  const dome = context.createRadialGradient(s * 0.3, -s * 0.5, s * 0.05, s * 0.44, -s * 0.28, s * 0.5);
  dome.addColorStop(0, "rgba(210,255,240,.34)");
  dome.addColorStop(1, "rgba(150,230,220,.1)");
  context.fillStyle = dome;
  context.strokeStyle = "rgba(190,255,235,.6)";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.ellipse(s * 0.46, -s * 0.26, s * 0.48, s * 0.5, 0, 0, TAU);
  context.fill();
  context.stroke();
  context.strokeStyle = "rgba(255,255,255,.55)";
  context.beginPath();
  context.moveTo(s * 0.12, -s * 0.5);
  context.quadraticCurveTo(s * 0.18, -s * 0.68, s * 0.36, -s * 0.72);
  context.stroke();

  context.save();
  context.translate(s * 0.18, s * 0.16);
  context.rotate(0.7 + Math.sin(time * 4) * 0.2);
  context.fillStyle = "#4a3427";
  context.beginPath();
  context.ellipse(0, s * 0.12, s * 0.1, s * 0.22, 0, 0, TAU);
  context.fill();
  context.restore();

  context.fillStyle = "rgba(20,10,8,.7)";
  context.beginPath();
  context.arc(s * 0.8, s * 0.02, Math.max(1, s * 0.03), 0, TAU);
  context.fill();
  paintLook(context, s, role, {
    eyeX: lens[0], eyeY: lens[1], eyeR: s * 0.11, eye: false,
    tipX: s * 0.88, backX: s * 0.64, mouthY: s * 0.19, teeth: 3, ink: "#f0d9c0"
  });
}

// Vampire squid: a small dark red squid with a cloak of webbing between its arms, big eyes, and glowing arm tips.
function paintVampireSquid(context, size, time, role) {
  const s = size, glow = DEEP_GLOWS.vampiresquid;
  context.lineCap = "round";
  context.lineJoin = "round";

  // The sticky thread it fishes marine snow with, trailing behind.
  context.strokeStyle = "rgba(190,215,255,.7)";
  context.lineWidth = Math.max(0.8, s * 0.03);
  context.beginPath();
  tracePoints(context, wavyPoints(-s * 0.1, -s * 0.4, -2.7, s * 1.1, s * 0.3, time, 1.5));
  context.stroke();

  // The two ear fins.
  context.fillStyle = "#4d1224";
  for (const [x, y, turn] of [[-0.7, -0.45, -0.5], [-0.35, -0.55, 0.3]]) {
    context.save();
    context.translate(s * x, s * y);
    context.rotate(turn + Math.sin(time * 4 + x * 5) * 0.2);
    context.beginPath();
    context.ellipse(0, -s * 0.1, s * 0.12, s * 0.22, 0, 0, TAU);
    context.fill();
    context.restore();
  }

  // Eight arms fanning out, webbed together into a scalloped cloak, each tip glowing.
  const base = [s * 0.32, 0];
  const arms = Array.from({ length: 8 }, (_, arm) => {
    const spread = (arm - 3.5) / 3.5;
    return wavyPoints(base[0], spread * s * 0.16, spread * 0.85, s * 0.6, s * 0.06, time, arm * 0.9);
  });
  context.fillStyle = "#5c1830";
  context.strokeStyle = "rgba(150,120,255,.45)";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.moveTo(arms[0][0][0], arms[0][0][1]);
  context.lineTo(arms[0][7][0], arms[0][7][1]);
  for (let arm = 1; arm < 8; arm++) {
    const a = arms[arm - 1][7], b = arms[arm][7];
    context.quadraticCurveTo(((a[0] + b[0]) / 2) * 0.82 + base[0] * 0.18, ((a[1] + b[1]) / 2) * 0.82, b[0], b[1]);
  }
  context.lineTo(arms[7][0][0], arms[7][0][1]);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = "#8c2440";
  for (const points of arms) fillRibbon(context, points, t => s * (0.1 - 0.08 * t));
  context.strokeStyle = "rgba(160,190,255,.4)";
  context.lineWidth = Math.max(0.8, s * 0.025);
  context.beginPath();
  arms.forEach(points => tracePoints(context, points.slice(1)));
  context.stroke();

  const mantle = context.createRadialGradient(-s * 0.55, -s * 0.2, s * 0.05, -s * 0.45, 0, s * 0.7);
  mantle.addColorStop(0, "#7a1f34");
  mantle.addColorStop(1, "#22060f");
  context.fillStyle = mantle;
  context.strokeStyle = "rgba(150,120,255,.5)";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.ellipse(-s * 0.4, 0, s * 0.62, s * 0.5, 0, 0, TAU);
  context.fill();
  context.stroke();
  context.fillStyle = "#5a1226";
  context.beginPath();
  context.ellipse(s * 0.18, 0, s * 0.3, s * 0.34, 0, 0, TAU);
  context.fill();

  paintLights(context, arms.map(points => points[points.length - 1]), Math.max(1.2, s * 0.05), glow, time);
  paintLook(context, s, role, {
    eyeX: s * 0.16, eyeY: -s * 0.1, eyeR: Math.max(2.6, s * 0.2),
    tipX: s * 0.44, backX: s * 0.26, mouthY: s * 0.22, teeth: 3, ink: "#d8c8ff"
  });
}

// Comb jelly: a clear, glowing oval with rows of tiny beating hairs that shimmer like a rainbow, and two trailing threads.
function paintCombJelly(context, size, time, role) {
  const s = size, glow = DEEP_GLOWS.combjelly;
  context.lineCap = "round";
  context.lineJoin = "round";

  // Two long sticky threads with short side threads, and a little light at each tip.
  const tips = [];
  for (const [side, phase] of [[-1, 0], [1, 2]]) {
    const points = wavyPoints(-s * 0.6, side * s * 0.26, Math.PI + side * 0.25, s * 1.1, s * 0.3, time, phase, 10);
    context.strokeStyle = "rgba(210,240,255,.65)";
    context.lineWidth = Math.max(0.8, s * 0.035);
    context.beginPath();
    tracePoints(context, points);
    for (let i = 2; i < points.length; i += 2) {
      const [x, y] = points[i], [nx, ny] = points[i - 1];
      const turn = Math.atan2(y - ny, x - nx) + Math.PI / 2 * (i % 4 ? 1 : -1);
      context.moveTo(x, y);
      context.lineTo(x + Math.cos(turn) * s * 0.11, y + Math.sin(turn) * s * 0.11);
    }
    context.stroke();
    tips.push(points[points.length - 1]);
  }

  const cx = s * 0.05, rx = s * 0.85, ry = s * 0.55;
  const gel = context.createRadialGradient(cx, -ry * 0.3, ry * 0.1, cx, 0, rx);
  gel.addColorStop(0, "rgba(210,242,255,.34)");
  gel.addColorStop(1, "rgba(110,180,230,.12)");
  context.fillStyle = gel;
  context.strokeStyle = "rgba(190,235,255,.55)";
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  context.ellipse(cx, 0, rx, ry, 0, 0, TAU);
  context.fill();
  context.stroke();

  // The gut, and the little sense organ at the back.
  context.fillStyle = "rgba(255,190,220,.3)";
  context.beginPath();
  context.ellipse(cx + s * 0.2, 0, s * 0.5, s * 0.1, 0, 0, TAU);
  context.fill();
  context.fillStyle = "rgba(255,255,255,.8)";
  context.beginPath();
  context.arc(cx - rx * 0.92, 0, Math.max(1, s * 0.035), 0, TAU);
  context.fill();

  // Four rows of combs; the rainbow slides along them as the hairs beat.
  const rainbow = alpha => {
    const colours = context.createLinearGradient(-s * 0.85, 0, s * 0.95, 0);
    for (let stop = 0; stop <= 6; stop++) colours.addColorStop(stop / 6, `hsla(${(stop * 55 + time * 120) % 360},100%,68%,${alpha})`);
    return colours;
  };
  context.beginPath();
  for (const row of [-0.9, -0.38, 0.38, 0.9]) {
    for (let comb = 0; comb < 11; comb++) {
      const u = -0.82 + comb * 0.164, x = cx + rx * u, y = ry * row * Math.sqrt(1 - u * u);
      const lean = Math.sin(time * 7 - u * 6) * s * 0.05, half = s * 0.07;
      context.moveTo(x - lean * 0.5, y - half);
      context.lineTo(x + lean * 0.5, y + half);
    }
  }
  context.strokeStyle = rainbow(0.22);
  context.lineWidth = Math.max(2.4, s * 0.1);
  context.stroke();
  context.strokeStyle = rainbow(0.95);
  context.lineWidth = Math.max(1.1, s * 0.045);
  context.stroke();

  paintLights(context, tips, Math.max(1.2, s * 0.045), glow, time);
  paintLook(context, s, role, {
    eyeX: s * 0.5, eyeY: -s * 0.14, eyeR: Math.max(2.2, s * 0.11),
    tipX: s * 0.84, backX: s * 0.58, mouthY: s * 0.1, teeth: 3, ink: "rgba(245,252,255,.95)"
  });
}

// Oarfish: a very long, silver ribbon of a fish with a red crest, a red fin along its back and two oar-shaped fins.
function paintOarfish(context, size, time, role) {
  const s = size, red = "#e23b3b", count = 32;
  context.lineCap = "round";
  context.lineJoin = "round";
  const points = Array.from({ length: count + 1 }, (_, i) => {
    const u = i / count;
    return [s * (0.94 - 1.94 * u), Math.sin(u * 9 - time * 2.2) * s * (0.014 + 0.085 * u)];
  });
  const { left, right } = ribbonEdges(points, u => s * (0.03 + 0.15 * Math.pow(1 - u, 1.5)));

  // The red fin all along its back: outer edge is the top edge pushed outward.
  const outer = left.map(([x, y], i) => {
    const [px, py] = points[i], length = Math.hypot(x - px, y - py) || 1;
    return [x + (x - px) / length * s * 0.04, y + (y - py) / length * s * 0.04];
  });
  context.fillStyle = "rgba(226,59,59,.85)";
  fillEdges(context, outer, left);
  context.strokeStyle = "#ff8a78";
  context.lineWidth = Math.max(0.8, s * 0.006);
  context.beginPath();
  for (let i = 3; i < count; i += 2) {
    context.moveTo(left[i][0], left[i][1]);
    context.lineTo(outer[i][0], outer[i][1]);
  }
  context.stroke();

  context.fillStyle = "#c4d4df";
  fillEdges(context, left, right);
  context.beginPath();
  context.ellipse(s * 0.92, 0, s * 0.08, s * 0.09, 0, 0, TAU);
  context.fill();
  context.strokeStyle = "rgba(60,85,110,.3)";
  context.lineWidth = Math.max(1, s * 0.012);
  context.beginPath();
  for (let i = 4; i < count; i += 2) {
    context.moveTo(left[i][0], left[i][1]);
    context.lineTo(right[i][0], right[i][1]);
  }
  context.stroke();
  context.strokeStyle = "rgba(70,95,120,.55)";
  context.lineWidth = Math.max(1, s * 0.016);
  context.beginPath();
  tracePoints(context, right);
  context.stroke();

  // The crest: long red rays sweeping forward over the head.
  context.strokeStyle = "#ff4d3d";
  context.lineWidth = Math.max(1.4, s * 0.014);
  context.beginPath();
  for (let ray = 0; ray < 8; ray++) {
    const [x, y] = left[ray + 1], a = -Math.PI / 2 + 0.9 - ray * 0.07 + Math.sin(time * 2 + ray) * 0.1, reach = s * (0.34 - ray * 0.028);
    context.moveTo(x, y);
    context.quadraticCurveTo(x + Math.cos(a - 0.5) * reach * 0.6, y + Math.sin(a - 0.5) * reach * 0.6, x + Math.cos(a) * reach, y + Math.sin(a) * reach);
  }
  context.stroke();
  context.fillStyle = "#ff6a58";
  context.beginPath();
  for (let ray = 0; ray < 8; ray++) {
    const [x, y] = left[ray + 1], a = -Math.PI / 2 + 0.9 - ray * 0.07 + Math.sin(time * 2 + ray) * 0.1, reach = s * (0.34 - ray * 0.028);
    context.moveTo(x + Math.cos(a) * reach + s * 0.014, y + Math.sin(a) * reach);
    context.arc(x + Math.cos(a) * reach, y + Math.sin(a) * reach, Math.max(1.3, s * 0.014), 0, TAU);
  }
  context.fill();

  // The two long oar fins hanging under its throat.
  const [ox, oy] = points[3];
  for (const [lean, phase] of [[0, 0], [0.09, 1.5]]) {
    const sway = Math.sin(time * 2.5 + phase) * s * 0.05, endX = ox - s * (0.1 + lean) + sway, endY = oy + s * 0.4;
    context.strokeStyle = red;
    context.lineWidth = Math.max(1.4, s * 0.012);
    context.beginPath();
    context.moveTo(ox - lean * s, oy + s * 0.06);
    context.quadraticCurveTo(ox - s * 0.02 + sway * 0.4, oy + s * 0.22, endX, endY);
    context.stroke();
    context.fillStyle = red;
    context.beginPath();
    context.ellipse(endX, endY + s * 0.03, s * 0.03, s * 0.07, 0.3, 0, TAU);
    context.fill();
  }

  paintLook(context, s, role, {
    eyeX: s * 0.91, eyeY: -s * 0.015, eyeR: Math.max(3, s * 0.04),
    tipX: s * 0.995, backX: s * 0.92, mouthY: s * 0.04, teeth: 2, ink: "#233748"
  });
}

export const DEEP_PAINTERS = {
  marinesnow: paintMarineSnow, deepshrimp: paintDeepShrimp, lanternfish: paintLanternfish, viperfish: paintViperfish,
  giantsquid: paintGiantSquid, spermwhale: paintSpermWhale, hatchetfish: paintHatchetfish, barreleye: paintBarreleye,
  vampiresquid: paintVampireSquid, combjelly: paintCombJelly, oarfish: paintOarfish
};
