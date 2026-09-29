import { ALL_PARTS, BASE_COLOR, CRAYONS, FRAME, fillParts, paintFace, strokeParts } from "./art.js";

const SCREEN_SCALE = 300;
const SAVE_SCALE = 150;
const BRUSH = 0.2;

// A fish-shaped colouring page. Paint outside the fish is kept while drawing
// but never shown or saved, so any scribble becomes a tidy fish.
export function createSketchpad(canvas) {
  canvas.width = Math.round(FRAME.width * SCREEN_SCALE);
  canvas.height = Math.round(FRAME.height * SCREEN_SCALE);
  const view = canvas.getContext("2d");
  const ink = document.createElement("canvas");
  ink.width = canvas.width;
  ink.height = canvas.height;
  const pen = ink.getContext("2d");
  let color = CRAYONS[0].color;
  const strokes = new Map();
  let painted = false;

  function render() {
    view.setTransform(1, 0, 0, 1, 0, 0);
    view.clearRect(0, 0, canvas.width, canvas.height);
    view.translate(-FRAME.left * SCREEN_SCALE, -FRAME.top * SCREEN_SCALE);
    fillParts(view, SCREEN_SCALE, ALL_PARTS, BASE_COLOR);
    view.setTransform(1, 0, 0, 1, 0, 0);
    view.globalCompositeOperation = "source-atop";
    view.drawImage(ink, 0, 0);
    view.globalCompositeOperation = "source-over";
    view.translate(-FRAME.left * SCREEN_SCALE, -FRAME.top * SCREEN_SCALE);
    strokeParts(view, SCREEN_SCALE, ALL_PARTS, "rgba(23,59,82,.5)", 6);
    paintFace(view, SCREEN_SCALE, true);
  }

  function point(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - box.left) * canvas.width / box.width,
      y: (event.clientY - box.top) * canvas.height / box.height
    };
  }

  function paint(pointerId, to) {
    const from = strokes.get(pointerId) || to;
    pen.strokeStyle = color;
    pen.lineWidth = BRUSH * SCREEN_SCALE;
    pen.lineCap = "round";
    pen.lineJoin = "round";
    pen.beginPath();
    pen.moveTo(from.x, from.y);
    pen.lineTo(to.x, to.y);
    pen.stroke();
    strokes.set(pointerId, to);
    painted = true;
    render();
  }

  // Each finger paints its own line, so two fingers or a resting palm never
  // join up into a stray stroke.
  canvas.addEventListener("pointerdown", event => {
    canvas.setPointerCapture(event.pointerId);
    strokes.delete(event.pointerId);
    paint(event.pointerId, point(event));
  });
  canvas.addEventListener("pointermove", event => {
    if (strokes.has(event.pointerId)) paint(event.pointerId, point(event));
  });
  for (const type of ["pointerup", "pointercancel"]) {
    canvas.addEventListener(type, event => { strokes.delete(event.pointerId); });
  }

  render();
  return {
    setColor(next) { color = next; },
    get painted() { return painted; },
    clear() {
      pen.clearRect(0, 0, ink.width, ink.height);
      painted = false;
      strokes.clear();
      render();
    },
    // The saved picture has no eye or outline; the ocean adds those at any size.
    save() {
      const picture = document.createElement("canvas");
      picture.width = Math.round(FRAME.width * SAVE_SCALE);
      picture.height = Math.round(FRAME.height * SAVE_SCALE);
      const context = picture.getContext("2d");
      context.translate(-FRAME.left * SAVE_SCALE, -FRAME.top * SAVE_SCALE);
      fillParts(context, SAVE_SCALE, ALL_PARTS, BASE_COLOR);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = "source-atop";
      context.drawImage(ink, 0, 0, picture.width, picture.height);
      return picture.toDataURL("image/png");
    }
  };
}
