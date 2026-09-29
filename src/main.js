import { CRAYONS, prepareArt } from "./art.js";
import { loadDrawings, saveDrawing } from "./gallery.js";
import { FORMS } from "./rules.js";
import { paintOcean, portrait } from "./paint.js";
import { createSketchpad } from "./sketchpad.js";
import { createWorld, dangerBehind, resetWorld, swim } from "./world.js";

const canvas = document.querySelector("#ocean");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const hud = document.querySelector("#hud");
const hint = document.querySelector("#hint");
const toast = document.querySelector("#toast");
const panels = ["intro", "draw", "paused", "won", "gameover"];
const input = { keys: new Set(), pointer: null };
const touchFirst = window.matchMedia("(pointer: coarse)").matches;
let width = window.innerWidth;
let height = window.innerHeight;
let world = createWorld(width, height);
let previousFrame = 0;
let visualTime = 0;
let toastTimer;

let storage = null;
try { storage = window.localStorage; } catch { /* private mode: drawings last for this visit */ }
let drawings = loadDrawings(storage);
const art = { player: null, npc: [] };
const portraits = new Map();
const sketchpad = createSketchpad(document.querySelector("#sketch"));

hint.textContent = touchFirst ? "Touch and hold to swim" : "Move the mouse to swim · Arrow keys work too";

async function decode(drawing) {
  try {
    const image = new Image();
    image.src = drawing;
    await image.decode();
    return prepareArt(image);
  } catch {
    return null;
  }
}

// Layers line up with `drawings`: the newest is the player, the rest swim in
// the ocean. A drawing that fails to decode leaves a gap filled by a built-in fish.
function setArt(layers) {
  art.player = layers[0] || null;
  art.npc = layers.slice(1);
  portraits.clear();
  renderIntro();
  updateHud();
}

function portraitAt(stage) {
  if (!portraits.has(stage)) portraits.set(stage, portrait(art.player, stage));
  return portraits.get(stage);
}

function showArt(image, mark, stage) {
  image.hidden = !art.player;
  mark.hidden = Boolean(art.player);
  if (art.player) image.src = portraitAt(stage);
}

function renderIntro() {
  const saved = drawings.length > 0;
  const draw = document.querySelector("#draw-button");
  const start = document.querySelector("#start-button");
  draw.className = saved ? "text-button" : "primary-button";
  start.className = saved ? "primary-button" : "text-button";
  draw.innerHTML = saved ? "Draw a new fish" : 'Draw my fish <span aria-hidden="true">✎</span>';
  start.innerHTML = saved ? 'Dive in <span aria-hidden="true">↗</span>' : "Just swim";
  document.querySelector("#intro-actions").prepend(saved ? start : draw);
  showArt(document.querySelector("#intro-art"), document.querySelector("#intro-mark"), 0);
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function showPanel(name) {
  overlay.hidden = !name;
  overlay.classList.toggle("result-mode", name !== "intro" && Boolean(name));
  for (const panel of panels) document.getElementById(panel).hidden = panel !== name;
  hud.hidden = name === "intro" || name === "draw";
  hint.hidden = Boolean(name);
  if (name === "won") showArt(document.querySelector("#won-art"), document.querySelector("#won-mark"), 4);
}

function updateHud() {
  const form = FORMS[world.stage];
  document.querySelector("#stage-name").textContent = form.name;
  document.querySelector("#stage-dot").style.background = form.color;
  showArt(document.querySelector("#stage-art"), document.querySelector("#stage-dot"), world.stage);
  document.querySelector("#growth-text").textContent = form.goal ?
    `${world.bites} / ${form.goal} snacks to grow` : "The whole ocean is yours";
  document.querySelector("#progress-fill").style.width = form.goal ?
    `${world.bites / form.goal * 100}%` : "100%";
  const hearts = document.querySelector("#hearts");
  hearts.textContent = `${"♥ ".repeat(world.hearts)}${"♡ ".repeat(3 - world.hearts)}`.trim();
  hearts.setAttribute("aria-label", `${world.hearts} hearts left`);
}

function flash(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 1400);
}

async function begin() {
  await artReady;
  resetWorld(world, width, height, Math.max(0, drawings.length - 1));
  world.phase = "playing";
  input.pointer = null;
  input.keys.clear();
  updateHud();
  showPanel(null);
  if (document.hidden) pause();
}

function openSketchpad() {
  sketchpad.clear();
  showPanel("draw");
}

async function finishDrawing() {
  const swimButton = document.querySelector("#swim-button");
  if (swimButton.disabled) return;
  swimButton.disabled = true;
  try {
    if (sketchpad.painted) {
      const drawing = sketchpad.save();
      await artReady;
      drawings = saveDrawing(storage, drawing, drawings);
      setArt([await decode(drawing), art.player, ...art.npc].slice(0, drawings.length));
    }
  } finally {
    swimButton.disabled = false;
  }
  await begin();
}

function pause() {
  if (world.phase !== "playing") return;
  world.phase = "paused";
  input.pointer = null;
  input.keys.clear();
  showPanel("paused");
}

function resume() {
  world.phase = "playing";
  showPanel(null);
}

// Keep the HUD from hiding a fish that can hurt the player.
function watchBehindHud() {
  const hidden = world.phase === "playing" && [...hud.children].some(part =>
    dangerBehind(world, part.getBoundingClientRect(), width, height));
  hud.classList.toggle("see-through", hidden);
}

function frame(timestamp) {
  const seconds = previousFrame ? (timestamp - previousFrame) / 1000 : 0;
  previousFrame = timestamp;
  visualTime += Math.min(seconds, 0.05);
  swim(world, seconds, input, width, height);
  paintOcean(context, world, width, height, visualTime, art);
  watchBehindHud();
  if (!hint.hidden && world.phase === "playing" &&
    (world.time > 8 || Math.hypot(world.player.x, world.player.y) > 250)) hint.hidden = true;

  if (world.events.length) {
    for (const event of world.events.splice(0)) {
      if (event.type === "grow") flash(world.stage === 4 ? "You became a shark!" :
        art.player ? "Your fish grew bigger!" : `You grew into a ${FORMS[world.stage].name}!`);
      if (event.type === "hurt") flash("Watch out, big fish!");
    }
    updateHud();
  }
  if (world.phase === "won" && overlay.hidden) showPanel("won");
  if (world.phase === "gameover" && overlay.hidden) showPanel("gameover");
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", event => {
  canvas.setPointerCapture(event.pointerId);
  input.pointer = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointermove", event => {
  if (event.pointerType === "mouse" || event.buttons) input.pointer = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointerup", event => {
  if (event.pointerType !== "mouse") input.pointer = null;
});
canvas.addEventListener("pointercancel", () => { input.pointer = null; });
canvas.addEventListener("pointerleave", () => { input.pointer = null; });

window.addEventListener("keydown", event => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if (event.key === "Escape" || event.key.toLowerCase() === "p") {
    world.phase === "paused" ? resume() : pause();
  } else if (event.key === "Enter" && !event.repeat && !(event.target instanceof HTMLButtonElement)) {
    if (!document.querySelector("#draw").hidden) finishDrawing();
    else if (!document.querySelector("#intro").hidden) document.querySelector("#intro .primary-button").click();
  }
  input.keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});
window.addEventListener("keyup", event => input.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
window.addEventListener("resize", resize);

const crayons = document.querySelector("#crayons");
for (const [index, crayon] of CRAYONS.entries()) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "crayon";
  button.style.setProperty("--crayon", crayon.color);
  button.setAttribute("aria-label", crayon.name);
  button.setAttribute("aria-pressed", String(index === 0));
  button.addEventListener("click", () => {
    sketchpad.setColor(crayon.color);
    for (const other of crayons.children) other.setAttribute("aria-pressed", String(other === button));
  });
  crayons.append(button);
}

document.querySelector("#draw-button").addEventListener("click", openSketchpad);
document.querySelector("#clear-button").addEventListener("click", () => sketchpad.clear());
document.querySelector("#swim-button").addEventListener("click", finishDrawing);
document.querySelector("#start-button").addEventListener("click", begin);
document.querySelector("#restart-button").addEventListener("click", begin);
document.querySelector("#win-restart-button").addEventListener("click", begin);
document.querySelector("#continue-button").addEventListener("click", resume);
document.querySelector("#resume-button").addEventListener("click", resume);
document.querySelector("#pause-button").addEventListener("click", pause);

resize();
renderIntro();
showPanel("intro");
const artReady = Promise.all(drawings.map(decode)).then(setArt);
requestAnimationFrame(frame);

if (new URLSearchParams(location.search).has("test")) window.littleFish = { world, art };
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
