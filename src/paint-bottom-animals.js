// Cartoon drawings of the animals of the bottom: the abyssal sea floor, pitch black, cold and muddy, with a hot vent.
// Same rules as paint-deep-animals.js: drawn facing right around (0, 0), the caller mirrors for left.
// Floor animals (role "floor") stand on (0, 0), the sea bed.
// role "predator" shows a stern brow, a frown and teeth; every other role smiles. The fangtooth always shows its fangs.
// Nothing down here makes light, so the colours are pale and the outlines dark: the player's own light picks them out.
const TAU = Math.PI * 2;

// One colour per chain animal, for the HUD dot and the snack burst.
export const BOTTOM_SWATCHES = {
  amphipod: "#e8c4cf", snailfish: "#f38fa9", rattail: "#b5a68c", lizardfish: "#9a7b68", sleepershark: "#8b8f96"
};

// The vent's own warm shimmer: heat, not light made by an animal.
export const BOTTOM_GLOWS = { tubeworm: "#ff9a3c" };

// "#rrggbb" and an alpha, as an rgba() string.
function tint(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
}

function paintEye(context, x, y, radius) {
  context.fillStyle = "#fbfdf6";
  context.strokeStyle = "rgba(30,20,34,.8)";
  context.lineWidth = Math.max(0.8, radius * 0.16);
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();
  context.stroke();
  context.fillStyle = "#1c1826";
  context.beginPath();
  context.arc(x + radius * 0.25, y, radius * 0.58, 0, TAU);
  context.fill();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(x + radius * 0.42, y - radius * 0.24, radius * 0.17, 0, TAU);
  context.fill();
}

// The eye and the mouth, drawn in `ink`. The mouth runs from its tip (front) back to its corner, at height mouthY.
// eye: false when the animal draws its own eye. teeth hang from the upper lip and lowerTeeth stand up from the lower one,
// both only for a predator. curve is how deep the mouth bends, as a fraction of its length.
function paintLook(context, size, role, { eyeX, eyeY, eyeR, tipX, backX, mouthY, teeth = 4, lowerTeeth = 0, curve = 0.2, ink, eye = true }) {
  if (eye) paintEye(context, eyeX, eyeY, eyeR);
  const span = tipX - backX, midX = (tipX + backX) / 2;
  const depth = Math.max(size * 0.04, span * curve);
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
  const bendY = mouthY - depth, endY = mouthY + depth * 0.6;
  const along = t => {
    const u = 1 - t;
    return [u * u * tipX + 2 * u * t * midX + t * t * backX, u * u * mouthY + 2 * u * t * bendY + t * t * endY];
  };
  context.lineWidth = Math.max(1.2, size * 0.035);
  context.beginPath();
  context.moveTo(tipX, mouthY);
  context.quadraticCurveTo(midX, bendY, backX, endY);
  context.stroke();
  const width = Math.max(1.6, span * 0.11), height = Math.max(1.8, size * 0.07);
  context.fillStyle = "#ffffff";
  context.beginPath();
  for (let tooth = 0; tooth < teeth; tooth++) {
    const [x, y] = along((tooth + 0.7) / (teeth + 0.2));
    context.moveTo(x - width / 2, y);
    context.lineTo(x + width / 2, y);
    context.lineTo(x, y + height);
  }
  for (let tooth = 0; tooth < lowerTeeth; tooth++) {
    const [x, y] = along((tooth + 0.5) / (lowerTeeth + 0.2));
    context.moveTo(x - width / 2, y);
    context.lineTo(x + width / 2, y);
    context.lineTo(x, y - height);
  }
  context.fill();
  context.lineWidth = Math.max(1.5, size * 0.04);
  context.beginPath();
  context.moveTo(eyeX - eyeR * 1.6, eyeY - eyeR * 1.9);
  context.lineTo(eyeX + eyeR * 1.7, eyeY - eyeR * 0.7);
  context.stroke();
}

// Points along a wavy line that starts at (x, y), heads along `angle` for `length`, and sways more toward its tip.
function wavyPoints(x, y, angle, length, sway, time, phase, count = 9) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count, along = length * t, side = Math.sin(t * 3.2 - time * 2.4 + phase) * sway * t;
    return [x + Math.cos(angle) * along - Math.sin(angle) * side, y + Math.sin(angle) * along + Math.cos(angle) * side];
  });
}

// The two edges of a ribbon along `points`; widthAt gives its full width from 0 (first point) to 1 (last point).
// When the points run leftward, `left` is the top edge and `right` the bottom edge.
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

// The closed outline of a ribbon: along `first`, then back along `second`.
function traceRibbon(context, first, second) {
  context.beginPath();
  first.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
  for (let i = second.length - 1; i >= 0; i--) context.lineTo(second[i][0], second[i][1]);
  context.closePath();
}

function tracePoints(context, points) {
  points.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
}

// A frilly fin along one edge of a ribbon, from point `from` to the tip. heightAt(u) is how far it stands out.
function paintFringe(context, points, edge, from, heightAt, fill, ray, step = 2) {
  const last = points.length - 1;
  const outer = edge.map(([x, y], i) => {
    const [px, py] = points[i], length = Math.hypot(x - px, y - py) || 1, height = heightAt(i / last);
    return [x + (x - px) / length * height, y + (y - py) / length * height];
  });
  context.fillStyle = fill;
  context.beginPath();
  context.moveTo(edge[from][0], edge[from][1]);
  for (let i = from; i <= last; i++) context.lineTo(outer[i][0], outer[i][1]);
  for (let i = last; i >= from; i--) context.lineTo(edge[i][0], edge[i][1]);
  context.closePath();
  context.fill();
  context.strokeStyle = ray;
  context.beginPath();
  for (let i = from + 1; i < last; i += step) {
    context.moveTo(edge[i][0], edge[i][1]);
    context.lineTo(outer[i][0], outer[i][1]);
  }
  context.stroke();
  context.beginPath();
  tracePoints(context, outer.slice(from));
  context.stroke();
}

// Amphipod: a little pale shrimp-like animal with an arched back, plates along its body, long feelers and many legs.
function paintAmphipod(context, size, time, role) {
  const s = size, flex = Math.sin(time * 3) * 0.05;
  const head = [s * 0.62, -s * 0.02], bend = [-s * 0.15, -s * (0.92 - flex)], tail = [-s * 0.98, s * (0.3 + flex * 2)];
  const at = t => [0, 1].map(k => (1 - t) * (1 - t) * head[k] + 2 * (1 - t) * t * bend[k] + t * t * tail[k]);
  const angle = t => Math.atan2(2 * (1 - t) * (bend[1] - head[1]) + 2 * t * (tail[1] - bend[1]),
    2 * (1 - t) * (bend[0] - head[0]) + 2 * t * (tail[0] - bend[0]));
  const ink = "#8a5468", pale = "#efd6dc", rose = "#e2bcc8";
  context.lineCap = "round";
  context.lineJoin = "round";

  // Two pairs of feelers, the long pair waving.
  context.strokeStyle = "#d19fb0";
  context.lineWidth = Math.max(0.8, s * 0.05);
  context.beginPath();
  tracePoints(context, wavyPoints(head[0] + s * 0.1, head[1] - s * 0.15, -0.65, s * 1.05, s * 0.3, time, 0, 8));
  context.stroke();
  context.beginPath();
  tracePoints(context, wavyPoints(head[0] + s * 0.16, head[1] - s * 0.05, -0.15, s * 0.6, s * 0.2, time, 2, 6));
  context.stroke();

  // Legs beating under the belly, and the three little spikes of the tail.
  context.strokeStyle = "#c48da0";
  context.lineWidth = Math.max(0.9, s * 0.07);
  context.beginPath();
  for (let leg = 0; leg < 6; leg++) {
    const t = 0.16 + leg * 0.11, [x, y] = at(t), a = angle(t), wave = Math.sin(time * 9 + leg * 1.1) * s * 0.09;
    context.moveTo(x + Math.sin(a) * s * 0.12, y - Math.cos(a) * s * 0.12);
    context.lineTo(x + Math.sin(a) * s * 0.46 + wave, y - Math.cos(a) * s * 0.46);
  }
  context.stroke();
  const [tx, ty] = at(0.97);
  context.beginPath();
  for (const turn of [-0.7, -0.15, 0.4]) {
    context.moveTo(tx, ty);
    context.lineTo(tx - Math.cos(turn) * s * 0.32, ty - Math.sin(turn) * s * 0.32 + s * 0.06);
  }
  context.stroke();

  // The body: plates from the tail forward, then the head.
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.8, s * 0.045);
  for (let plate = 0; plate < 8; plate++) {
    const t = 0.9 - plate * 0.1, [x, y] = at(t), a = angle(t), rise = s * (0.11 + 0.17 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.04)));
    context.fillStyle = plate % 2 ? rose : pale;
    context.beginPath();
    context.ellipse(x, y, s * 0.17, rise, a, 0, TAU);
    context.fill();
    context.stroke();
  }
  const [hx, hy] = at(0.05);
  context.fillStyle = pale;
  context.beginPath();
  context.ellipse(hx, hy, s * 0.36, s * 0.3, 0.1, 0, TAU);
  context.fill();
  context.stroke();
  paintLook(context, s, role, {
    eyeX: hx + s * 0.13, eyeY: hy - s * 0.06, eyeR: Math.max(2.2, s * 0.2),
    tipX: hx + s * 0.34, backX: hx + s * 0.12, mouthY: hy + s * 0.2, teeth: 2, ink
  });
}

// Snailfish: a soft, pink, see-through tadpole of a fish with a round head, a frilly fin all along its body and a little sucker under its chin.
function paintSnailfish(context, size, time, role) {
  const s = size, count = 40, ink = "#8f4a63", fin = "rgba(246,168,190,.8)", ray = "rgba(160,80,110,.4)";
  context.lineCap = "round";
  context.lineJoin = "round";
  const points = Array.from({ length: count + 1 }, (_, i) => {
    const u = i / count;
    return [s * (0.9 - 1.95 * u), Math.sin(u * 6 - time * 4) * s * 0.11 * u];
  });
  const widthAt = u => u < 0.14 ? s * 0.84 * Math.sqrt(1 - Math.pow((0.14 - u) / 0.14, 2))
    : s * (0.84 * Math.pow(1 - (u - 0.14) / 0.86, 1.5) + 0.05);
  const { left, right } = ribbonEdges(points, widthAt);

  // The frill along the back and belly, rippling.
  context.lineWidth = Math.max(0.8, s * 0.03);
  const frill = u => s * (0.09 * Math.min(1, (u - 0.2) / 0.3)) * (1 + Math.sin(u * 20 - time * 6) * 0.15);
  paintFringe(context, points, left, 8, frill, fin, ray, 3);
  paintFringe(context, points, right, 8, frill, fin, ray, 3);

  const skin = context.createLinearGradient(0, -s * 0.45, 0, s * 0.45);
  skin.addColorStop(0, "#e89db2");
  skin.addColorStop(0.5, "#f7c8d2");
  skin.addColorStop(1, "#fde9ea");
  context.fillStyle = skin;
  traceRibbon(context, left, right);
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, s * 0.04);
  context.stroke();

  // Soft see-through insides, a shine along the flank, and the sucker under the chin.
  context.fillStyle = "rgba(205,110,145,.3)";
  context.beginPath();
  context.ellipse(s * 0.12, s * 0.06, s * 0.3, s * 0.13, 0, 0, TAU);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.6)";
  context.lineWidth = Math.max(1, s * 0.05);
  context.beginPath();
  tracePoints(context, points.slice(8, 26));
  context.stroke();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.8, s * 0.03);
  context.beginPath();
  context.ellipse(s * 0.44, s * 0.37, s * 0.1, s * 0.04, 0, 0, TAU);
  context.stroke();
  paintLook(context, s, role, {
    eyeX: s * 0.6, eyeY: -s * 0.1, eyeR: Math.max(2.3, s * 0.15),
    tipX: s * 0.86, backX: s * 0.66, mouthY: s * 0.13, teeth: 3, ink: "#7a3a52"
  });
}

// Rattail: a grey-brown fish with a huge head, a big eye, a chin whisker and a long tail that tapers to a thread.
function paintRattail(context, size, time, role) {
  const s = size, count = 44, ink = "#3d352c", fin = "rgba(122,111,95,.85)", ray = "rgba(60,50,40,.6)";
  context.lineCap = "round";
  context.lineJoin = "round";
  const points = Array.from({ length: count + 1 }, (_, i) => {
    const u = i / count;
    return [s * (0.98 - 2.5 * u), Math.sin(u * 5 - time * 2.2) * s * 0.14 * u * u];
  });
  const widthAt = u => u < 0.2 ? s * 0.92 * Math.pow(Math.sin(u / 0.2 * Math.PI / 2), 0.7) : s * (0.92 * Math.pow(1 - (u - 0.2) / 0.8, 2.6) + 0.03);
  const { left, right } = ribbonEdges(points, widthAt);
  const index = u => Math.round(u * count);

  // The long, low fins that run along the tail and meet at its tip.
  context.lineWidth = Math.max(0.8, s * 0.02);
  paintFringe(context, points, left, index(0.45), u => s * 0.11 * (1 - u), fin, ray, 3);
  paintFringe(context, points, right, index(0.4), u => s * 0.15 * (1 - u), fin, ray, 3);

  // The tall first fin behind the head.
  const [bx, by] = left[index(0.27)], [ex, ey] = left[index(0.43)], sway = Math.sin(time * 2) * s * 0.03;
  context.fillStyle = fin;
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.moveTo(bx, by);
  context.lineTo(bx - s * 0.12 + sway, by - s * 0.58);
  context.quadraticCurveTo(ex + s * 0.05, ey - s * 0.3, ex, ey);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = ray;
  context.lineWidth = Math.max(0.8, s * 0.018);
  context.beginPath();
  for (let r = 1; r < 4; r++) {
    context.moveTo(bx + (ex - bx) * r / 4, by + (ey - by) * r / 4);
    context.lineTo(bx - s * 0.1 + sway + (ex - bx + s * 0.16) * r / 5, by - s * 0.5 + (ey - by + s * 0.4) * r / 5 + s * 0.1);
  }
  context.stroke();

  const skin = context.createLinearGradient(0, -s * 0.45, 0, s * 0.45);
  skin.addColorStop(0, "#8a7e6d");
  skin.addColorStop(0.5, "#ab9e88");
  skin.addColorStop(1, "#d6ccb6");
  context.fillStyle = skin;
  traceRibbon(context, left, right);
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, s * 0.035);
  context.stroke();

  // A lateral line, the edge of the gill cover, the pectoral fin, and the whisker under the chin.
  context.strokeStyle = "rgba(60,50,40,.4)";
  context.lineWidth = Math.max(0.8, s * 0.02);
  context.beginPath();
  tracePoints(context, points.slice(index(0.24), index(0.9)).map(([x, y]) => [x, y - s * 0.02]));
  context.moveTo(s * 0.32, -s * 0.34);
  context.quadraticCurveTo(s * 0.22, 0, s * 0.3, s * 0.3);
  context.stroke();
  context.save();
  context.translate(s * 0.3, s * 0.14);
  context.rotate(0.75 + Math.sin(time * 4) * 0.15);
  context.fillStyle = "#8e8270";
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.8, s * 0.03);
  context.beginPath();
  context.ellipse(s * 0.14, 0, s * 0.2, s * 0.07, 0, 0, TAU);
  context.fill();
  context.stroke();
  context.restore();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.8, s * 0.025);
  context.beginPath();
  context.moveTo(s * 0.6, s * 0.27);
  context.quadraticCurveTo(s * 0.58 + Math.sin(time * 2) * s * 0.03, s * 0.36, s * 0.55, s * 0.44);
  context.stroke();
  paintLook(context, s, role, {
    eyeX: s * 0.56, eyeY: -s * 0.08, eyeR: Math.max(2.8, s * 0.16),
    tipX: s * 0.82, backX: s * 0.5, mouthY: s * 0.2, teeth: 4, curve: 0.12, ink
  });
}

// Deep-sea lizardfish: a long brown-grey fish with a flat, lizard-like head, eyes on top, a tall back fin and long stiff belly fins to prop itself up.
function paintLizardfish(context, size, time, role) {
  const s = size, ink = "#2f2622", fin = "#6c5f55", finRim = "rgba(240,224,200,.55)";
  context.lineCap = "round";
  context.lineJoin = "round";

  // The forked tail, swishing.
  context.save();
  context.translate(-s * 0.86, 0);
  context.rotate(Math.sin(time * 3.5) * 0.13);
  context.fillStyle = fin;
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, s * 0.025);
  context.beginPath();
  context.moveTo(s * 0.06, -s * 0.05);
  context.quadraticCurveTo(-s * 0.12, -s * 0.12, -s * 0.34, -s * 0.34);
  context.quadraticCurveTo(-s * 0.24, -s * 0.1, -s * 0.2, 0);
  context.quadraticCurveTo(-s * 0.24, s * 0.1, -s * 0.34, s * 0.34);
  context.quadraticCurveTo(-s * 0.12, s * 0.12, s * 0.06, s * 0.05);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = finRim;
  context.beginPath();
  context.moveTo(-s * 0.1, -s * 0.12);
  context.lineTo(-s * 0.3, -s * 0.31);
  context.moveTo(-s * 0.1, s * 0.12);
  context.lineTo(-s * 0.3, s * 0.31);
  context.stroke();
  context.restore();

  // The tall back fin, and a small fatty one near the tail.
  context.fillStyle = fin;
  context.strokeStyle = ink;
  context.beginPath();
  context.moveTo(s * 0.3, -s * 0.24);
  context.lineTo(s * 0.02, -s * 0.62);
  context.quadraticCurveTo(-s * 0.14, -s * 0.42, -s * 0.28, -s * 0.24);
  context.closePath();
  context.moveTo(-s * 0.52, -s * 0.17);
  context.quadraticCurveTo(-s * 0.58, -s * 0.3, -s * 0.68, -s * 0.12);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = finRim;
  context.beginPath();
  for (const [x, top] of [[0.2, 0.5], [0.1, 0.56], [-0.02, 0.5], [-0.14, 0.42]]) {
    context.moveTo(s * x, -s * 0.25);
    context.lineTo(s * (x - 0.06), -s * top);
  }
  context.stroke();

  // Two long stiff belly fins it props itself up on.
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, s * 0.025);
  for (const [x, foot, tone] of [[0.22, 0.12, "#5d5148"], [-0.02, -0.16, fin]]) {
    context.fillStyle = tone;
    context.beginPath();
    context.moveTo(s * x, s * 0.22);
    context.lineTo(s * foot, s * 0.56);
    context.lineTo(s * (x - 0.14), s * 0.24);
    context.closePath();
    context.fill();
    context.stroke();
  }

  const body = () => {
    context.beginPath();
    context.moveTo(s * 1.0, s * 0.03);
    context.bezierCurveTo(s * 0.9, -s * 0.1, s * 0.7, -s * 0.15, s * 0.5, -s * 0.19);
    context.bezierCurveTo(s * 0.25, -s * 0.24, -s * 0.1, -s * 0.27, -s * 0.4, -s * 0.2);
    context.bezierCurveTo(-s * 0.6, -s * 0.15, -s * 0.75, -s * 0.09, -s * 0.9, -s * 0.06);
    context.lineTo(-s * 0.9, s * 0.06);
    context.bezierCurveTo(-s * 0.72, s * 0.1, -s * 0.55, s * 0.17, -s * 0.35, s * 0.21);
    context.bezierCurveTo(-s * 0.05, s * 0.28, s * 0.35, s * 0.26, s * 0.6, s * 0.18);
    context.bezierCurveTo(s * 0.8, s * 0.14, s * 0.95, s * 0.11, s * 1.0, s * 0.03);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.27, 0, s * 0.27);
  skin.addColorStop(0, "#66584e");
  skin.addColorStop(0.5, "#8b7c6d");
  skin.addColorStop(1, "#d0c4b0");
  context.fillStyle = skin;
  body();
  context.fill();
  context.save();
  body();
  context.clip();
  context.fillStyle = "rgba(48,36,32,.3)";
  for (const [x, y, r] of [[0.3, -0.16, 0.07], [0.05, -0.2, 0.06], [-0.2, -0.17, 0.07], [-0.45, -0.13, 0.06], [-0.65, -0.08, 0.05], [0.18, -0.08, 0.05], [-0.32, -0.05, 0.05]]) {
    context.beginPath();
    context.ellipse(s * x, s * y, s * r * 1.4, s * r, 0, 0, TAU);
    context.fill();
  }
  context.restore();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.2, s * 0.03);
  body();
  context.stroke();
  context.strokeStyle = "rgba(245,230,205,.5)";
  context.lineWidth = Math.max(1, s * 0.025);
  context.beginPath();
  context.moveTo(s * 0.62, -s * 0.16);
  context.bezierCurveTo(s * 0.3, -s * 0.25, -s * 0.15, -s * 0.28, -s * 0.5, -s * 0.18);
  context.stroke();

  context.save();
  context.translate(s * 0.4, s * 0.14);
  context.rotate(0.7 + Math.sin(time * 4) * 0.15);
  context.fillStyle = fin;
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.8, s * 0.02);
  context.beginPath();
  context.ellipse(0, s * 0.1, s * 0.06, s * 0.17, 0, 0, TAU);
  context.fill();
  context.stroke();
  context.restore();
  paintLook(context, s, role, {
    eyeX: s * 0.68, eyeY: -s * 0.09, eyeR: Math.max(2.6, s * 0.09),
    tipX: s * 0.97, backX: s * 0.42, mouthY: s * 0.09, teeth: 8, lowerTeeth: 7, curve: 0.07, ink
  });
}

// Sleeper shark: a big, stout grey-brown shark with a blunt snout, small eyes, two small back fins and a long upper tail lobe.
function paintSleeperShark(context, size, time, role) {
  const s = size, ink = "#3d3630", fin = "#766d66";
  context.lineCap = "round";
  context.lineJoin = "round";

  // The tail, swinging slowly.
  context.save();
  context.translate(-s * 0.94, 0);
  context.rotate(Math.sin(time * 1.6) * 0.09);
  context.fillStyle = fin;
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.2, s * 0.02);
  context.beginPath();
  context.moveTo(s * 0.06, -s * 0.06);
  context.bezierCurveTo(-s * 0.1, -s * 0.16, -s * 0.22, -s * 0.34, -s * 0.36, -s * 0.46);
  context.bezierCurveTo(-s * 0.3, -s * 0.28, -s * 0.2, -s * 0.12, -s * 0.2, -s * 0.02);
  context.bezierCurveTo(-s * 0.2, s * 0.08, -s * 0.22, s * 0.16, -s * 0.3, s * 0.22);
  context.bezierCurveTo(-s * 0.14, s * 0.12, -s * 0.04, s * 0.08, s * 0.06, s * 0.06);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();

  // Two small back fins, a small belly fin and a small fin under the tail.
  context.fillStyle = fin;
  context.beginPath();
  context.moveTo(s * 0.02, -s * 0.27);
  context.quadraticCurveTo(-s * 0.08, -s * 0.44, -s * 0.22, -s * 0.44);
  context.quadraticCurveTo(-s * 0.26, -s * 0.34, -s * 0.34, -s * 0.24);
  context.closePath();
  context.moveTo(-s * 0.5, -s * 0.2);
  context.quadraticCurveTo(-s * 0.56, -s * 0.34, -s * 0.68, -s * 0.34);
  context.quadraticCurveTo(-s * 0.68, -s * 0.24, -s * 0.72, -s * 0.16);
  context.closePath();
  context.moveTo(-s * 0.36, s * 0.22);
  context.lineTo(-s * 0.58, s * 0.34);
  context.lineTo(-s * 0.5, s * 0.2);
  context.closePath();
  context.moveTo(-s * 0.64, s * 0.14);
  context.lineTo(-s * 0.8, s * 0.26);
  context.lineTo(-s * 0.78, s * 0.08);
  context.closePath();
  context.fill();
  context.stroke();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 1.0, s * 0.06);
    context.bezierCurveTo(s * 0.96, -s * 0.1, s * 0.75, -s * 0.2, s * 0.5, -s * 0.24);
    context.bezierCurveTo(s * 0.2, -s * 0.28, -s * 0.2, -s * 0.26, -s * 0.55, -s * 0.2);
    context.bezierCurveTo(-s * 0.72, -s * 0.16, -s * 0.85, -s * 0.09, -s * 0.96, -s * 0.06);
    context.lineTo(-s * 0.96, s * 0.05);
    context.bezierCurveTo(-s * 0.8, s * 0.1, -s * 0.6, s * 0.18, -s * 0.35, s * 0.23);
    context.bezierCurveTo(-s * 0.05, s * 0.28, s * 0.4, s * 0.26, s * 0.7, s * 0.2);
    context.bezierCurveTo(s * 0.88, s * 0.17, s * 1.0, s * 0.12, s * 1.0, s * 0.06);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.28, 0, s * 0.28);
  skin.addColorStop(0, "#736c66");
  skin.addColorStop(0.5, "#948d86");
  skin.addColorStop(1, "#cbc4ba");
  context.fillStyle = skin;
  body();
  context.fill();
  context.save();
  body();
  context.clip();
  context.fillStyle = "rgba(40,34,30,.16)";
  for (const [x, y, r] of [[0.1, -0.12, 0.05], [-0.15, -0.08, 0.04], [-0.4, -0.1, 0.05], [0.3, -0.05, 0.035], [-0.6, -0.05, 0.035], [-0.05, 0.02, 0.03]]) {
    context.beginPath();
    context.arc(s * x, s * y, s * r, 0, TAU);
    context.fill();
  }
  context.restore();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.4, s * 0.02);
  body();
  context.stroke();
  context.strokeStyle = "rgba(255,255,255,.22)";
  context.lineWidth = Math.max(1, s * 0.02);
  context.beginPath();
  context.moveTo(s * 0.6, -s * 0.2);
  context.bezierCurveTo(s * 0.2, -s * 0.27, -s * 0.2, -s * 0.24, -s * 0.5, -s * 0.18);
  context.stroke();

  // Five gill slits, and a small pectoral fin.
  context.strokeStyle = "rgba(45,38,34,.5)";
  context.lineWidth = Math.max(1, s * 0.014);
  context.beginPath();
  for (let slit = 0; slit < 5; slit++) {
    const x = s * (0.5 - slit * 0.045);
    context.moveTo(x, -s * 0.11);
    context.quadraticCurveTo(x - s * 0.03, 0, x, s * 0.11);
  }
  context.stroke();
  context.save();
  context.translate(s * 0.28, s * 0.22);
  context.rotate(0.55 + Math.sin(time * 1.6) * 0.1);
  context.fillStyle = "#7f766f";
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, s * 0.018);
  context.beginPath();
  context.ellipse(s * 0.1, 0, s * 0.22, s * 0.07, 0, 0, TAU);
  context.fill();
  context.stroke();
  context.restore();

  context.fillStyle = "rgba(40,34,30,.6)";
  context.beginPath();
  context.arc(s * 0.94, -s * 0.03, Math.max(1, s * 0.012), 0, TAU);
  context.fill();
  paintLook(context, s, role, {
    eyeX: s * 0.72, eyeY: -s * 0.06, eyeR: Math.max(2.8, s * 0.058),
    tipX: s * 0.97, backX: s * 0.62, mouthY: s * 0.1, teeth: 6, curve: 0.13, ink
  });
}

// Fangtooth: a small black fish with a big head and enormous fangs. Its long lower fangs reach up past its snout.
function paintFangtooth(context, size, time, role) {
  const s = size, rim = "#a4a2b8", ink = "#141319";
  context.lineCap = "round";
  context.lineJoin = "round";

  // The small forked tail, swishing.
  context.save();
  context.translate(-s * 0.84, 0);
  context.rotate(Math.sin(time * 6) * 0.17);
  context.fillStyle = "#33323c";
  context.strokeStyle = rim;
  context.lineWidth = Math.max(0.8, s * 0.035);
  context.beginPath();
  context.moveTo(s * 0.08, -s * 0.05);
  context.lineTo(-s * 0.32, -s * 0.38);
  context.quadraticCurveTo(-s * 0.2, 0, -s * 0.32, s * 0.38);
  context.lineTo(s * 0.08, s * 0.05);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();

  // Back fin, belly fin and a small pectoral fin.
  context.fillStyle = "#33323c";
  context.beginPath();
  context.moveTo(-s * 0.2, -s * 0.46);
  context.quadraticCurveTo(-s * 0.34, -s * 0.78, -s * 0.56, -s * 0.72);
  context.quadraticCurveTo(-s * 0.6, -s * 0.4, -s * 0.66, -s * 0.2);
  context.closePath();
  context.moveTo(-s * 0.3, s * 0.34);
  context.quadraticCurveTo(-s * 0.46, s * 0.62, -s * 0.66, s * 0.5);
  context.quadraticCurveTo(-s * 0.68, s * 0.24, -s * 0.72, s * 0.08);
  context.closePath();
  context.fill();
  context.stroke();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.98, s * 0.02);
    context.bezierCurveTo(s * 0.95, -s * 0.22, s * 0.7, -s * 0.44, s * 0.38, -s * 0.5);
    context.bezierCurveTo(s * 0.05, -s * 0.55, -s * 0.3, -s * 0.42, -s * 0.6, -s * 0.2);
    context.bezierCurveTo(-s * 0.72, -s * 0.13, -s * 0.8, -s * 0.07, -s * 0.86, -s * 0.05);
    context.lineTo(-s * 0.86, s * 0.05);
    context.bezierCurveTo(-s * 0.75, s * 0.1, -s * 0.62, s * 0.2, -s * 0.4, s * 0.3);
    context.bezierCurveTo(-s * 0.1, s * 0.45, s * 0.3, s * 0.46, s * 0.6, s * 0.36);
    context.bezierCurveTo(s * 0.85, s * 0.28, s * 0.98, s * 0.16, s * 0.98, s * 0.02);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.5, 0, s * 0.46);
  skin.addColorStop(0, "#43424f");
  skin.addColorStop(0.55, "#2c2b35");
  skin.addColorStop(1, "#4c4b5b");
  context.fillStyle = skin;
  body();
  context.fill();
  context.strokeStyle = rim;
  context.lineWidth = Math.max(1, s * 0.04);
  body();
  context.stroke();
  context.strokeStyle = "rgba(170,168,190,.35)";
  context.lineWidth = Math.max(0.8, s * 0.03);
  context.beginPath();
  context.moveTo(s * 0.3, -s * 0.36);
  context.quadraticCurveTo(s * 0.1, -s * 0.05, s * 0.2, s * 0.3);
  context.moveTo(s * 0.62, -s * 0.34);
  context.quadraticCurveTo(s * 0.5, -s * 0.28, s * 0.42, -s * 0.34);
  context.stroke();

  context.save();
  context.translate(s * 0.14, s * 0.3);
  context.rotate(0.75 + Math.sin(time * 5) * 0.2);
  context.fillStyle = "#3a3945";
  context.strokeStyle = rim;
  context.lineWidth = Math.max(0.8, s * 0.03);
  context.beginPath();
  context.ellipse(0, s * 0.1, s * 0.07, s * 0.2, 0, 0, TAU);
  context.fill();
  context.stroke();
  context.restore();

  // The dark gape, a row of small teeth in each jaw, and the great fangs: two lower ones reaching up past the snout, two upper ones hanging down.
  context.strokeStyle = "#0a090d";
  context.lineWidth = Math.max(1.4, s * 0.045);
  context.beginPath();
  context.moveTo(s * 0.96, s * 0.12);
  context.lineTo(s * 0.24, s * 0.2);
  context.stroke();
  context.fillStyle = "#fff8e4";
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.7, s * 0.02);
  context.beginPath();
  const lip = x => s * 0.12 + (s * 0.96 - x) / (s * 0.72) * s * 0.08;
  for (let tooth = 0; tooth < 6; tooth++) {
    const x = s * (0.86 - tooth * 0.1), lower = x - s * 0.05;
    context.moveTo(x - s * 0.03, lip(x));
    context.lineTo(x + s * 0.03, lip(x));
    context.lineTo(x, lip(x) + s * 0.09);
    context.moveTo(lower - s * 0.03, lip(lower));
    context.lineTo(lower + s * 0.03, lip(lower));
    context.lineTo(lower, lip(lower) - s * 0.08);
  }
  context.fill();
  context.beginPath();
  context.moveTo(s * 0.86, s * 0.16);
  context.quadraticCurveTo(s * 1.0, -s * 0.1, s * 0.94, -s * 0.44);
  context.quadraticCurveTo(s * 0.8, -s * 0.12, s * 0.76, s * 0.16);
  context.closePath();
  context.moveTo(s * 0.7, s * 0.17);
  context.quadraticCurveTo(s * 0.78, -s * 0.02, s * 0.76, -s * 0.3);
  context.quadraticCurveTo(s * 0.62, -s * 0.06, s * 0.6, s * 0.17);
  context.closePath();
  context.moveTo(s * 0.62, s * 0.2);
  context.quadraticCurveTo(s * 0.66, s * 0.36, s * 0.56, s * 0.5);
  context.quadraticCurveTo(s * 0.5, s * 0.34, s * 0.48, s * 0.21);
  context.closePath();
  context.fill();
  context.stroke();
  paintLook(context, s, role, {
    eyeX: s * 0.5, eyeY: -s * 0.14, eyeR: Math.max(2.8, s * 0.15),
    tipX: s * 0.96, backX: s * 0.24, mouthY: s * 0.14, teeth: 0, curve: 0.05, ink: "#d4d2e6"
  });
}

// Sea pig: a pink sea cucumber that walks across the mud on stubby legs, with feelers around its mouth and a few horns on its back.
function paintSeaPig(context, size, time, role) {
  const s = size, ink = "#9c5468", rose = "#e995aa";
  context.lineCap = "round";
  context.lineJoin = "round";

  // The stubby legs, stepping in turn.
  context.strokeStyle = ink;
  context.fillStyle = rose;
  context.lineWidth = Math.max(1, s * 0.035);
  for (let leg = 0; leg < 6; leg++) {
    const x = s * (0.78 - leg * 0.31), phase = time * 3 + leg * 1.3, lift = Math.max(0, Math.sin(phase)) * s * 0.09;
    const reach = Math.cos(phase) * s * 0.05, far = leg % 2 ? 0.75 : 1;
    context.save();
    context.translate(x + reach, -lift);
    context.scale(far, far);
    context.beginPath();
    context.moveTo(-s * 0.07, -s * 0.4);
    context.lineTo(-s * 0.06, -s * 0.05);
    context.quadraticCurveTo(0, s * 0.02, s * 0.06, -s * 0.05);
    context.lineTo(s * 0.07, -s * 0.4);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  // The body: a soft dome with a hood at the front.
  const sway = Math.sin(time * 3) * s * 0.012;
  const body = () => {
    context.beginPath();
    context.moveTo(-s * 0.98, -s * 0.4);
    context.bezierCurveTo(-s * 1.02, -s * 0.86, -s * 0.6, -s * (1.04 + sway), -s * 0.05, -s * (1.04 + sway));
    context.bezierCurveTo(s * 0.55, -s * 1.04, s * 1.04, -s * 0.9, s * 1.08, -s * 0.55);
    context.bezierCurveTo(s * 1.1, -s * 0.38, s * 0.9, -s * 0.3, s * 0.6, -s * 0.32);
    context.bezierCurveTo(s * 0.1, -s * 0.28, -s * 0.5, -s * 0.28, -s * 0.98, -s * 0.4);
    context.closePath();
  };
  // Horns on its back, tipped with round knobs.
  context.fillStyle = "#e58aa2";
  for (const [x, lean, phase] of [[0.42, 0.1, 0], [0.08, -0.05, 1.5], [-0.3, -0.16, 3]]) {
    const wave = Math.sin(time * 2 + phase) * s * 0.03;
    context.beginPath();
    context.moveTo(s * (x - 0.07), -s * 0.88);
    context.quadraticCurveTo(s * (x + lean * 0.5) + wave, -s * 1.06, s * (x + lean) + wave, -s * 1.22);
    context.quadraticCurveTo(s * (x + lean * 0.5 + 0.03) + wave, -s * 1.04, s * (x + 0.07), -s * 0.88);
    context.closePath();
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(s * (x + lean) + wave, -s * 1.22, s * 0.05, 0, TAU);
    context.fill();
    context.stroke();
  }
  const skin = context.createLinearGradient(0, -s, 0, -s * 0.3);
  skin.addColorStop(0, "#f3b3c1");
  skin.addColorStop(0.6, "#f9cdd4");
  skin.addColorStop(1, "#e79cad");
  context.fillStyle = skin;
  body();
  context.fill();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.2, s * 0.04);
  body();
  context.stroke();
  context.strokeStyle = "rgba(255,255,255,.55)";
  context.lineWidth = Math.max(1, s * 0.05);
  context.beginPath();
  context.moveTo(-s * 0.62, -s * 0.72);
  context.quadraticCurveTo(-s * 0.2, -s * 0.94, s * 0.3, -s * 0.9);
  context.stroke();
  context.fillStyle = "rgba(196,100,125,.28)";
  context.beginPath();
  for (const [x, y, r] of [[-0.5, -0.5, 0.06], [-0.2, -0.62, 0.05], [-0.7, -0.62, 0.045], [0.1, -0.5, 0.05]]) {
    context.moveTo(s * (x + r), s * y);
    context.arc(s * x, s * y, s * r, 0, TAU);
  }
  context.fill();

  // The feelers around its mouth, waving.
  context.strokeStyle = "#e58aa2";
  context.lineWidth = Math.max(1.2, s * 0.06);
  context.beginPath();
  for (let feeler = 0; feeler < 5; feeler++) {
    const y = -s * (0.5 - feeler * 0.06), wave = Math.sin(time * 3 + feeler) * s * 0.03;
    context.moveTo(s * 1.06, y);
    context.quadraticCurveTo(s * 1.18, y + wave, s * (1.26 + feeler * 0.01), y + s * 0.06 + wave);
  }
  context.stroke();
  paintLook(context, s, role, {
    eyeX: s * 0.7, eyeY: -s * 0.62, eyeR: Math.max(2.4, s * 0.12),
    tipX: s * 1.0, backX: s * 0.78, mouthY: -s * 0.4, teeth: 3, curve: 0.15, ink
  });
}

// Tripod fish: a pale fish held up off the mud on three long, stiff fins, facing the current with two long feelers held out like hands.
function paintTripodFish(context, size, time, role) {
  const s = size, ink = "#6f6a78", pale = "#e6e2e6";
  context.lineCap = "round";
  context.lineJoin = "round";
  const bob = Math.sin(time * 1.3) * s * 0.02;

  // The three legs: a far belly fin, a near belly fin and the long tail, each tapering to a point on the mud.
  const legs = [[s * 0.28, -s * 1.42, s * 0.62, 0, "#cfcad4"], [s * 0.4, -s * 1.38, s * 0.98, 0, pale], [-s * 0.62, -s * 1.5, -s * 1.0, 0, pale]];
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.9, s * 0.03);
  for (const [x0, y0, x1, y1, tone] of legs) {
    const dx = x1 - x0, dy = y1 - y0, length = Math.hypot(dx, dy), nx = -dy / length, ny = dx / length;
    context.fillStyle = tone;
    context.beginPath();
    context.moveTo(x0 + nx * s * 0.07, y0 + ny * s * 0.07 + bob);
    context.lineTo(x1, y1);
    context.lineTo(x0 - nx * s * 0.07, y0 - ny * s * 0.07 + bob);
    context.closePath();
    context.fill();
    context.stroke();
    context.beginPath();
    for (let ring = 1; ring < 7; ring++) {
      const t = ring / 7, x = x0 + dx * t, y = y0 + dy * t + bob * (1 - t), half = s * 0.07 * (1 - t);
      context.moveTo(x + nx * half, y + ny * half);
      context.lineTo(x - nx * half, y - ny * half);
    }
    context.stroke();
  }

  // The body, tilted a little with its head up into the current.
  context.save();
  context.translate(s * 0.1, -s * 1.56 + bob);
  context.rotate(-0.1);
  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.98, s * 0.02);
    context.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.5, -s * 0.34, s * 0.1, -s * 0.32);
    context.bezierCurveTo(-s * 0.3, -s * 0.3, -s * 0.55, -s * 0.16, -s * 0.72, -s * 0.05);
    context.lineTo(-s * 0.72, s * 0.05);
    context.bezierCurveTo(-s * 0.55, s * 0.12, -s * 0.3, s * 0.28, s * 0.1, s * 0.29);
    context.bezierCurveTo(s * 0.5, s * 0.3, s * 0.9, s * 0.22, s * 0.98, s * 0.02);
    context.closePath();
  };
  // A little tail fin and back fin.
  context.fillStyle = "#d8d3dc";
  context.strokeStyle = ink;
  context.lineWidth = Math.max(0.9, s * 0.03);
  context.beginPath();
  context.moveTo(-s * 0.64, -s * 0.05);
  context.lineTo(-s * 0.9, -s * 0.24);
  context.quadraticCurveTo(-s * 0.84, 0, -s * 0.9, s * 0.24);
  context.lineTo(-s * 0.64, s * 0.05);
  context.closePath();
  context.moveTo(-s * 0.1, -s * 0.3);
  context.quadraticCurveTo(-s * 0.3, -s * 0.56, -s * 0.5, -s * 0.2);
  context.closePath();
  context.fill();
  context.stroke();
  const skin = context.createLinearGradient(0, -s * 0.32, 0, s * 0.3);
  skin.addColorStop(0, "#c4bfcc");
  skin.addColorStop(0.5, "#e8e4ea");
  skin.addColorStop(1, "#f7f5f4");
  context.fillStyle = skin;
  body();
  context.fill();
  context.stroke();
  context.strokeStyle = "rgba(255,255,255,.7)";
  context.lineWidth = Math.max(1, s * 0.04);
  context.beginPath();
  context.moveTo(s * 0.6, -s * 0.2);
  context.quadraticCurveTo(s * 0.1, -s * 0.28, -s * 0.4, -s * 0.12);
  context.stroke();
  paintLook(context, s, role, {
    eyeX: s * 0.64, eyeY: -s * 0.08, eyeR: Math.max(2.4, s * 0.1),
    tipX: s * 0.94, backX: s * 0.72, mouthY: s * 0.1, teeth: 3, curve: 0.12, ink: "#5d5867"
  });
  context.restore();

  // Two long feelers held out ahead of its head, waving in the current.
  context.strokeStyle = "#cbc6d0";
  context.lineWidth = Math.max(0.9, s * 0.035);
  for (const [tilt, length, phase] of [[-0.75, 1.15, 0], [-0.35, 1.0, 2]]) {
    context.beginPath();
    tracePoints(context, wavyPoints(s * 0.45, -s * 1.7 + bob, tilt, s * length, s * 0.14, time, phase, 8));
    context.stroke();
  }
}

// Giant isopod: a big pale purple-grey armoured animal like a pill bug, with a ridged shell, big eyes, long feelers and many legs.
function paintGiantIsopod(context, size, time, role) {
  const s = size, ink = "#4b4062";
  context.lineCap = "round";
  context.lineJoin = "round";

  // Seven pairs of legs, stepping in turn, and the feelers.
  context.strokeStyle = "#7a6d92";
  context.lineWidth = Math.max(1.2, s * 0.09);
  context.beginPath();
  for (let leg = 0; leg < 7; leg++) {
    const x = s * (0.7 - leg * 0.22), phase = time * 3 + leg * 0.9, step = Math.sin(phase) * s * 0.06, lift = Math.max(0, Math.cos(phase)) * s * 0.04;
    context.moveTo(x, -s * 0.22);
    context.lineTo(x - s * 0.04 + step * 0.5, -s * 0.1 - lift);
    context.lineTo(x - s * 0.08 + step, -lift);
  }
  context.stroke();
  context.lineWidth = Math.max(0.9, s * 0.045);
  for (const [tilt, length, phase] of [[-0.8, 1.05, 0], [-0.3, 0.9, 1.6]]) {
    context.beginPath();
    tracePoints(context, wavyPoints(s * 0.95, -s * 0.5, tilt, s * length, s * 0.16, time, phase, 8));
    context.stroke();
  }

  // The little fan at the tail.
  context.fillStyle = "#8f83a6";
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.moveTo(-s * 0.9, -s * 0.34);
  context.lineTo(-s * 1.2, -s * 0.26);
  context.lineTo(-s * 1.08, -s * 0.16);
  context.lineTo(-s * 1.2, -s * 0.06);
  context.lineTo(-s * 0.9, -s * 0.16);
  context.closePath();
  context.fill();
  context.stroke();

  // The shell, striped in plates.
  const shell = () => {
    context.beginPath();
    context.moveTo(-s * 1.02, -s * 0.2);
    context.bezierCurveTo(-s * 1.02, -s * 0.62, -s * 0.55, -s * 0.86, -s * 0.05, -s * 0.86);
    context.bezierCurveTo(s * 0.5, -s * 0.86, s * 0.92, -s * 0.66, s * 0.98, -s * 0.34);
    context.lineTo(s * 0.96, -s * 0.18);
    context.lineTo(-s * 1.02, -s * 0.2);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.86, 0, -s * 0.16);
  skin.addColorStop(0, "#c9bfda");
  skin.addColorStop(0.55, "#a99dc0");
  skin.addColorStop(1, "#7f7398");
  context.fillStyle = skin;
  shell();
  context.fill();
  context.save();
  shell();
  context.clip();
  context.strokeStyle = "rgba(75,64,98,.7)";
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  for (let plate = 0; plate < 8; plate++) {
    const x = s * (0.55 - plate * 0.2);
    context.moveTo(x + s * 0.16, -s * 1.0);
    context.quadraticCurveTo(x - s * 0.02, -s * 0.5, x - s * 0.14, -s * 0.12);
  }
  context.stroke();
  context.fillStyle = "rgba(255,255,255,.15)";
  context.beginPath();
  for (let plate = 0; plate < 8; plate += 2) {
    const x = s * (0.55 - plate * 0.2);
    context.moveTo(x + s * 0.16, -s * 1.0);
    context.quadraticCurveTo(x - s * 0.02, -s * 0.5, x - s * 0.14, -s * 0.12);
    context.lineTo(x - s * 0.34, -s * 0.12);
    context.quadraticCurveTo(x - s * 0.22, -s * 0.5, x - s * 0.04, -s * 1.0);
    context.closePath();
  }
  context.fill();
  context.restore();
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.2, s * 0.04);
  shell();
  context.stroke();
  context.strokeStyle = "rgba(255,255,255,.5)";
  context.lineWidth = Math.max(1, s * 0.04);
  context.beginPath();
  context.moveTo(-s * 0.75, -s * 0.62);
  context.quadraticCurveTo(-s * 0.3, -s * 0.8, s * 0.3, -s * 0.76);
  context.stroke();

  // The head, with its big eye.
  context.fillStyle = "#b7abcb";
  context.strokeStyle = ink;
  context.beginPath();
  context.ellipse(s * 0.8, -s * 0.4, s * 0.28, s * 0.25, 0, 0, TAU);
  context.fill();
  context.stroke();
  paintLook(context, s, role, {
    eyeX: s * 0.78, eyeY: -s * 0.46, eyeR: Math.max(2.6, s * 0.15),
    tipX: s * 1.0, backX: s * 0.8, mouthY: -s * 0.27, teeth: 3, curve: 0.15, ink
  });
}

// Tube worms at a hot vent: a dark chimney breathing dark smoke and a warm shimmer, and in front of it a clump of white tubes with red plumes.
function paintTubeWorm(context, size, time, role) {
  const s = size, glow = BOTTOM_GLOWS.tubeworm, mouth = [-s * 0.32, -s * 1.9], beat = 0.75 + Math.sin(time * 2) * 0.25;
  context.lineCap = "round";
  context.lineJoin = "round";

  // A low mound of rock around the foot of the chimney.
  context.fillStyle = "#4a3c39";
  context.strokeStyle = "#241a1b";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.ellipse(-s * 0.3, -s * 0.03, s * 1.2, s * 0.13, 0, Math.PI, TAU);
  context.closePath();
  context.fill();
  context.stroke();

  // The chimney: a crusty tower of dark rock, narrowing to a hot mouth.
  const chimney = () => {
    context.beginPath();
    context.moveTo(-s * 0.98, 0);
    context.bezierCurveTo(-s * 0.84, -s * 0.6, -s * 0.8, -s * 1.2, -s * 0.72, -s * 1.9);
    context.lineTo(s * 0.08, -s * 1.9);
    context.bezierCurveTo(s * 0.1, -s * 1.2, s * 0.24, -s * 0.6, s * 0.44, 0);
    context.closePath();
  };
  const rock = context.createLinearGradient(-s, 0, s * 0.4, 0);
  rock.addColorStop(0, "#5a4844");
  rock.addColorStop(0.5, "#7a6259");
  rock.addColorStop(1, "#3f322f");
  context.fillStyle = rock;
  chimney();
  context.fill();
  context.strokeStyle = "#20181a";
  context.lineWidth = Math.max(1.2, s * 0.04);
  chimney();
  context.stroke();
  context.strokeStyle = "rgba(190,160,140,.35)";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  for (const [x, y, w] of [[-0.85, -0.35, 0.2], [-0.5, -0.7, 0.16], [-0.72, -1.1, 0.14], [-0.3, -0.45, 0.22], [-0.2, -1.05, 0.12], [-0.5, -1.5, 0.14], [-0.15, -1.55, 0.13]]) {
    context.moveTo(s * x, s * y);
    context.quadraticCurveTo(s * (x + w / 2), s * (y - 0.06), s * (x + w), s * y);
  }
  context.stroke();
  context.fillStyle = "#1b1416";
  context.strokeStyle = "#9a7f72";
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  context.ellipse(mouth[0], mouth[1], s * 0.38, s * 0.1, 0, 0, TAU);
  context.fill();
  context.stroke();

  // The warm shimmer at the mouth: an orange glow and wavering heat lines rising from it.
  const halo = context.createRadialGradient(mouth[0], mouth[1], 0, mouth[0], mouth[1], s * 1.1);
  halo.addColorStop(0, tint(glow, 0.6 * beat));
  halo.addColorStop(0.4, tint(glow, 0.22 * beat));
  halo.addColorStop(1, tint(glow, 0));
  context.fillStyle = halo;
  context.beginPath();
  context.arc(mouth[0], mouth[1], s * 1.1, 0, TAU);
  context.fill();
  context.strokeStyle = tint(glow, 0.5);
  context.lineWidth = Math.max(1, s * 0.03);
  for (const [x, phase] of [[-0.5, 0], [-0.32, 2], [-0.14, 4]]) {
    context.beginPath();
    tracePoints(context, wavyPoints(mouth[0] + s * (x + 0.32), mouth[1] - s * 0.1, -Math.PI / 2, s * 0.55, s * 0.09, time * 1.6, phase, 8));
    context.stroke();
  }

  // Dark smoke puffing up, growing and fading as it rises.
  for (let puff = 0; puff < 9; puff++) {
    const rise = (time * 0.25 + puff / 9) % 1, x = mouth[0] + Math.sin(rise * 5 + puff * 2) * s * 0.14 + rise * s * 0.16;
    const y = mouth[1] - s * 0.1 - rise * s * 1.5, r = s * (0.18 + 0.36 * rise), fade = 1 - rise;
    const billow = context.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    billow.addColorStop(0, `rgba(118,110,130,${0.9 * fade})`);
    billow.addColorStop(1, `rgba(46,41,54,${0.75 * fade})`);
    context.fillStyle = billow;
    context.beginPath();
    context.arc(x, y, r, 0, TAU);
    context.fill();
  }

  // The tubes, tallest at the back: each a white tube with rings, topped by a fan of red plume.
  const clump = [[-0.6, 0.62, 0.04], [-0.38, 0.85, -0.05], [-0.14, 0.5, 0.06], [0.06, 0.75, 0.03], [0.26, 0.45, -0.07], [0.48, 0.66, 0.05], [0.7, 0.4, -0.04], [0.9, 0.55, 0.07]];
  clump.forEach(([x, height, lean], index) => {
    const foot = [s * x, 0], top = [s * (x + lean), -s * height], control = [s * (x - lean * 0.4), -s * height * 0.5];
    const trace = () => {
      context.beginPath();
      context.moveTo(foot[0], foot[1]);
      context.quadraticCurveTo(control[0], control[1], top[0], top[1]);
    };
    context.strokeStyle = "#6b655c";
    context.lineWidth = Math.max(3.5, s * 0.2);
    trace();
    context.stroke();
    context.strokeStyle = "#f6f2e8";
    context.lineWidth = Math.max(2.5, s * 0.16);
    trace();
    context.stroke();
    context.strokeStyle = "rgba(150,142,128,.6)";
    context.lineWidth = Math.max(0.8, s * 0.02);
    context.beginPath();
    for (let ring = 1; ring < 5; ring++) {
      const t = ring / 5, u = 1 - t, rx = u * u * foot[0] + 2 * u * t * control[0] + t * t * top[0], ry = u * u * foot[1] + 2 * u * t * control[1] + t * t * top[1];
      context.moveTo(rx - s * 0.06, ry + s * 0.02);
      context.lineTo(rx + s * 0.06, ry - s * 0.02);
    }
    context.stroke();
    const spread = s * 0.34;
    for (const [tone, scale] of [["#d61f3c", 1], ["#ff6d6d", 0.62]]) {
      context.fillStyle = tone;
      context.strokeStyle = "#7a0e22";
      context.lineWidth = Math.max(0.7, s * 0.02);
      for (let petal = -2; petal <= 2; petal++) {
        const angle = -Math.PI / 2 + petal * 0.34 + lean + Math.sin(time * 2 + index + petal) * 0.07;
        const length = spread * scale * (petal % 2 ? 0.85 : 1);
        context.beginPath();
        context.ellipse(top[0] + Math.cos(angle) * length * 0.55, top[1] + Math.sin(angle) * length * 0.55, length * 0.6, spread * 0.17 * scale, angle, 0, TAU);
        context.fill();
        if (scale === 1) context.stroke();
      }
    }
  });
}

// Dumbo octopus: a round pink octopus with two big ear-like fins that flap, a round eye, and its arms joined by a web like a trailing cape.
function paintDumboOctopus(context, size, time, role) {
  const s = size, ink = "#a24a68", flap = Math.sin(time * 5) * 0.3;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.save();
  context.translate(0, -s * 0.18);

  // An ear-like fin: a rounded paddle on a short stalk, turned by `turn` and flapping.
  const ear = (x, y, turn, scale, tone, inner) => {
    context.save();
    context.translate(s * x, s * y);
    context.rotate(turn + flap);
    context.fillStyle = tone;
    context.strokeStyle = ink;
    context.lineWidth = Math.max(1, s * 0.04);
    context.beginPath();
    context.ellipse(s * 0.3 * scale, 0, s * 0.34 * scale, s * 0.2 * scale, 0, 0, TAU);
    context.fill();
    context.stroke();
    context.fillStyle = inner;
    context.beginPath();
    context.ellipse(s * 0.32 * scale, 0, s * 0.22 * scale, s * 0.11 * scale, 0, 0, TAU);
    context.fill();
    context.strokeStyle = "rgba(162,74,104,.45)";
    context.lineWidth = Math.max(0.8, s * 0.02);
    context.beginPath();
    for (const rib of [-1, 0, 1]) {
      context.moveTo(s * 0.08 * scale, 0);
      context.lineTo(s * 0.5 * scale, s * 0.1 * scale * rib);
    }
    context.stroke();
    context.restore();
  };
  ear(-0.4, -0.4, -2.4, 0.9, "#d97a98", "#eaa0b7");

  // The web of the arms: eight arms fan out from under the head, joined by a scalloped web that ripples.
  const root = [s * 0.05, s * 0.3];
  const tips = Array.from({ length: 8 }, (_, i) => {
    const angle = (42 + i * 18) * Math.PI / 180, reach = s * (0.95 - i * 0.01) + Math.sin(time * 3 + i * 0.8) * s * 0.05;
    return [root[0] + Math.cos(angle) * reach, root[1] + Math.sin(angle) * reach];
  });
  const web = context.createLinearGradient(0, 0, 0, s * 1.0);
  web.addColorStop(0, "#f29fb9");
  web.addColorStop(1, "#f9cbd7");
  context.fillStyle = web;
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1, s * 0.04);
  context.beginPath();
  context.moveTo(root[0], root[1]);
  context.lineTo(tips[0][0], tips[0][1]);
  for (let arm = 1; arm < 8; arm++) {
    const [ax, ay] = tips[arm - 1], [bx, by] = tips[arm];
    context.quadraticCurveTo(root[0] + ((ax + bx) / 2 - root[0]) * 0.62, root[1] + ((ay + by) / 2 - root[1]) * 0.62, bx, by);
  }
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = "rgba(162,74,104,.4)";
  context.lineWidth = Math.max(0.8, s * 0.025);
  context.beginPath();
  for (const [x, y] of tips) {
    context.moveTo(root[0], root[1]);
    context.lineTo(x + (root[0] - x) * 0.06, y + (root[1] - y) * 0.06);
  }
  context.stroke();

  // The round head, with a shine and a few freckles.
  const head = context.createRadialGradient(-s * 0.2, -s * 0.4, s * 0.05, -s * 0.05, -s * 0.1, s * 0.7);
  head.addColorStop(0, "#fbc4d3");
  head.addColorStop(1, "#ee93ae");
  context.fillStyle = head;
  context.strokeStyle = ink;
  context.lineWidth = Math.max(1.2, s * 0.045);
  context.beginPath();
  context.ellipse(-s * 0.05, -s * 0.12, s * 0.64, s * 0.55, 0, 0, TAU);
  context.fill();
  context.stroke();
  context.fillStyle = "rgba(196,90,125,.25)";
  context.beginPath();
  for (const [x, y, r] of [[-0.45, -0.1, 0.06], [-0.3, 0.1, 0.05], [-0.2, -0.3, 0.05], [-0.55, -0.32, 0.04]]) {
    context.moveTo(s * (x + r), s * y);
    context.arc(s * x, s * y, s * r, 0, TAU);
  }
  context.fill();
  ear(-0.18, -0.46, -2.0, 1.05, "#f18fae", "#f9c1d2");
  paintLook(context, s, role, {
    eyeX: s * 0.3, eyeY: -s * 0.1, eyeR: Math.max(2.8, s * 0.19),
    tipX: s * 0.58, backX: s * 0.42, mouthY: s * 0.22, teeth: 2, curve: 0.2, ink
  });
  context.restore();
}

export const BOTTOM_PAINTERS = {
  amphipod: paintAmphipod, snailfish: paintSnailfish, rattail: paintRattail, lizardfish: paintLizardfish,
  sleepershark: paintSleeperShark, fangtooth: paintFangtooth, seapig: paintSeaPig, tripodfish: paintTripodFish,
  giantisopod: paintGiantIsopod, tubeworm: paintTubeWorm, dumbooctopus: paintDumboOctopus
};
