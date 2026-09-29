// Shapes shared by the drawing pad and the ocean. Sizes are in fish-size units,
// centred on the body with the head pointing right, matching paintFish.
export const FRAME = { left: -1.7, top: -0.9, width: 2.8, height: 1.8 };
export const TAIL_JOINT = -0.83;
export const BASE_COLOR = "#fff6e2";
export const CRAYONS = [
  { name: "Red", color: "#ff5a5f" },
  { name: "Orange", color: "#ff9f43" },
  { name: "Yellow", color: "#ffd93b" },
  { name: "Green", color: "#3fcf7a" },
  { name: "Blue", color: "#3a9bff" },
  { name: "Purple", color: "#a46bff" },
  { name: "Pink", color: "#ff7ac6" },
  { name: "Night", color: "#22324d" }
];

const PARTS = {
  tail(context, size) {
    const x = TAIL_JOINT * size;
    context.moveTo(x, 0);
    context.quadraticCurveTo(x - size * 0.55, -size * 0.8, x - size * 0.8, -size * 0.72);
    context.quadraticCurveTo(x - size * 0.55, 0, x - size * 0.8, size * 0.72);
    context.quadraticCurveTo(x - size * 0.4, size * 0.6, x, 0);
  },
  dorsal(context, size) {
    context.moveTo(-size * 0.35, -size * 0.45);
    context.quadraticCurveTo(-size * 0.13, -size * 1.03, size * 0.15, -size * 0.52);
  },
  pectoral(context, size) {
    context.moveTo(-size * 0.2, size * 0.28);
    context.quadraticCurveTo(-size * 0.45, size * 0.86, size * 0.1, size * 0.58);
    context.quadraticCurveTo(size * 0.18, size * 0.35, -size * 0.2, size * 0.28);
  },
  body(context, size) {
    context.ellipse(0, 0, size, size * 0.59, 0, 0, Math.PI * 2);
  }
};
export const BODY_PARTS = ["dorsal", "pectoral", "body"];
export const ALL_PARTS = ["tail", ...BODY_PARTS];

// Each part is filled on its own so overlapping parts always join, whatever
// direction their paths wind.
export function fillParts(context, size, names, color) {
  context.fillStyle = color;
  for (const name of names) {
    context.beginPath();
    PARTS[name](context, size);
    context.fill();
  }
}

export function strokeParts(context, size, names, color, width) {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineJoin = "round";
  for (const name of names) {
    context.beginPath();
    PARTS[name](context, size);
    context.closePath();
    context.stroke();
  }
}

// Splits a saved drawing into a tail layer (which wags) and a body layer.
export function prepareArt(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = width / FRAME.width;
  const layer = names => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.translate(-FRAME.left * scale, -FRAME.top * scale);
    fillParts(context, scale, names, "#000");
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalCompositeOperation = "source-in";
    context.drawImage(image, 0, 0);
    return canvas;
  };
  return { tail: layer(["tail"]), body: layer(BODY_PARTS) };
}

export function paintHalo(context, size) {
  const halo = context.createRadialGradient(0, 0, size * 0.4, 0, 0, size * 1.85);
  halo.addColorStop(0, "rgba(214,255,238,.22)");
  halo.addColorStop(1, "rgba(214,255,238,0)");
  context.fillStyle = halo;
  context.beginPath();
  context.arc(0, 0, size * 1.85, 0, Math.PI * 2);
  context.fill();
}

export function paintFace(context, size, ring) {
  const eye = Math.max(2.5, size * 0.13);
  context.fillStyle = "#f7ffef";
  context.beginPath();
  context.arc(size * 0.58, -size * 0.17, eye, 0, Math.PI * 2);
  context.fill();
  if (ring) {
    context.strokeStyle = "#173b52";
    context.lineWidth = Math.max(1, size * 0.035);
    context.stroke();
  }
  context.fillStyle = "#173b52";
  context.beginPath();
  context.arc(size * 0.62, -size * 0.17, Math.max(1.5, size * 0.07), 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(20,55,70,.55)";
  context.lineWidth = Math.max(1, size * 0.026);
  context.beginPath();
  context.arc(size * 0.75, size * 0.14, size * 0.17, 0.1, 1.7);
  context.stroke();
}
