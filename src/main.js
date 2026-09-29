import { FORMS } from "./rules.js";
import { paintOcean, portrait } from "./paint.js";
import { CRAYONS, prepareArt } from "./art.js";
import { loadDrawings, saveDrawing } from "./gallery.js";
import { createSketchpad } from "./sketchpad.js";
import { createSteering } from "./steering.js";
import { padDirection } from "./pad.js";
import { toWorld } from "./camera.js";
import { createWorld, dangerBehind, nearbyAnimals, resetWorld, swim } from "./world.js";
import { plantCoral } from "./reef.js";
import { loadReef, saveReef } from "./reef-save.js";
import { cardSpeech, FOOD_CHAIN, growLine, hurtLine, KINDS, meetLine, SEA_FRIEND_KINDS, SPECIES } from "./species.js";
import { PHOTOS } from "./photos.js";
import { createVoice } from "./voice.js";
import { loadMet, saveMet } from "./ocean-book.js";

const canvas = document.querySelector("#ocean");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const hud = document.querySelector("#hud");
const hint = document.querySelector("#hint");
const toast = document.querySelector("#toast");
const panels = ["intro", "draw", "paused", "won", "gameover", "card", "book"];
const PORTRAIT_PHONE = "(orientation: portrait) and (max-width: 600px) and (pointer: coarse)";
const input = { keys: new Set(), pointer: null, pad: null };
const steering = createSteering(input);
const pad = document.querySelector("#pad");
let touchFirst = window.matchMedia?.("(pointer: coarse)").matches;
const installed = window.matchMedia?.("(display-mode: standalone), (display-mode: fullscreen)").matches ||
  navigator.standalone === true;
const iPhone = /iP(hone|od|ad)/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const padThumbs = new Map();
let padOwner = null;
let installPrompt = null;
let width = window.innerWidth;
let height = window.innerHeight;
let world = createWorld(width, height, loadReef());
let reefSaved = true;
let previousFrame = 0;
let visualTime = 0;
let toastTimer;
// Learning: a fact card opens the first time this device meets each animal, at most one every
// CARD_GAP seconds of swimming. The Ocean book shows every card met so far.
const CARD_GAP = 20;
const voice = createVoice();
const met = loadMet();
const voiceButtons = [document.querySelector("#voice-button"), document.querySelector("#intro-voice-button")];
let cardKind = null;
let cardFrom = null;
let bookFrom = null;
let hintFrom = null;
let artLoaded = false;
let startTicket = 0;

// The child's drawings, newest first: the newest is their fish, older ones swim in the ocean.
let storage = null;
try { storage = window.localStorage; } catch { /* private mode: drawings last for this visit */ }
let drawings = loadDrawings(storage);
const art = { player: null, npc: [] };
const portraits = new Map();
const sketchpad = createSketchpad(document.querySelector("#sketch"));

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

// Layers line up with `drawings`; a drawing that fails to decode leaves a gap
// that a built-in fish fills.
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
  hud.hidden = name === "intro" || name === "draw" || world.phase === "ready";
  hint.hidden = Boolean(name);
  showPad(!name);
  if (name === "won") showArt(document.querySelector("#won-art"), document.querySelector("#won-mark"), 4);
  document.querySelector("#reef-bar").hidden = Boolean(name) || (!world.reef.pending && !world.reef.corals.length);
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
  document.querySelector("#plant-button").hidden = !world.reef.pending || world.phase === "planting";
  document.querySelector("#cancel-plant-button").hidden = world.phase !== "planting";
  document.querySelector("#reef-status").textContent = world.phase === "planting" ?
    "Tap the ocean to plant · Enter plants ahead" : !reefSaved ? "Reef stays for this visit" :
    world.sheltered ? "Safe in your coral" : world.reef.pending ? `${world.reef.pending} coral to plant` :
    `${world.reef.corals.length} coral · hide inside when small`;
}

function rememberReef() {
  reefSaved = saveReef(world.reef);
  updateHud();
}

// Phones steer with the arrow pad, so a finger never sits on top of the fish.
function showPad(visible) {
  pad.hidden = !touchFirst || !visible;
  if (pad.hidden) releasePad();
  placePad();
}

// The camera keeps the fish out from under the pad.
function placePad() {
  if (pad.hidden) return void (world.keepOut = null);
  const box = pad.getBoundingClientRect();
  world.keepOut = { x: box.left + box.width / 2, y: box.top + box.height / 2, r: box.width / 2 };
}

function aimPad(event) {
  const box = pad.getBoundingClientRect();
  input.pad = padDirection(event.clientX - box.left - box.width / 2, event.clientY - box.top - box.height / 2, box.width / 2);
  pad.setAttribute("data-dir", input.pad ? `${input.pad.x},${input.pad.y}` : "");
}

function releasePad() {
  padThumbs.clear();
  padOwner = null;
  input.pad = null;
  pad.setAttribute("data-dir", "");
}

function startPlanting() {
  if (!world.reef.pending) return;
  steering.clear();
  input.keys.clear();
  world.phase = "planting";
  world.plantSpot = { x: world.player.x + Math.min(120, width / 4), y: world.player.y + 80 };
  showPanel(null);
  showPad(false);
  hint.hidden = true;
  updateHud();
}

function placeCoral(x, y) {
  if (!plantCoral(world.reef, x, y)) return flash("Choose a little more space");
  rememberReef();
  resume();
  flash(reefSaved ? "Your reef will be here next time!" : "Your coral is planted!");
}

function flash(message, duration = 1400) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), duration);
}

// Shown and spoken: the food chain lines on starting, growing, and getting bumped.
function tell(line, duration) {
  flash(line, duration);
  voice.say(line);
}

function showVoice() {
  for (const button of voiceButtons) {
    button.hidden = !voice.available;
    button.textContent = voice.muted ? "🔇" : "🔊";
    button.setAttribute("aria-label", voice.muted ? "Turn the voice on" : "Turn the voice off");
  }
}

// Turning the voice on says so from the tap itself: iPhone speaks only once a tap has spoken.
function toggleVoice() {
  voice.setMuted(!voice.muted);
  if (!voice.muted) voice.say("Voice on!");
  showVoice();
}

// A new animal pauses the swim for its card; one met before gets a name tag and a short line.
function meetAnimals() {
  if (world.phase !== "playing") return;
  for (const { kind, target, lift } of nearbyAnimals(world, width, height)) {
    if (!met.has(kind)) {
      if (world.time < world.nextCardAt) continue;
      world.greeted.add(kind);
      met.add(kind);
      saveMet(met);
      world.phase = "meeting";
      steering.clear();
      input.keys.clear();
      openCard(kind, "meet");
      return;
    }
    world.greeted.add(kind);
    world.labels.push({ target, text: SPECIES[kind].name, life: 3.5, lift });
    voice.say(meetLine(kind), { polite: true });
  }
}

function openCard(kind, from) {
  const animal = SPECIES[kind];
  const photo = document.querySelector("#card-photo");
  cardKind = kind;
  cardFrom = from;
  document.querySelector("#card-kicker").textContent = from === "meet" ? "You met a new animal!" : "Ocean book";
  document.querySelector("#card-name").textContent = animal.name;
  document.querySelector("#card-facts").textContent = animal.facts.join(" ");
  document.querySelector("#card-eats").textContent = animal.eats;
  document.querySelector("#card-eaten").textContent = animal.eatenBy;
  document.querySelector("#card-credit").textContent = PHOTOS[kind]?.credit ?? "";
  document.querySelector("#card-close").textContent = from === "meet" ? "Keep swimming" : "Back to the book";
  photo.src = PHOTOS[kind]?.file ?? "";
  photo.alt = `Photo of a real ${animal.name.toLowerCase()}`;
  photo.hidden = !PHOTOS[kind];
  document.querySelector("#card-hear").hidden = !voice.available;
  showPanel("card");
  voice.say(cardSpeech(kind));
}

function closeCard() {
  if (!cardFrom) return;
  const from = cardFrom;
  cardFrom = null;
  voice.stop();
  if (from === "book") return openBook(bookFrom);
  world.nextCardAt = world.time + CARD_GAP;
  resume();
  world.invulnerable = Math.max(world.invulnerable, 2);
}

function openBook(from) {
  bookFrom = from;
  document.querySelector("#book-count").textContent = `You've met ${met.size} of ${KINDS.length} ocean animals`;
  document.querySelector("#book-chain").innerHTML = FOOD_CHAIN.map(bookTile).join("");
  document.querySelector("#book-friends").innerHTML = SEA_FRIEND_KINDS.map(bookTile).join("");
  showPanel("book");
}

function bookTile(kind) {
  if (!met.has(kind)) {
    return `<button class="book-tile locked" type="button" data-kind="${kind}" aria-label="Not found yet"><span class="book-q">?</span><span>???</span></button>`;
  }
  return `<button class="book-tile" type="button" data-kind="${kind}"><img src="${PHOTOS[kind]?.file ?? ""}" alt=""><span>${SPECIES[kind].name}</span></button>`;
}

function closeBook() {
  if (!bookFrom) return;
  const back = bookFrom;
  bookFrom = null;
  showPanel(back);
}

function chooseFromBook(event) {
  const kind = event.target?.closest?.("[data-kind]")?.dataset.kind;
  if (!kind) return;
  if (met.has(kind)) return openCard(kind, "book");
  document.querySelector("#book-count").textContent = "Keep swimming to find that one!";
  voice.say("Keep swimming to find that one!");
}

// Phones play sideways and full screen where the browser allows it (Android); iPhone Safari
// has no full screen for pages, so style.css asks the child to turn the phone instead.
function goFullScreen() {
  if (!window.matchMedia?.("(pointer: coarse)").matches) return;
  document.documentElement.requestFullscreen?.()
    .then(() => screen.orientation?.lock?.("landscape"))
    .catch(() => {});
}

// Starts at once when saved drawings are ready, so the fish never switches mid-swim.
function begin() {
  cardFrom = bookFrom = null;
  goFullScreen();
  const ticket = ++startTicket;
  if (artLoaded) startSwim();
  else artReady.then(() => { if (ticket === startTicket) startSwim(); });
}

function startSwim() {
  resetWorld(world, width, height, Math.max(0, drawings.length - 1));
  world.phase = "playing";
  hintFrom = { ...world.player };
  steering.clear();
  input.keys.clear();
  updateHud();
  showPanel(null);
  tell(growLine(0), 3200);
  if (document.hidden) pause();
}

function openSketchpad() {
  startTicket++;
  sketchpad.clear();
  showPanel("draw");
}

async function finishDrawing() {
  const swimButton = document.querySelector("#swim-button");
  if (swimButton.disabled) return;
  goFullScreen();
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
  begin();
}

// Keep the HUD from hiding a fish that can hurt the player.
function watchBehindHud() {
  const hidden = world.phase === "playing" && [...hud.children].some(part =>
    dangerBehind(world, part.getBoundingClientRect(), width, height));
  hud.classList.toggle("see-through", hidden);
}

function pause() {
  if (world.phase !== "playing") return;
  world.phase = "paused";
  steering.clear();
  input.keys.clear();
  voice.stop();
  showPanel("paused");
}

function resume() {
  cardFrom = bookFrom = null;
  world.phase = "playing";
  world.invulnerable = Math.max(world.invulnerable, 1.2);
  showPanel(null);
  updateHud();
}

function frame(timestamp) {
  const seconds = previousFrame ? (timestamp - previousFrame) / 1000 : 0;
  previousFrame = timestamp;
  visualTime += Math.min(seconds, 0.05);
  if (!pad.hidden) placePad();
  swim(world, seconds, input, width, height);
  paintOcean(context, world, width, height, visualTime, art);
  watchBehindHud();
  if (!hint.hidden && hintFrom && world.phase === "playing" &&
    (world.time > 8 || Math.hypot(world.player.x - hintFrom.x, world.player.y - hintFrom.y) > 250)) hint.hidden = true;

  if (world.events.length) {
    for (const event of world.events.splice(0)) {
      if (event.type === "grow") tell(growLine(world.stage), 3200);
      if (event.type === "hurt") tell(hurtLine(event.by, world.stage), 2400);
      if (event.type === "reef") rememberReef();
    }
    updateHud();
  }
  // After this frame's grow or bump line, so a new card's reading is not cut off by it.
  meetAnimals();
  if (world.phase === "won" && overlay.hidden) showPanel("won");
  if (world.phase === "gameover" && overlay.hidden) showPanel("gameover");
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", event => {
  if (world.phase === "planting") {
    const spot = toWorld(world.camera, { x: event.clientX, y: event.clientY }, width, height);
    placeCoral(spot.x, spot.y);
    return;
  }
  if (!touchFirst && event.pointerType === "mouse" && steering.down(event)) canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (world.phase === "planting") world.plantSpot = toWorld(world.camera, { x: event.clientX, y: event.clientY }, width, height);
  else if (!touchFirst) steering.move(event);
});
canvas.addEventListener("pointerup", event => steering.up(event));
canvas.addEventListener("pointercancel", event => steering.up(event));
canvas.addEventListener("pointerleave", event => steering.leave(event));

// The newest thumb on the pad steers; if it lifts, a thumb still down takes over.
pad.addEventListener("pointerdown", event => {
  pad.setPointerCapture(event.pointerId);
  padThumbs.set(event.pointerId, event);
  padOwner = event.pointerId;
  aimPad(event);
});
pad.addEventListener("pointermove", event => {
  if (!padThumbs.has(event.pointerId)) return;
  padThumbs.set(event.pointerId, event);
  if (event.pointerId === padOwner) aimPad(event);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  pad.addEventListener(type, event => {
    if (!padThumbs.delete(event.pointerId) || event.pointerId !== padOwner) return;
    const [next] = [...padThumbs.values()].slice(-1);
    if (!next) return releasePad();
    padOwner = next.pointerId;
    aimPad(next);
  });
}
// A touchscreen laptop reports a mouse first; the first real touch brings up the arrows.
window.addEventListener("pointerdown", event => {
  if (touchFirst || event.pointerType !== "touch") return;
  touchFirst = true;
  hint.innerHTML = "Hold an arrow to swim";
  if (world.phase === "playing") showPad(true);
}, true);

window.addEventListener("keydown", event => {
  // Enter or Space on a focused button presses that button, and nothing else.
  if ((event.key === "Enter" || event.key === " ") && event.target?.closest?.("button")) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
  if (cardFrom) {
    if (["Enter", " ", "Escape"].includes(event.key)) {
      event.preventDefault();
      closeCard();
    }
    return;
  }
  if (bookFrom) {
    if (event.key === "Escape") closeBook();
    return;
  }
  if (world.phase === "planting") {
    if (event.key === "Enter" || event.key === " ") placeCoral(world.plantSpot.x, world.plantSpot.y);
    if (event.key === "Escape") resume();
    return;
  }
  if (event.key === "Escape" || event.key.toLowerCase() === "p") {
    world.phase === "paused" ? resume() : pause();
  } else if (event.key === "Enter" && !event.repeat && event.target?.tagName !== "BUTTON") {
    if (!document.querySelector("#draw").hidden) finishDrawing();
    else if (world.phase === "ready" && !document.querySelector("#intro").hidden) begin();
  }
  input.keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});
window.addEventListener("keyup", event => input.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) return;
  pause();
  voice.stop();
});
window.addEventListener("resize", resize);
window.addEventListener("resize", () => { if (window.matchMedia?.(PORTRAIT_PHONE).matches) pause(); });

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
document.querySelector("#plant-button").addEventListener("click", startPlanting);
document.querySelector("#win-plant-button").addEventListener("click", startPlanting);
document.querySelector("#cancel-plant-button").addEventListener("click", resume);
document.querySelector("#card-close").addEventListener("click", closeCard);
document.querySelector("#card-hear").addEventListener("click", () => voice.say(cardSpeech(cardKind), { force: true }));
document.querySelector("#intro-book-button").addEventListener("click", () => openBook("intro"));
document.querySelector("#paused-book-button").addEventListener("click", () => openBook("paused"));
document.querySelector("#book-close").addEventListener("click", closeBook);
document.querySelector("#book-chain").addEventListener("click", chooseFromBook);
document.querySelector("#book-friends").addEventListener("click", chooseFromBook);
for (const button of voiceButtons) button.addEventListener("click", toggleVoice);
// iPhone speaks only after a tap has spoken; the first tap anywhere wakes the voice silently.
window.addEventListener("click", () => voice.unlock(), true);

// Full screen and a home-screen icon come from adding the game to the home screen.
// iPhone has no install button, so the start screen says how.
const introFoot = document.querySelector("#intro-foot");
if (touchFirst) hint.innerHTML = "Hold an arrow to swim";
if (iPhone && !installed) {
  introFoot.innerHTML = 'Full screen: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>';
  introFoot.classList.add("install-tip");
}
const footText = introFoot.innerHTML;
window.addEventListener("beforeinstallprompt", event => {
  if (!touchFirst) return;
  event.preventDefault();
  installPrompt = event;
  introFoot.innerHTML = '<button id="install-button" class="text-button" type="button">Add to home screen</button>';
  document.querySelector("#install-button").addEventListener("click", () => {
    installPrompt?.prompt();
    installPrompt = null;
    introFoot.innerHTML = footText;
  });
});
window.addEventListener("appinstalled", () => { installPrompt = null; introFoot.innerHTML = footText; });

resize();
renderIntro();
updateHud();
showVoice();
showPanel("intro");
const artReady = Promise.all(drawings.map(decode)).then(setArt).catch(() => {}).finally(() => { artLoaded = true; });
requestAnimationFrame(frame);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js");
