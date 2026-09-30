// Cartoon drawings of the coral reef animals; registered into PAINTERS by animal-paint.js.
// Same rules as animal-paint.js: drawn facing right around (0, 0), the caller mirrors for left, and floor
// animals stand on (0, 0), the sea bed. role "predator" shows a stern brow, a frown and teeth; every other role smiles.
const TAU = Math.PI * 2;

// One colour per chain animal, for the HUD dot and the snack burst.
export const REEF_SWATCHES = {
  damselfish: "#2f86e8", lionfish: "#c6432f", grouper: "#a08355", reefshark: "#8ea3b3", tigershark: "#87867a"
};

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

// The eye and the mouth. The mouth runs from its tip (front) back to its corner, at height mouthY.
function paintLook(context, size, role, { eyeX, eyeY, eyeR, tipX, backX, mouthY, teeth = 4 }) {
  paintEye(context, eyeX, eyeY, eyeR);
  const span = tipX - backX, midX = (tipX + backX) / 2;
  const depth = Math.max(size * 0.05, span * 0.2);
  context.lineCap = "round";
  if (role !== "predator") {
    context.strokeStyle = "rgba(20,55,70,.65)";
    context.lineWidth = Math.max(1, size * 0.03);
    context.beginPath();
    context.moveTo(tipX, mouthY);
    context.quadraticCurveTo(midX, mouthY + depth, backX, mouthY - depth * 0.3);
    context.stroke();
    return;
  }
  context.strokeStyle = "#3b1a22";
  context.lineWidth = Math.max(1.2, size * 0.035);
  context.beginPath();
  context.moveTo(tipX, mouthY);
  context.quadraticCurveTo(midX, mouthY - depth, backX, mouthY + depth * 0.6);
  context.stroke();
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
  context.strokeStyle = "#173b52";
  context.lineWidth = Math.max(1.5, size * 0.04);
  context.beginPath();
  context.moveTo(eyeX - eyeR * 1.6, eyeY - eyeR * 1.9);
  context.lineTo(eyeX + eyeR * 1.7, eyeY - eyeR * 0.7);
  context.stroke();
}

// A fan of rays, each [baseX, baseY, tipX, tipY]: a thin skin between them, then the rays in two colours.
function paintRays(context, rays, width, skin, dark, light) {
  context.fillStyle = skin;
  context.beginPath();
  rays.forEach(([, , x, y], index) => (index ? context.lineTo(x, y) : context.moveTo(x, y)));
  for (let index = rays.length - 1; index >= 0; index--) context.lineTo(rays[index][0], rays[index][1]);
  context.closePath();
  context.fill();
  context.lineWidth = width;
  context.strokeStyle = dark;
  context.beginPath();
  for (const [bx, by, tx, ty] of rays) {
    context.moveTo(bx, by);
    context.lineTo(tx, ty);
  }
  context.stroke();
  context.strokeStyle = light;
  context.lineWidth = width * 0.5;
  context.beginPath();
  rays.forEach(([bx, by, tx, ty], index) => {
    if (index % 2) return;
    context.moveTo(bx, by);
    context.lineTo(tx, ty);
  });
  context.stroke();
}

// Damselfish: a round, bright blue body with a yellow tail and fins, a big eye and a tiny mouth.
function paintDamselfish(context, size, time, role) {
  const s = size, yellow = "#ffd23f";
  const wag = Math.sin(time * 9) * 0.2;
  context.lineJoin = "round";
  context.lineCap = "round";

  context.save();
  context.translate(-s * 0.72, 0);
  context.rotate(wag);
  context.fillStyle = yellow;
  context.beginPath();
  context.moveTo(s * 0.1, -s * 0.08);
  context.quadraticCurveTo(-s * 0.35, -s * 0.2, -s * 0.62, -s * 0.5);
  context.quadraticCurveTo(-s * 0.44, 0, -s * 0.62, s * 0.5);
  context.quadraticCurveTo(-s * 0.35, s * 0.2, s * 0.1, s * 0.08);
  context.closePath();
  context.fill();
  context.restore();

  // A long fin down the back and a small one under the tummy.
  context.fillStyle = yellow;
  context.beginPath();
  context.moveTo(-s * 0.6, -s * 0.4);
  context.quadraticCurveTo(-s * 0.15, -s * 1.02, s * 0.36, -s * 0.5);
  context.closePath();
  context.moveTo(-s * 0.1, s * 0.52);
  context.quadraticCurveTo(-s * 0.3, s * 0.92, -s * 0.5, s * 0.5);
  context.closePath();
  context.fill();

  const body = () => {
    context.beginPath();
    context.ellipse(0, 0, s * 0.9, s * 0.62, 0, 0, TAU);
  };
  const water = context.createLinearGradient(0, -s * 0.62, 0, s * 0.62);
  water.addColorStop(0, "#1755c9");
  water.addColorStop(0.55, "#2f8cf0");
  water.addColorStop(1, "#6cd0ff");
  context.fillStyle = water;
  body();
  context.fill();
  context.save();
  body();
  context.clip();
  context.fillStyle = yellow;
  context.beginPath();
  context.moveTo(-s * 0.32, -s * 0.7);
  context.quadraticCurveTo(-s * 0.5, 0, -s * 0.32, s * 0.7);
  context.lineTo(-s, s * 0.7);
  context.lineTo(-s, -s * 0.7);
  context.fill();
  context.restore();
  context.fillStyle = "rgba(255,255,255,.35)";
  context.beginPath();
  context.ellipse(s * 0.12, -s * 0.36, s * 0.34, s * 0.09, -0.15, 0, TAU);
  context.fill();
  context.strokeStyle = "rgba(10,40,100,.45)";
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  context.moveTo(s * 0.34, -s * 0.3);
  context.quadraticCurveTo(s * 0.24, 0, s * 0.34, s * 0.3);
  context.stroke();

  context.save();
  context.translate(s * 0.2, s * 0.12);
  context.rotate(Math.sin(time * 8) * 0.3);
  context.fillStyle = "rgba(255,214,70,.9)";
  context.beginPath();
  context.ellipse(-s * 0.12, 0, s * 0.2, s * 0.1, 0, 0, TAU);
  context.fill();
  context.restore();

  paintLook(context, s, role, {
    eyeX: s * 0.5, eyeY: -s * 0.14, eyeR: Math.max(2.2, s * 0.17),
    tipX: s * 0.88, backX: s * 0.64, mouthY: s * 0.1, teeth: 3
  });
}

// Lionfish: red-brown and cream stripes, tall venomous spines on its back and big feathery fins like a mane.
function paintLionfish(context, size, time, role) {
  const s = size, dark = "#8f2b20", cream = "#f6e8d6";
  const flutter = Math.sin(time * 2.2);
  const skin = "rgba(240,190,160,.42)";
  context.lineCap = "round";
  context.lineJoin = "round";

  // The far side fin, then the tall spines along the back.
  paintRays(context, Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI * (0.62 + i * 0.05) - flutter * 0.05;
    return [s * 0.3, s * 0.06, s * 0.3 + Math.cos(a) * s * 0.85, s * 0.06 + Math.sin(a) * s * 0.85];
  }), Math.max(1, s * 0.04), "rgba(214,120,96,.3)", dark, cream);
  paintRays(context, Array.from({ length: 9 }, (_, i) => {
    const bx = s * (0.5 - i * 0.1), by = -s * (0.36 - Math.max(0, 0.3 - bx / s) * 0.12);
    const a = -Math.PI / 2 - 0.4, reach = s * (0.78 - i * 0.04);
    return [bx, by, bx + Math.cos(a) * reach + Math.sin(time * 2 + i * 0.5) * s * 0.03, by + Math.sin(a) * reach];
  }), Math.max(1, s * 0.04), skin, dark, cream);

  // A fan of a tail and a small fin under the tail end.
  context.save();
  context.translate(-s * 0.84, 0);
  context.rotate(Math.sin(time * 6) * 0.15);
  paintRays(context, Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI + (i - 3) * 0.17;
    return [0, (i - 3) * s * 0.02, Math.cos(a) * s * 0.52, Math.sin(a) * s * 0.52];
  }), Math.max(1, s * 0.04), skin, dark, cream);
  context.restore();
  paintRays(context, Array.from({ length: 4 }, (_, i) => {
    const bx = -s * (0.2 + i * 0.13);
    return [bx, s * 0.2, bx - s * 0.1, s * 0.5];
  }), Math.max(1, s * 0.035), skin, dark, cream);

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.96, s * 0.06);
    context.bezierCurveTo(s * 0.94, -s * 0.14, s * 0.7, -s * 0.34, s * 0.3, -s * 0.36);
    context.bezierCurveTo(-s * 0.15, -s * 0.36, -s * 0.55, -s * 0.22, -s * 0.86, -s * 0.1);
    context.lineTo(-s * 0.86, s * 0.1);
    context.bezierCurveTo(-s * 0.55, s * 0.22, -s * 0.15, s * 0.38, s * 0.3, s * 0.36);
    context.bezierCurveTo(s * 0.7, s * 0.34, s * 0.94, s * 0.24, s * 0.96, s * 0.06);
    context.closePath();
  };
  context.fillStyle = "#b8402c";
  body();
  context.fill();
  context.save();
  body();
  context.clip();
  context.fillStyle = cream;
  context.strokeStyle = dark;
  context.lineWidth = Math.max(0.8, s * 0.02);
  for (let band = 0; band < 6; band++) {
    const x = s * (0.66 - band * 0.24), width = s * (0.09 + (band % 2) * 0.02);
    context.beginPath();
    context.moveTo(x, -s * 0.5);
    context.lineTo(x + width, -s * 0.5);
    context.lineTo(x + width - s * 0.06, s * 0.5);
    context.lineTo(x - s * 0.06, s * 0.5);
    context.closePath();
    context.fill();
    context.stroke();
  }
  context.restore();

  // The near fin, like a feathery mane hanging behind the shoulder.
  paintRays(context, Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI * (0.55 + i * 0.05) + flutter * 0.04;
    const reach = s * (0.95 - i * 0.03);
    return [s * 0.28, s * 0.08, s * 0.28 + Math.cos(a) * reach, s * 0.08 + Math.sin(a) * reach];
  }), Math.max(1, s * 0.04), "rgba(246,214,190,.4)", dark, cream);

  // The little tentacle over its eye.
  const eyeX = s * 0.64, eyeY = -s * 0.1, eyeR = Math.max(2.3, s * 0.085);
  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(eyeX - s * 0.04, eyeY - eyeR);
  context.lineTo(eyeX + s * 0.02, eyeY - eyeR - s * 0.13);
  context.lineTo(eyeX + s * 0.08, eyeY - eyeR * 0.9);
  context.fill();
  paintLook(context, s, role, { eyeX, eyeY, eyeR, tipX: s * 0.95, backX: s * 0.62, mouthY: s * 0.13 });
}

// Grouper: a chunky, mottled brown fish with a huge mouth and a tall spiny fin.
function paintGrouper(context, size, time, role) {
  const s = size, fin = "#7c6340", dark = "#5e4a2e";
  const wag = Math.sin(time * 4);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(-s * 0.82, 0);
  context.rotate(wag * 0.13);
  context.fillStyle = fin;
  context.strokeStyle = dark;
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.moveTo(s * 0.06, -s * 0.14);
  context.bezierCurveTo(-s * 0.25, -s * 0.2, -s * 0.55, -s * 0.55, -s * 0.62, -s * 0.4);
  context.bezierCurveTo(-s * 0.5, -s * 0.15, -s * 0.5, s * 0.15, -s * 0.62, s * 0.4);
  context.bezierCurveTo(-s * 0.55, s * 0.55, -s * 0.25, s * 0.2, s * 0.06, s * 0.14);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();

  // The tall fin along its back: sharp spikes in front, soft and round behind.
  context.fillStyle = fin;
  context.beginPath();
  context.moveTo(s * 0.58, -s * 0.46);
  for (let spike = 0; spike < 4; spike++) {
    context.lineTo(s * (0.5 - spike * 0.16), -s * (0.74 + spike * 0.02));
    context.lineTo(s * (0.42 - spike * 0.16), -s * 0.56);
  }
  context.quadraticCurveTo(-s * 0.3, -s * 1.0, -s * 0.66, -s * 0.4);
  context.lineTo(-s * 0.5, -s * 0.3);
  context.lineTo(s * 0.5, -s * 0.36);
  context.closePath();
  context.fill();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.98, s * 0.14);
    context.bezierCurveTo(s * 0.98, -s * 0.25, s * 0.6, -s * 0.62, s * 0.1, -s * 0.62);
    context.bezierCurveTo(-s * 0.4, -s * 0.62, -s * 0.72, -s * 0.35, -s * 0.86, -s * 0.16);
    context.lineTo(-s * 0.86, s * 0.16);
    context.bezierCurveTo(-s * 0.72, s * 0.4, -s * 0.4, s * 0.6, s * 0.1, s * 0.58);
    context.bezierCurveTo(s * 0.55, s * 0.58, s * 0.9, s * 0.4, s * 0.98, s * 0.14);
    context.closePath();
  };
  const skin = context.createLinearGradient(0, -s * 0.62, 0, s * 0.58);
  skin.addColorStop(0, "#8b6d44");
  skin.addColorStop(0.55, "#a88a5a");
  skin.addColorStop(1, "#e0d3ac");
  context.fillStyle = skin;
  body();
  context.fill();
  context.save();
  body();
  context.clip();
  context.fillStyle = "rgba(70,52,30,.5)";
  for (const [x, y, rx, ry, turn] of [[0.5, -0.3, 0.16, 0.1, 0.4], [0.15, -0.38, 0.2, 0.11, -0.2], [-0.2, -0.28, 0.17, 0.12, 0.5],
    [-0.5, -0.2, 0.15, 0.1, -0.3], [0.3, 0, 0.13, 0.08, 0.1], [-0.05, 0.05, 0.16, 0.09, -0.4], [-0.4, 0.1, 0.13, 0.08, 0.3],
    [0.62, 0.02, 0.1, 0.07, 0]]) {
    context.beginPath();
    context.ellipse(s * x, s * y, s * rx, s * ry, turn, 0, TAU);
    context.fill();
  }
  context.fillStyle = "rgba(245,232,190,.7)";
  for (const [x, y] of [[0.4, -0.15], [0.05, -0.16], [-0.3, -0.05], [-0.6, -0.05], [0.2, 0.2], [-0.1, 0.22], [-0.45, 0.25]]) {
    context.beginPath();
    context.arc(s * x, s * y, Math.max(1, s * 0.03), 0, TAU);
    context.fill();
  }
  context.restore();

  context.strokeStyle = "rgba(60,44,24,.55)";
  context.lineWidth = Math.max(1, s * 0.035);
  context.beginPath();
  context.moveTo(s * 0.4, -s * 0.42);
  context.quadraticCurveTo(s * 0.28, -s * 0.05, s * 0.4, s * 0.4);
  context.stroke();

  context.save();
  context.translate(s * 0.22, s * 0.16);
  context.rotate(0.6 + Math.sin(time * 3.5) * 0.15);
  context.fillStyle = fin;
  context.beginPath();
  context.ellipse(0, s * 0.18, s * 0.13, s * 0.22, 0, 0, TAU);
  context.fill();
  context.restore();

  // A big mouth: its corner reaches back under the eye, and it hangs a little open.
  const gape = s * (0.05 + Math.max(0, Math.sin(time * 1.6)) * 0.04);
  context.fillStyle = "#4a2320";
  context.beginPath();
  context.moveTo(s * 0.97, s * 0.18);
  context.quadraticCurveTo(s * 0.7, s * 0.18 + gape * 2, s * 0.42, s * 0.18);
  context.quadraticCurveTo(s * 0.7, s * 0.16, s * 0.97, s * 0.18);
  context.fill();
  paintLook(context, s, role, {
    eyeX: s * 0.6, eyeY: -s * 0.2, eyeR: Math.max(2.5, s * 0.09),
    tipX: s * 0.97, backX: s * 0.42, mouthY: s * 0.18, teeth: 5
  });
}

// A shark's fin: filled in the body colour, then its tip cut out in black.
// The tip is everything beyond the line through (x, y) that is pushed along (dx, dy).
function paintBlackTip(context, trace, x, y, dx, dy, reach) {
  const length = Math.hypot(dx, dy), ux = dx / length * reach, uy = dy / length * reach;
  context.save();
  trace();
  context.clip();
  context.fillStyle = "#1b2127";
  context.beginPath();
  context.moveTo(x - uy, y + ux);
  context.lineTo(x + uy, y - ux);
  context.lineTo(x + uy + ux, y - ux + uy);
  context.lineTo(x - uy + ux, y + ux + uy);
  context.fill();
  context.restore();
}

// Reef shark: a slim blacktip. Grey back, white belly, and black tips on every fin.
function paintReefShark(context, size, time, role) {
  const s = size, back = "#8ea3b3", belly = "#f3f6f7";
  const beat = Math.sin(time * 4.5), tailY = beat * s * 0.05;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(-s * 0.86, tailY);
  context.rotate(Math.sin(time * 4.5 - 0.7) * 0.16);
  const tail = () => {
    context.beginPath();
    context.moveTo(s * 0.08, -s * 0.06);
    context.quadraticCurveTo(-s * 0.3, -s * 0.3, -s * 0.62, -s * 0.62);
    context.quadraticCurveTo(-s * 0.42, -s * 0.2, -s * 0.22, -s * 0.01);
    context.quadraticCurveTo(-s * 0.4, s * 0.2, -s * 0.46, s * 0.36);
    context.quadraticCurveTo(-s * 0.15, s * 0.16, s * 0.08, s * 0.06);
    context.closePath();
  };
  context.fillStyle = back;
  tail();
  context.fill();
  paintBlackTip(context, tail, -s * 0.36, -s * 0.4, -0.78, -0.62, s * 2);
  paintBlackTip(context, tail, -s * 0.34, s * 0.2, -0.55, 0.84, s * 2);
  context.restore();

  const dorsal = () => {
    context.beginPath();
    context.moveTo(s * 0.2, -s * 0.24);
    context.quadraticCurveTo(s * 0.06, -s * 0.6, -s * 0.14, -s * 0.92);
    context.quadraticCurveTo(-s * 0.1, -s * 0.52, -s * 0.3, -s * 0.22);
    context.closePath();
  };
  context.fillStyle = back;
  dorsal();
  context.fill();
  paintBlackTip(context, dorsal, -s * 0.02, -s * 0.66, -0.2, -1, s * 2);
  context.beginPath();
  context.moveTo(-s * 0.5, -s * 0.14);
  context.lineTo(-s * 0.62, -s * 0.28);
  context.lineTo(-s * 0.64, -s * 0.1);
  context.closePath();
  context.fill();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.96, s * 0.05);
    context.bezierCurveTo(s * 0.92, -s * 0.1, s * 0.6, -s * 0.27, s * 0.22, -s * 0.28);
    context.bezierCurveTo(-s * 0.25, -s * 0.29, -s * 0.62, -s * 0.16, -s * 0.9, tailY - s * 0.04);
    context.lineTo(-s * 0.9, tailY + s * 0.04);
    context.bezierCurveTo(-s * 0.6, s * 0.14, -s * 0.2, s * 0.25, s * 0.22, s * 0.24);
    context.bezierCurveTo(s * 0.6, s * 0.22, s * 0.9, s * 0.16, s * 0.96, s * 0.05);
    context.closePath();
  };
  context.fillStyle = belly;
  body();
  context.fill();
  context.save();
  body();
  context.clip();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(s, s * 0.04);
  context.quadraticCurveTo(s * 0.3, s * 0.1, -s * 0.3, s * 0.03);
  context.quadraticCurveTo(-s * 0.7, 0, -s, tailY);
  context.lineTo(-s, -s * 0.5);
  context.lineTo(s, -s * 0.5);
  context.fill();
  context.restore();

  context.strokeStyle = "rgba(60,72,84,.5)";
  context.lineWidth = Math.max(1, s * 0.022);
  context.beginPath();
  for (let slit = 0; slit < 4; slit++) {
    const x = s * (0.42 + slit * 0.05);
    context.moveTo(x, -s * 0.1);
    context.quadraticCurveTo(x - s * 0.03, s * 0.02, x, s * 0.11);
  }
  context.stroke();

  context.save();
  context.translate(s * 0.34, s * 0.12);
  context.rotate(0.95 + beat * 0.1);
  const fin = () => {
    context.beginPath();
    context.moveTo(-s * 0.09, 0);
    context.quadraticCurveTo(-s * 0.06, s * 0.3, s * 0.02, s * 0.42);
    context.quadraticCurveTo(s * 0.13, s * 0.2, s * 0.09, 0);
    context.closePath();
  };
  context.fillStyle = back;
  fin();
  context.fill();
  paintBlackTip(context, fin, 0, s * 0.28, 0, 1, s * 2);
  context.restore();

  paintLook(context, s, role, {
    eyeX: s * 0.66, eyeY: -s * 0.07, eyeR: Math.max(2.3, s * 0.065),
    tipX: s * 0.9, backX: s * 0.52, mouthY: s * 0.11
  });
}

// Tiger shark: stocky, grey-brown, a blunt nose and faint dark stripes down its sides.
function paintTigerShark(context, size, time, role) {
  const s = size, back = "#87867a", belly = "#f0ede2", dark = "#6a695e";
  const beat = Math.sin(time * 3.6), tailY = beat * s * 0.05;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(-s * 0.86, tailY);
  context.rotate(Math.sin(time * 3.6 - 0.7) * 0.15);
  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(s * 0.08, -s * 0.08);
  context.quadraticCurveTo(-s * 0.3, -s * 0.34, -s * 0.66, -s * 0.66);
  context.quadraticCurveTo(-s * 0.46, -s * 0.22, -s * 0.24, -s * 0.01);
  context.quadraticCurveTo(-s * 0.4, s * 0.2, -s * 0.44, s * 0.36);
  context.quadraticCurveTo(-s * 0.15, s * 0.16, s * 0.08, s * 0.08);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(s * 0.28, -s * 0.32);
  context.quadraticCurveTo(s * 0.12, -s * 0.62, -s * 0.06, -s * 0.8);
  context.quadraticCurveTo(-s * 0.04, -s * 0.5, -s * 0.34, -s * 0.28);
  context.closePath();
  context.moveTo(-s * 0.5, -s * 0.18);
  context.lineTo(-s * 0.62, -s * 0.3);
  context.lineTo(-s * 0.64, -s * 0.14);
  context.closePath();
  context.fill();

  const body = () => {
    context.beginPath();
    context.moveTo(s * 0.98, s * 0.06);
    context.bezierCurveTo(s * 0.98, -s * 0.16, s * 0.78, -s * 0.33, s * 0.36, -s * 0.36);
    context.bezierCurveTo(-s * 0.15, -s * 0.38, -s * 0.6, -s * 0.2, -s * 0.9, tailY - s * 0.05);
    context.lineTo(-s * 0.9, tailY + s * 0.05);
    context.bezierCurveTo(-s * 0.6, s * 0.2, -s * 0.15, s * 0.36, s * 0.36, s * 0.34);
    context.bezierCurveTo(s * 0.78, s * 0.32, s * 0.98, s * 0.22, s * 0.98, s * 0.06);
    context.closePath();
  };
  context.fillStyle = belly;
  body();
  context.fill();
  context.save();
  body();
  context.clip();
  context.fillStyle = back;
  context.beginPath();
  context.moveTo(s * 1.1, s * 0.06);
  context.quadraticCurveTo(s * 0.4, s * 0.14, -s * 0.3, s * 0.05);
  context.quadraticCurveTo(-s * 0.7, 0, -s, tailY);
  context.lineTo(-s, -s * 0.5);
  context.lineTo(s * 1.1, -s * 0.5);
  context.fill();
  // The stripes: faint dark bars from the back down the side, fading out before the belly.
  context.strokeStyle = "rgba(50,48,40,.34)";
  context.lineWidth = Math.max(1.4, s * 0.05);
  context.lineCap = "butt";
  context.beginPath();
  for (let bar = 0; bar < 8; bar++) {
    const x = s * (0.62 - bar * 0.18);
    context.moveTo(x, -s * 0.45);
    context.quadraticCurveTo(x - s * 0.06, -s * 0.2, x + s * 0.01, s * 0.06);
  }
  context.stroke();
  context.restore();
  context.lineCap = "round";

  context.strokeStyle = "rgba(80,78,66,.55)";
  context.lineWidth = Math.max(1, s * 0.022);
  context.beginPath();
  for (let slit = 0; slit < 5; slit++) {
    const x = s * (0.36 + slit * 0.05);
    context.moveTo(x, -s * 0.12);
    context.quadraticCurveTo(x - s * 0.03, s * 0.03, x, s * 0.13);
  }
  context.stroke();

  context.save();
  context.translate(s * 0.34, s * 0.14);
  context.rotate(0.95 + beat * 0.1);
  context.fillStyle = dark;
  context.beginPath();
  context.moveTo(-s * 0.12, 0);
  context.quadraticCurveTo(-s * 0.08, s * 0.32, s * 0.02, s * 0.44);
  context.quadraticCurveTo(s * 0.16, s * 0.22, s * 0.12, 0);
  context.closePath();
  context.fill();
  context.restore();

  context.fillStyle = "rgba(50,48,40,.6)";
  context.beginPath();
  context.arc(s * 0.9, -s * 0.02, Math.max(1, s * 0.017), 0, TAU);
  context.fill();
  paintLook(context, s, role, {
    eyeX: s * 0.7, eyeY: -s * 0.1, eyeR: Math.max(2.4, s * 0.07),
    tipX: s * 0.94, backX: s * 0.5, mouthY: s * 0.15, teeth: 5
  });
}

// One coral branch and the two smaller ones that grow from its tip. The tips sway; each ends in a pale polyp.
const BRANCH_COLORS = ["#b5479a", "#d465b4", "#ff9ed6"];
function paintBranch(context, x, y, angle, length, width, depth, time, phase) {
  const a = angle + Math.sin(time * 1.4 + phase) * 0.05 * (depth + 1);
  const tipX = x + Math.cos(a) * length, tipY = y + Math.sin(a) * length;
  context.strokeStyle = BRANCH_COLORS[depth];
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(tipX, tipY);
  context.stroke();
  if (depth < 2) {
    paintBranch(context, tipX, tipY, a - 0.5, length * 0.74, width * 0.72, depth + 1, time, phase + 1.3);
    paintBranch(context, tipX, tipY, a + 0.45, length * 0.7, width * 0.72, depth + 1, time, phase + 2.1);
    return;
  }
  context.fillStyle = "#fff3b0";
  context.beginPath();
  context.arc(tipX, tipY, width * 0.7, 0, TAU);
  context.fill();
}

// A rounded boulder of coral standing on the sea bed, its top covered in polyps: pale rings with a tiny dark mouth.
function paintBoulder(context, x, width, height, colors, size, time) {
  const shine = context.createRadialGradient(x - width * 0.3, -height * 0.6, width * 0.1, x, -height * 0.2, width * 1.1);
  shine.addColorStop(0, colors[0]);
  shine.addColorStop(1, colors[1]);
  context.fillStyle = shine;
  context.beginPath();
  context.ellipse(x, 0, width, height, 0, Math.PI, TAU);
  context.closePath();
  context.fill();
  context.strokeStyle = colors[2];
  context.lineWidth = Math.max(1, size * 0.04);
  context.beginPath();
  for (let ring = 0; ring < 3; ring++) {
    const grow = 0.3 + ring * 0.24;
    context.moveTo(x + Math.cos(Math.PI + 0.3) * width * grow, Math.sin(Math.PI + 0.3) * height * grow);
    context.ellipse(x, 0, width * grow, height * grow, 0, Math.PI + 0.3, TAU - 0.3);
  }
  context.stroke();
  for (let polyp = 0; polyp < 9; polyp++) {
    const angle = Math.PI + (polyp + 0.5) / 9 * Math.PI, reach = polyp % 2 ? 0.86 : 0.58;
    const px = x + Math.cos(angle) * width * reach, py = Math.sin(angle) * height * reach;
    const grow = 1 + Math.sin(time * 2 + polyp) * 0.15, radius = Math.max(1.3, size * 0.055) * grow;
    context.fillStyle = "rgba(255,244,224,.92)";
    context.beginPath();
    context.arc(px, py, radius, 0, TAU);
    context.fill();
    context.fillStyle = "rgba(110,40,50,.75)";
    context.beginPath();
    context.arc(px, py, radius * 0.4, 0, TAU);
    context.fill();
  }
}

// Coral: an orange boulder, a pink branching coral with swaying tips, and a small teal boulder, on a low rock.
function paintCoral(context, size, time) {
  const s = size;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.fillStyle = "#8f7d6b";
  context.beginPath();
  context.ellipse(0, 0, s * 1.7, s * 0.2, 0, Math.PI, TAU);
  context.closePath();
  context.fill();
  for (const [x, angle, phase] of [[0.15, -1.95, 0], [0.55, -1.57, 2], [0.95, -1.15, 4]]) {
    paintBranch(context, s * x, -s * 0.05, angle, s * 0.66, Math.max(2, s * 0.16), 0, time, phase);
  }
  paintBoulder(context, -s * 0.75, s * 0.8, s * 0.72, ["#ffb58a", "#e8704a", "#c0502f"], s, time);
  paintBoulder(context, s * 1.25, s * 0.42, s * 0.4, ["#8fefd0", "#2fb894", "#1f8a70"], s, time + 1);
}

// The wavy lip of a shell: a chain of scallops from (fromX, 0) to (toX, 0), bulging by bump.
function traceScallops(context, fromX, toX, y, count, bump) {
  const step = (toX - fromX) / count;
  for (let scallop = 0; scallop < count; scallop++) {
    context.quadraticCurveTo(fromX + step * (scallop + 0.5), y + bump, fromX + step * (scallop + 1), y);
  }
}

// A row of soft frills for the mantle, in blue and green, with dark speckles.
function paintFrills(context, fromX, toX, y, radius, time, phase) {
  const count = 11;
  for (let frill = 0; frill < count; frill++) {
    const x = fromX + (toX - fromX) * (frill + 0.5) / count;
    const bob = Math.sin(time * 2 + frill * 0.9 + phase) * radius * 0.16;
    context.fillStyle = frill % 2 ? "#3fe0a8" : "#1fb6e8";
    context.beginPath();
    context.ellipse(x, y + bob, radius, radius * 0.85, 0, 0, TAU);
    context.fill();
    context.fillStyle = "rgba(10,70,100,.5)";
    context.beginPath();
    context.arc(x, y + bob, radius * 0.28, 0, TAU);
    context.fill();
  }
}

// Giant clam: two big fluted shells with wavy lips, half open, and a bright blue-green frilled mantle
// showing. Now and then it closes a little. The hinge is at the back (left); the mouth faces right.
function paintGiantClam(context, size, time) {
  const s = size;
  const closing = Math.pow(Math.max(0, Math.sin(time * 0.55)), 10);
  const gape = (0.42 + Math.sin(time * 1.1) * 0.04) * (1 - closing * 0.6);
  const hingeX = -s * 1.3, lipY = -s * 0.5, lidLength = s * 2.6;
  context.lineCap = "round";
  context.lineJoin = "round";

  // The mantle fills the gap between the two lips and bulges out of it: dark blue at the hinge, bright green at the mouth.
  const farX = hingeX + lidLength * Math.cos(gape), farY = lipY - lidLength * Math.sin(gape);
  const mantle = context.createLinearGradient(hingeX, 0, s * 1.5, 0);
  mantle.addColorStop(0, "#0b4d63");
  mantle.addColorStop(0.5, "#1487a8");
  mantle.addColorStop(1, "#2fd0b0");
  context.fillStyle = mantle;
  context.beginPath();
  context.moveTo(hingeX, lipY);
  context.lineTo(farX, farY);
  context.quadraticCurveTo(Math.max(farX, s * 1.3) + s * 0.5, (farY + lipY) / 2, s * 1.3, lipY);
  context.closePath();
  context.fill();

  // The top shell, hinged at the back and swung open.
  context.save();
  context.translate(hingeX, lipY);
  context.rotate(-gape);
  const lid = context.createLinearGradient(0, -s * 0.7, 0, 0);
  lid.addColorStop(0, "#d9cdb0");
  lid.addColorStop(1, "#f1e8d2");
  context.fillStyle = lid;
  context.strokeStyle = "#b6a887";
  context.lineWidth = Math.max(1, s * 0.03);
  context.beginPath();
  context.moveTo(0, 0);
  context.bezierCurveTo(s * 0.2, -s * 0.85, lidLength - s * 0.2, -s * 0.85, lidLength, 0);
  traceScallops(context, lidLength, 0, 0, 8, s * 0.2);
  context.closePath();
  context.fill();
  context.beginPath();
  for (let rib = 1; rib < 8; rib++) {
    const x = lidLength * rib / 8;
    context.moveTo(x, -s * 0.02);
    context.lineTo(lidLength / 2 + (x - lidLength / 2) * 0.3, -s * 0.6);
  }
  context.stroke();
  paintFrills(context, s * 0.2, lidLength - s * 0.2, s * 0.06, s * 0.13, time, 1);
  context.restore();

  // The bottom shell, a fluted bowl standing on the sea bed.
  context.fillStyle = "#efe6cf";
  context.beginPath();
  context.moveTo(hingeX, lipY);
  context.bezierCurveTo(-s * 1.4, -s * 0.05, -s * 0.7, 0, 0, 0);
  context.bezierCurveTo(s * 0.7, 0, s * 1.4, -s * 0.05, s * 1.3, lipY);
  traceScallops(context, s * 1.3, hingeX, lipY, 8, -s * 0.2);
  context.closePath();
  context.fill();
  context.stroke();
  context.beginPath();
  for (let rib = 1; rib < 8; rib++) {
    const x = hingeX + s * 2.6 * rib / 8;
    context.moveTo(x, lipY);
    context.lineTo(x * 0.4, -s * 0.05);
  }
  context.stroke();

  // Frilly mantle spilling over the bottom lip: the bright part everyone sees.
  context.strokeStyle = "#178fb0";
  context.lineWidth = Math.max(2, s * 0.2);
  context.beginPath();
  context.moveTo(hingeX + s * 0.15, lipY - s * 0.02);
  context.lineTo(s * 1.15, lipY - s * 0.02);
  context.stroke();
  paintFrills(context, hingeX + s * 0.2, s * 1.1, lipY - s * 0.03, s * 0.16, time, 0);
}

export const REEF_PAINTERS = {
  damselfish: paintDamselfish, lionfish: paintLionfish, grouper: paintGrouper, reefshark: paintReefShark,
  tigershark: paintTigerShark, coral: paintCoral, giantclam: paintGiantClam
};
