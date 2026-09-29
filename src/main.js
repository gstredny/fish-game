import { FORMS } from "./rules.js";
import { paintOcean } from "./paint.js";
import { createWorld, resetWorld, swim } from "./world.js";

const canvas = document.querySelector("#ocean");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const hud = document.querySelector("#hud");
const hint = document.querySelector("#hint");
const toast = document.querySelector("#toast");
const panels = ["intro", "paused", "won", "gameover"];
const input = { keys: new Set(), pointer: null };
let width = window.innerWidth;
let height = window.innerHeight;
let world = createWorld(width, height);
let previousFrame = 0;
let visualTime = 0;
let toastTimer;

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
  hud.hidden = name === "intro";
  hint.hidden = Boolean(name);
}

function updateHud() {
  const form = FORMS[world.stage];
  document.querySelector("#stage-name").textContent = form.name;
  document.querySelector("#stage-dot").style.background = form.color;
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

function begin() {
  resetWorld(world, width, height);
  world.phase = "playing";
  input.pointer = null;
  input.keys.clear();
  updateHud();
  showPanel(null);
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

function frame(timestamp) {
  const seconds = previousFrame ? (timestamp - previousFrame) / 1000 : 0;
  previousFrame = timestamp;
  visualTime += Math.min(seconds, 0.05);
  swim(world, seconds, input, width, height);
  paintOcean(context, world, width, height, visualTime);

  if (world.events.length) {
    for (const event of world.events.splice(0)) {
      if (event.type === "grow") flash(world.stage === 4 ? "You became a shark!" : `You grew into a ${FORMS[world.stage].name}!`);
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
  } else if (event.key === "Enter" && world.phase === "ready") {
    begin();
  }
  input.keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});
window.addEventListener("keyup", event => input.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
window.addEventListener("resize", resize);

document.querySelector("#start-button").addEventListener("click", begin);
document.querySelector("#restart-button").addEventListener("click", begin);
document.querySelector("#win-restart-button").addEventListener("click", begin);
document.querySelector("#continue-button").addEventListener("click", resume);
document.querySelector("#resume-button").addEventListener("click", resume);
document.querySelector("#pause-button").addEventListener("click", pause);

resize();
showPanel("intro");
requestAnimationFrame(frame);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
