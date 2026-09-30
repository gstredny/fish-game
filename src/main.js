import { goalFor, SHARK } from "./rules.js";
import { paintOcean, portrait } from "./paint.js";
import { CRAYONS, prepareArt } from "./art.js";
import { loadDrawings, saveDrawing } from "./gallery.js";
import { createSketchpad } from "./sketchpad.js";
import { createSound } from "./sound.js";
import { createSteering } from "./steering.js";
import { padDirection } from "./pad.js";
import { toWorld } from "./camera.js";
import { createWorld, dangerBehind, nearbyAnimals, resetWorld, swim } from "./world.js";
import { plantCoral } from "./reef.js";
import { loadReef, saveReef } from "./reef-save.js";
import { cardSpeech, growLine, hurtLine, meetLine, searchLink, SPECIES } from "./species.js";
import { DEFAULT_ZONE, formKind, KINDS, ZONE_IDS, ZONES, zoneKinds } from "./zones.js";
import { swatch } from "./animal-paint.js";
import { PHOTOS } from "./photos.js";
import { createVoice } from "./voice.js";
import { loadMet, saveMet } from "./ocean-book.js";
import { missionCount, missionDone, missionDoneLine, missionGoal, missionKind, missionLine, pickMission } from "./missions.js";
import { FIND_THAT_ONE, VOICE_ON } from "./lines.js";

const canvas = document.querySelector("#ocean");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const hud = document.querySelector("#hud");
const hint = document.querySelector("#hint");
const toast = document.querySelector("#toast");
const panels = ["intro", "draw", "paused", "won", "gameover", "card", "book", "mission"];
const LEVEL_KEY = "little-fish-level-v1";
const ZONE_KEY = "little-fish-zone-v1";
const PLAIN_FISH_KEY = "little-fish-plain-v1";
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
let reefSaved = true;
let previousFrame = 0;
let visualTime = 0;
let toastTimer;
// Learning: a fact card opens the first time this device meets each animal, at most one every
// CARD_GAP seconds of swimming. An animal met before gets a name tag and a line, at most one every
// GREET_GAP seconds, so a busy ocean does not rattle off names. The Ocean book shows every card met.
const CARD_GAP = 20;
const GREET_GAP = 6;
const voice = createVoice();
const met = loadMet();
const voiceButtons = [document.querySelector("#voice-button"), document.querySelector("#intro-voice-button")];
let cardKind = null;
let cardFrom = null;
let bookFrom = null;
let hintFrom = null;
let artLoaded = false;
let startTicket = 0;
let lastSwim = null;

// The child's drawings, newest first: the newest is their fish, older ones swim in the ocean.
let storage = null;
try { storage = window.localStorage; } catch { /* private mode: drawings last for this visit */ }
let drawings = loadDrawings(storage);
// Little swimmer or Big swimmer, where to swim, and whether to swim as a drawing or a real fish:
// all remembered on this device.
let level = "little";
let zone = DEFAULT_ZONE;
let plainFish = false;
try {
  if (storage?.getItem(LEVEL_KEY) === "big") level = "big";
  if (ZONE_IDS.includes(storage?.getItem(ZONE_KEY))) zone = storage.getItem(ZONE_KEY);
  plainFish = storage?.getItem(PLAIN_FISH_KEY) === "on";
} catch {}
let world = createWorld(width, height, { reef: loadReef(), zone });
const art = { player: null, npc: [] };
const portraits = new Map();
const sketchpad = createSketchpad(document.querySelector("#sketch"));
const sound = createSound();
sound.setMuted(voice.muted);

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

// The drawing you swim as, unless you chose to swim as a real fish; then it swims with the others.
function playerArt() {
  return plainFish && art.player ? { player: null, npc: [art.player, ...art.npc] } : art;
}

function portraitAt(stage) {
  const kind = formKind(world.zone, stage);
  if (!portraits.has(kind)) portraits.set(kind, portrait(art.player, kind));
  return portraits.get(kind);
}

function showArt(image, mark, stage) {
  const drawn = Boolean(playerArt().player);
  image.hidden = !drawn;
  mark.hidden = drawn;
  if (drawn) image.src = portraitAt(stage);
}

function renderIntro() {
  const saved = drawings.length > 0;
  const draw = document.querySelector("#draw-button");
  const start = document.querySelector("#start-button");
  const plain = document.querySelector("#plain-button");
  // Playing is always the big button; drawing is the smaller one beside it.
  start.className = "primary-button";
  draw.className = "secondary-button";
  start.innerHTML = 'Dive in <span aria-hidden="true">↗</span>';
  draw.innerHTML = `${saved ? "Draw a new fish" : "Draw my fish"} <span aria-hidden="true">✎</span>`;
  // With a drawing saved, you can still choose to swim as a real fish.
  plain.hidden = !art.player;
  plain.textContent = plainFish ? "Swim as my drawing" : "Swim as a real fish";
  showArt(document.querySelector("#intro-art"), document.querySelector("#intro-mark"), 0);
  renderZones();
}

function togglePlainFish() {
  plainFish = !plainFish;
  try { storage?.setItem(PLAIN_FISH_KEY, plainFish ? "on" : "off"); } catch {}
  renderIntro();
  updateHud();
}

// Where to swim: one button per zone, with how many of its animals this device has yet to meet.
function renderZones() {
  document.querySelector("#zone-pick").innerHTML = ZONE_IDS.map(id => {
    const place = ZONES[id];
    const fresh = zoneKinds(place).filter(kind => !met.has(kind)).length;
    return `<button class="zone-button" type="button" data-zone="${id}" aria-pressed="${id === zone}" ` +
      `style="--top:${place.water[0]};--bottom:${place.water[2]}"><span class="zone-name">${place.name}</span>` +
      `<span class="zone-blurb">${place.blurb}</span>${fresh ? `<span class="zone-new">${fresh} new</span>` : ""}</button>`;
  }).join("");
}

function chooseZone(id) {
  if (!ZONE_IDS.includes(id)) return;
  zone = id;
  try { storage?.setItem(ZONE_KEY, zone); } catch {}
  // The water behind the start screen is the place you picked.
  resetWorld(world, width, height, { zone });
  portraits.clear();
  renderIntro();
  updateHud();
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
  if (name === "intro") renderZones();
  if (name === "won") showArt(document.querySelector("#won-art"), document.querySelector("#won-mark"), 4);
  document.querySelector("#reef-bar").hidden = Boolean(name) || (!world.reef.pending && !world.reef.corals.length);
}

// "Little sardine", then the animal's own name as you grow.
function formName(stage) {
  const { name } = SPECIES[formKind(world.zone, stage)];
  return stage ? name : `Little ${name.toLowerCase()}`;
}

function updateHud() {
  const kind = formKind(world.zone, world.stage);
  document.querySelector("#stage-name").textContent = formName(world.stage);
  document.querySelector("#stage-dot").style.background = swatch(kind);
  showArt(document.querySelector("#stage-art"), document.querySelector("#stage-dot"), world.stage);
  showProgress();
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

// Growing: snacks eaten so far. A shark: how far along the mission is.
function showProgress() {
  const { mission } = world;
  const goal = goalFor(world.level, world.stage);
  document.querySelector("#growth-text").textContent = world.stage < SHARK ? `${world.bites} / ${goal} snacks to grow` :
    mission.done ? "Mission complete!" : missionGoal(mission);
  document.querySelector("#progress-fill").style.width = world.stage < SHARK ? `${world.bites / goal * 100}%` :
    `${mission.have / mission.need * 100}%`;
}

function showLevel() {
  for (const choice of ["little", "big"]) {
    document.querySelector(`#level-${choice}`).setAttribute("aria-pressed", String(level === choice));
  }
}

function chooseLevel(choice) {
  level = choice;
  try { storage?.setItem(LEVEL_KEY, level); } catch {}
  showLevel();
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
  stopPlanting();
  flash(reefSaved ? "Your reef will be here next time!" : "Your coral is planted!");
}

// After the mission, planting goes back to the win screen; during a swim, back to swimming.
function stopPlanting() {
  if (!world.mission.done) return resume();
  world.phase = "won";
  showWon();
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
    button.hidden = !voice.available && !sound.available;
    button.textContent = voice.muted ? "🔇" : "🔊";
    button.setAttribute("aria-label", voice.muted ? "Turn the sound on" : "Turn the sound off");
  }
}

// Turning the voice on says so from the tap itself: iPhone speaks only once a tap has spoken.
function toggleVoice() {
  voice.setMuted(!voice.muted);
  sound.setMuted(voice.muted);
  if (!voice.muted) voice.say(VOICE_ON);
  showVoice();
}

// A new animal pauses the swim for its card; one met before gets a name tag and a short line,
// one at a time, with a breath between them.
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
    if (world.time < world.nextGreetAt) continue;
    world.nextGreetAt = world.time + GREET_GAP;
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
  document.querySelector("#card-kicker").textContent = from === "book" ? "Ocean book" : "You met a new animal!";
  document.querySelector("#card-name").textContent = animal.name;
  document.querySelector("#card-facts").textContent = animal.facts.join(" ");
  document.querySelector("#card-eats").textContent = animal.eats;
  document.querySelector("#card-eaten").textContent = animal.eatenBy;
  document.querySelector("#card-credit").textContent = PHOTOS[kind]?.credit ?? "";
  document.querySelector("#card-close").textContent = { meet: "Keep swimming", book: "Back to the book", won: "Next" }[from];
  const more = document.querySelector("#card-more");
  more.href = searchLink(kind);
  more.hidden = navigator.onLine === false;
  photo.src = PHOTOS[kind]?.file ?? "";
  photo.alt = `${PHOTOS[kind]?.credit.startsWith("Drawing") ? "Drawing" : "Photo"} of a real ${animal.name.toLowerCase()}`;
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
  if (from === "won") return finishSwim();
  world.nextCardAt = world.time + CARD_GAP;
  resume();
  world.invulnerable = Math.max(world.invulnerable, 2);
}

// The book is grouped by place; an animal that lives in two places shows in both, and counts once.
function openBook(from) {
  bookFrom = from;
  document.querySelector("#book-count").textContent = `You've met ${met.size} of ${KINDS.length} ocean animals`;
  document.querySelector("#book-zones").innerHTML = ZONE_IDS.map(id => {
    const place = ZONES[id];
    const known = zoneKinds(place).filter(kind => met.has(kind)).length;
    return `<section class="book-zone"><h3>${place.name} <span>· ${known} of ${zoneKinds(place).length} met</span></h3>` +
      `<p class="book-row-title">The food chain <span>· each one is eaten by the next</span></p>` +
      `<div class="book-row book-chain">${place.chain.map(bookTile).join("")}</div>` +
      `<p class="book-row-title">Sea friends</p>` +
      `<div class="book-row">${[...place.friends, place.giant].map(bookTile).join("")}</div></section>`;
  }).join("");
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
  document.querySelector("#book-count").textContent = FIND_THAT_ONE;
  voice.say(FIND_THAT_ONE);
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

// Each swim's mission differs from the last one.
function startSwim() {
  const mission = pickMission(lastSwim?.zone === zone ? lastSwim.id : null, ZONES[zone]);
  resetWorld(world, width, height, { artCount: playerArt().npc.length, level, zone, met, mission });
  lastSwim = { zone, id: mission };
  world.phase = "playing";
  hintFrom = { ...world.player };
  steering.clear();
  input.keys.clear();
  updateHud();
  showPanel(null);
  tell(growLine(world.zone, 0), 3200);
  if (document.hidden) pause();
}

// Back to the start screen, to pick another place, level or fish. The swim is over.
function goHome() {
  startTicket++;
  cardFrom = bookFrom = null;
  voice.stop();
  steering.clear();
  input.keys.clear();
  resetWorld(world, width, height, { zone });
  updateHud();
  showPanel("intro");
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
      plainFish = false;
      try { storage?.setItem(PLAIN_FISH_KEY, "off"); } catch {}
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

// Reaching the biggest form: the game waits while the mission is shown and said.
function openMission() {
  const { mission } = world;
  const kind = missionKind(mission);
  const photo = PHOTOS[kind];
  const image = document.querySelector("#mission-photo");
  image.src = photo?.file ?? "";
  image.hidden = !photo;
  image.alt = photo ? `Photo of a real ${SPECIES[kind].name.toLowerCase()}` : "";
  document.querySelector("#mission-kicker").textContent = `You're a ${SPECIES[formKind(world.zone, SHARK)].name.toLowerCase()}!`;
  document.querySelector("#mission-goal").textContent = missionGoal(mission);
  steering.clear();
  input.keys.clear();
  showPanel("mission");
  voice.say(missionLine(mission));
}

function closeMission() {
  if (world.phase !== "mission") return;
  resume();
}

// An animal that finished the mission (the giant, the last sea friend) and is new to the
// Ocean book gets its card before the win screen.
function finishSwim(first = false) {
  const kind = { find: world.zone.giant, friends: world.mission.last }[world.mission.id];
  if (first && kind && !met.has(kind)) {
    met.add(kind);
    saveMet(met);
    return openCard(kind, "won");
  }
  showWon();
  voice.say(missionDoneLine(world.mission));
}

function showWon() {
  const { mission } = world;
  const plant = document.querySelector("#win-plant-button");
  const again = document.querySelector("#win-restart-button");
  plant.hidden = !world.reef.pending;
  again.className = plant.hidden ? "primary-button" : "text-button";
  document.querySelector("#won-text").textContent = `${missionDone(mission)} ` +
    (plant.hidden ? "Every swim has a new mission." : "You earned a coral colony! Plant a home for little fish.");
  showPanel("won");
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
  sound.listen(world);
  if (world.stage === SHARK && world.phase === "playing") showProgress();
  paintOcean(context, world, width, height, visualTime, playerArt());
  watchBehindHud();
  if (!hint.hidden && hintFrom && world.phase === "playing" &&
    (world.time > 8 || Math.hypot(world.player.x - hintFrom.x, world.player.y - hintFrom.y) > 250)) hint.hidden = true;

  if (world.events.length) {
    for (const event of world.events.splice(0)) {
      if (event.type === "grow" && world.stage < SHARK) tell(growLine(world.zone, world.stage), 3200);
      if (event.type === "hurt") tell(hurtLine(world.zone, event.by, world.stage), 2400);
      if (event.type === "reef") rememberReef();
      if (event.type === "mission") openMission();
      if (event.type === "mission-count") flash(missionCount(world.mission));
      if (event.type === "done") finishSwim(true);
    }
    updateHud();
  }
  // After this frame's grow or bump line, so a new card's reading is not cut off by it.
  meetAnimals();
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
  // Enter or Space on a focused button or link presses it, and nothing else.
  if ((event.key === "Enter" || event.key === " ") && event.target?.closest?.("button, a")) return;
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
  if (world.phase === "mission") {
    if (["Enter", " ", "Escape"].includes(event.key)) {
      event.preventDefault();
      closeMission();
    }
    return;
  }
  if (world.phase === "planting") {
    if (event.key === "Enter" || event.key === " ") placeCoral(world.plantSpot.x, world.plantSpot.y);
    if (event.key === "Escape") stopPlanting();
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
document.querySelector("#resume-button").addEventListener("click", resume);
document.querySelector("#pause-button").addEventListener("click", pause);
document.querySelector("#plant-button").addEventListener("click", startPlanting);
document.querySelector("#win-plant-button").addEventListener("click", startPlanting);
document.querySelector("#cancel-plant-button").addEventListener("click", stopPlanting);
document.querySelector("#mission-go").addEventListener("click", closeMission);
document.querySelector("#level-little").addEventListener("click", () => chooseLevel("little"));
document.querySelector("#level-big").addEventListener("click", () => chooseLevel("big"));
document.querySelector("#zone-pick").addEventListener("click", event => chooseZone(event.target?.closest?.("[data-zone]")?.dataset.zone));
document.querySelector("#plain-button").addEventListener("click", togglePlainFish);
for (const id of ["paused-home-button", "won-home-button", "gameover-home-button"]) {
  document.querySelector(`#${id}`).addEventListener("click", goHome);
}
document.querySelector("#card-close").addEventListener("click", closeCard);
document.querySelector("#card-hear").addEventListener("click", () => voice.say(cardSpeech(cardKind), { force: true }));
document.querySelector("#intro-book-button").addEventListener("click", () => openBook("intro"));
document.querySelector("#paused-book-button").addEventListener("click", () => openBook("paused"));
document.querySelector("#book-close").addEventListener("click", closeBook);
document.querySelector("#book-zones").addEventListener("click", chooseFromBook);
for (const button of voiceButtons) button.addEventListener("click", toggleVoice);
// iPhone speaks only after a tap has spoken; the first tap anywhere wakes the voice silently.
window.addEventListener("click", () => voice.unlock(), true);

// Full screen and a home-screen icon come from adding the game to the home screen.
// iPhone has no install button, so the start screen points at Share and shows the steps.
const introFoot = document.querySelector("#intro-foot");
if (touchFirst) hint.innerHTML = "Hold an arrow to swim";
if (iPhone && !installed) {
  const guide = document.querySelector("#install-guide");
  const agent = navigator.userAgent || "";
  // Chrome, Firefox and Edge keep Share in the top bar; Safari 26 tucks it under •••.
  const safari = !/CriOS|FxiOS|EdgiOS/.test(agent);
  const tucked = safari && Number(/Version\/(\d+)/.exec(agent)?.[1] ?? 0) >= 26;
  guide.hidden = false;
  guide.classList.toggle("safari", safari);
  document.querySelector("#install-more").hidden = !tucked;
  document.querySelector("#install-more-next").hidden = !tucked;
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
showLevel();
showPanel("intro");
const artReady = Promise.all(drawings.map(decode)).then(setArt).catch(() => {}).finally(() => { artLoaded = true; });
requestAnimationFrame(frame);

// Phones allow sound only after a tap (when the finger lifts), click or key press.
for (const type of ["pointerup", "touchend", "click", "keydown"]) document.addEventListener(type, () => sound.unlock(), true);

// When an update takes over in the background, show it straight away, but only from the start
// screen itself: never mid-swim, mid-drawing, or with the Ocean book or a card open. Once per launch.
if ("serviceWorker" in navigator) {
  const updating = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register("./sw.js").then(registration => {
    // Coming back to the app from the background also checks for a new version.
    document.addEventListener("visibilitychange", () => { if (!document.hidden) registration.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const onStartScreen = world.phase === "ready" && !document.querySelector("#intro").hidden;
    if (!updating || !onStartScreen) return;
    try {
      if (sessionStorage.getItem("little-fish-updated")) return;
      sessionStorage.setItem("little-fish-updated", "1");
    } catch { /* no session storage: still reload once, as the page is fresh after it */ }
    location.reload();
  });
}
