import { goalFor, SHARK } from "./rules.js";
import { paintOcean } from "./paint.js";
import { createSound } from "./sound.js";
import { createSteering } from "./steering.js";
import { padDirection } from "./pad.js";
import { createWorld, dangerBehind, nearbyAnimals, resetWorld, swim } from "./world.js";
import { paintColony } from "./coral-paint.js";
import { cardSpeech, growLine, hurtLine, meetLine, searchLink, SPECIES } from "./species.js";
import { formKind, KINDS, ZONE_IDS, ZONES, zoneKinds } from "./zones.js";
import { swatch } from "./animal-paint.js";
import { PHOTOS } from "./photos.js";
import { createVoice } from "./voice.js";
import { loadMet, MET_KEY, saveMet } from "./ocean-book.js";
import { cleanName, NAME_KEY, PLAYER_KEY, PLAYERS, playerSaves, savedPlayer } from "./players.js";
import { allDone, currentLevel, isOpen, levelDoneLine, levelNumber, LEVELS_KEY, loadBeaten, LOCKED_LINE, nextLevel,
  OCEAN_DONE_LINE, placeName, saveBeaten } from "./levels.js";
import { missionCount, missionDone, missionDoneLine, missionGoal, missionKind, missionLine, pickMission } from "./missions.js";
import { FIND_THAT_ONE, VOICE_ON, WHAT_ANIMAL } from "./lines.js";

const canvas = document.querySelector("#ocean");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const hud = document.querySelector("#hud");
const hint = document.querySelector("#hint");
const toast = document.querySelector("#toast");
const panels = ["intro", "paused", "won", "gameover", "card", "book", "mission", "finished", "coral"];
const LEVEL_KEY = "little-fish-level-v1";
const ZONE_KEY = "little-fish-zone-v1";
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
let previousFrame = 0;
let visualTime = 0;
let toastTimer;
// Learning: a fact card opens the first time this player meets each animal, at most one every
// CARD_GAP seconds of swimming. An animal met before gets a name tag and a line, at most one every
// GREET_GAP seconds, so a busy ocean does not rattle off names. The Ocean book shows every card met.
const CARD_GAP = 20;
const GREET_GAP = 6;
const voice = createVoice();
const voiceButtons = [document.querySelector("#voice-button"), document.querySelector("#intro-voice-button")];
let cardKind = null;
let cardFrom = null;
let guessing = false;
let bookFrom = null;
let coralFrom = null;
let hintFrom = null;
let lastSwim = null;

let storage = null;
try { storage = window.localStorage; } catch { /* private mode: preferences last for this visit */ }
let player = savedPlayer(storage);
let saves, level, zone, met, beaten;
// The level this swim finished for the first time, until the next swim.
let cleared = null;
readPlayer();
let world = createWorld(width, height, { zone });
const sound = createSound();
sound.setMuted(voice.muted);

// Where to swim: one button per level, in order. A locked place waits for the one before it to be
// finished; an open one shows how many of its animals this player has yet to meet.
function renderZones() {
  document.querySelector("#zone-pick").innerHTML = ZONE_IDS.map(id => {
    const place = ZONES[id];
    const open = isOpen(beaten, id);
    const fresh = open ? zoneKinds(place).filter(kind => !met.has(kind)).length : 0;
    const blurb = !open ? "🔒 Locked" : beaten.has(id) ? "Done!" : place.blurb;
    return `<button class="zone-button${open ? "" : " locked"}" type="button" data-zone="${id}" aria-pressed="${id === zone}" ` +
      `${open ? "" : 'aria-disabled="true" '}style="--top:${place.water[0]};--bottom:${place.water[2]}">` +
      `<span class="zone-name"><span class="zone-number">${levelNumber(id)}</span>${place.name}</span>` +
      `<span class="zone-blurb">${blurb}</span>${fresh ? `<span class="zone-new">${fresh} new</span>` : ""}</button>`;
  }).join("");
}

// Little swimmer or Big swimmer, the levels finished, where to swim, and the Ocean book: this
// player's own. The place to swim is the one picked last, if it is open, else the level they are on.
function readPlayer() {
  saves = playerSaves(storage, player);
  level = "little";
  beaten = loadBeaten(saves);
  zone = currentLevel(beaten);
  try {
    if (saves.getItem(LEVEL_KEY) === "big") level = "big";
    const picked = saves.getItem(ZONE_KEY);
    if (ZONE_IDS.includes(picked) && isOpen(beaten, picked)) zone = picked;
  } catch {}
  met = loadMet(saves);
}

// Picked on the start screen. A spot nobody has swum yet asks for a name.
function choosePlayer(choice) {
  player = choice;
  try { storage?.setItem(PLAYER_KEY, player); } catch {}
  loadPlayer();
  if (describePlayer(player).used) closeName();
  else askName();
}

// The water, book, coral and buttons become this player's.
function loadPlayer() {
  readPlayer();
  resetWorld(world, width, height, { zone, met });
  renderPlayers();
  showLevel();
  renderZones();
  updateHud();
  document.querySelector("#erase-ask").hidden = true;
}

// A spot's typed name (shown as Player N until there is one) and the level it is on. A spot
// with no name, no animals met and no level finished is a new swimmer.
function describePlayer(slot) {
  const theirs = playerSaves(storage, slot);
  let typed = null;
  try { typed = theirs.getItem(NAME_KEY); } catch {}
  const done = loadBeaten(theirs);
  const used = Boolean(typed) || done.size > 0 || loadMet(theirs).size > 0;
  const progress = !used ? "New swimmer" : allDone(done) ? "Finished! ★" :
    `Level ${levelNumber(currentLevel(done))} of ${ZONE_IDS.length}`;
  return { typed, name: typed || `Player ${slot}`, used, progress };
}

// Who's swimming: the three save spots, and Change name / Erase for the one picked.
function renderPlayers() {
  document.querySelector("#player-pick").innerHTML = PLAYERS.map(slot => {
    const { name, progress } = describePlayer(slot);
    return `<button class="player-button" type="button" data-player="${slot}" aria-pressed="${slot === player}">` +
      `<span class="player-name">${escapeHtml(name)}</span><span class="player-level">${progress}</span></button>`;
  }).join("");
  const { name, used } = describePlayer(player);
  const erase = document.querySelector("#player-erase");
  erase.textContent = `Erase ${name}`;
  erase.hidden = !used;
}

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, mark => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[mark]);
}

function askName() {
  const input = document.querySelector("#name-input");
  input.value = describePlayer(player).typed ?? "";
  document.querySelector("#name-box").hidden = false;
  document.querySelector("#erase-ask").hidden = true;
  input.focus?.();
}

function saveName() {
  const name = cleanName(document.querySelector("#name-input").value ?? "");
  try {
    if (name) saves.setItem(NAME_KEY, name);
    else saves.removeItem(NAME_KEY);
  } catch {}
  closeName();
  renderPlayers();
}

function closeName() {
  document.querySelector("#name-box").hidden = true;
}

// Erasing asks first, on the page itself: no browser pop-up.
function askErase() {
  document.querySelector("#erase-text").textContent =
    `Really erase ${describePlayer(player).name}? Their book, levels and coral go too.`;
  document.querySelector("#erase-ask").hidden = false;
  closeName();
}

function erasePlayer() {
  for (const key of [NAME_KEY, MET_KEY, LEVEL_KEY, ZONE_KEY, LEVELS_KEY]) {
    try { saves.removeItem(key); } catch {}
  }
  loadPlayer();
}

function chooseZone(id) {
  if (!ZONE_IDS.includes(id)) return;
  if (!isOpen(beaten, id)) return tell(LOCKED_LINE, 2400);
  zone = id;
  try { saves.setItem(ZONE_KEY, zone); } catch {}
  // The water behind the start screen is the place you picked.
  resetWorld(world, width, height, { zone });
  renderZones();
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
  hud.hidden = name === "intro" || world.phase === "ready";
  hint.hidden = Boolean(name);
  showPad(!name);
  if (name === "intro") {
    renderZones();
    renderPlayers();
  }
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
  showProgress();
  const hearts = document.querySelector("#hearts");
  hearts.textContent = `${"♥ ".repeat(world.hearts)}${"♡ ".repeat(3 - world.hearts)}`.trim();
  hearts.setAttribute("aria-label", `${world.hearts} hearts left`);
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
  try { saves.setItem(LEVEL_KEY, level); } catch {}
  showLevel();
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
      meetNew(kind);
      return;
    }
    if (world.time < world.nextGreetAt) continue;
    world.nextGreetAt = world.time + GREET_GAP;
    world.greeted.add(kind);
    world.labels.push({ target, text: SPECIES[kind].name, life: 3.5, lift });
    voice.say(meetLine(kind), { polite: true });
  }
}

// The card asks "What animal is this?" before it names the animal, so a child never hears a
// name first: not from a greeting, not from a bump, and not from the mission.
function meetNew(kind) {
  world.greeted.add(kind);
  met.add(kind);
  saveMet(met, saves);
  world.phase = "meeting";
  steering.clear();
  input.keys.clear();
  openCard(kind, "meet");
}

// Bumped by a hunter never met: its card asks who it is instead of a line naming it. The bump
// that ends the swim tells the line, since no card can follow.
function hurtBy(kind) {
  if (met.has(kind) || world.phase !== "playing") return tell(hurtLine(world.zone, kind, world.stage), 2400);
  meetNew(kind);
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
  document.querySelector("#card-close").textContent = closeLabel(from);
  const more = document.querySelector("#card-more");
  more.href = searchLink(kind);
  more.hidden = navigator.onLine === false;
  photo.src = PHOTOS[kind]?.file ?? "";
  photo.alt = `${PHOTOS[kind]?.credit.startsWith("Drawing") ? "Drawing" : "Photo"} of a real ${animal.name.toLowerCase()}`;
  photo.hidden = !PHOTOS[kind];
  document.querySelector("#card-hear").hidden = !voice.available;
  showPanel("card");
  if (from === "meet" || from === "mission") return askGuess();
  voice.say(cardSpeech(kind));
}

function closeLabel(from) {
  return { meet: "Keep swimming", mission: "Your mission", book: "Back to the book", won: "Next" }[from];
}

// An animal met while swimming: the photo shows first, and the child gets to say who it is
// before the card names it and reads it. It waits, with no timer, until they tap "Tell me!".
function askGuess() {
  guessing = true;
  document.querySelector("#card").classList.add("guessing");
  document.querySelector("#card-kicker").textContent = WHAT_ANIMAL;
  document.querySelector("#card-name").textContent = "?";
  document.querySelector("#card-close").textContent = "Tell me!";
  voice.say(WHAT_ANIMAL);
}

function revealCard() {
  guessing = false;
  document.querySelector("#card").classList.remove("guessing");
  document.querySelector("#card-kicker").textContent = "You met a new animal!";
  document.querySelector("#card-name").textContent = SPECIES[cardKind].name;
  document.querySelector("#card-close").textContent = closeLabel(cardFrom);
  voice.say(cardSpeech(cardKind));
}

function closeCard() {
  if (!cardFrom) return;
  if (guessing) return revealCard();
  const from = cardFrom;
  cardFrom = null;
  voice.stop();
  if (from === "book") return openBook(bookFrom);
  if (from === "mission") return showMission();
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

// Your coral: a shelf with one coral for every level finished, like a trophy case.
function openCoral(from) {
  coralFrom = from;
  const shelf = document.querySelector("#coral-shelf");
  shelf.innerHTML = "";
  for (const id of ZONE_IDS) {
    const earned = beaten.has(id);
    const tile = document.createElement("div");
    tile.className = `coral-tile${earned ? "" : " locked"}`;
    tile.append(earned ? coralPicture(levelNumber(id)) : unknownCoral());
    const label = document.createElement("span");
    label.textContent = `Level ${levelNumber(id)} · ${ZONES[id].name}`;
    tile.append(label);
    shelf.append(tile);
  }
  document.querySelector("#coral-count").textContent =
    `${beaten.size} of ${ZONE_IDS.length} corals · one for every level you finish`;
  showPanel("coral");
}

function coralPicture(seed) {
  const picture = document.createElement("canvas");
  picture.width = picture.height = 200;
  const brush = picture.getContext("2d");
  brush.translate(100, 100);
  brush.scale(0.85, 0.85);
  paintColony(brush, seed);
  return picture;
}

function unknownCoral() {
  const unknown = document.createElement("span");
  unknown.className = "book-q";
  unknown.textContent = "?";
  return unknown;
}

function closeCoral() {
  if (!coralFrom) return;
  const back = coralFrom;
  coralFrom = null;
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

function begin() {
  cardFrom = bookFrom = coralFrom = null;
  goFullScreen();
  startSwim();
}

// Each swim's mission differs from the last one.
function startSwim() {
  cleared = null;
  const mission = pickMission(lastSwim?.zone === zone ? lastSwim.id : null, ZONES[zone]);
  resetWorld(world, width, height, { level, zone, met, mission });
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

// Back to the start screen, to pick another place or level. The swim is over.
function goHome() {
  cardFrom = bookFrom = coralFrom = null;
  cleared = null;
  voice.stop();
  steering.clear();
  input.keys.clear();
  resetWorld(world, width, height, { zone });
  updateHud();
  showPanel("intro");
}

// Keep the HUD from hiding a fish that can hurt the player.
function watchBehindHud() {
  const hidden = world.phase === "playing" && [...hud.children].some(part =>
    dangerBehind(world, part.getBoundingClientRect(), width, height));
  hud.classList.toggle("see-through", hidden);
}

// Reaching the biggest form: the game waits while the mission is shown and said. A mission
// animal never met gets its card first, so "What animal is this?" comes before its name.
function openMission() {
  const kind = missionKind(world.mission);
  steering.clear();
  input.keys.clear();
  if (met.has(kind)) return showMission();
  met.add(kind);
  saveMet(met, saves);
  openCard(kind, "mission");
}

function showMission() {
  const { mission } = world;
  const kind = missionKind(mission);
  const photo = PHOTOS[kind];
  const image = document.querySelector("#mission-photo");
  image.src = photo?.file ?? "";
  image.hidden = !photo;
  image.alt = photo ? `Photo of a real ${SPECIES[kind].name.toLowerCase()}` : "";
  document.querySelector("#mission-kicker").textContent = `You're a ${SPECIES[formKind(world.zone, SHARK)].name.toLowerCase()}!`;
  document.querySelector("#mission-goal").textContent = missionGoal(mission);
  showPanel("mission");
  voice.say(missionLine(mission));
}

function closeMission() {
  if (world.phase !== "mission") return;
  resume();
}

// An animal that finished the mission (the giant, the last sea friend) and is new to the
// Ocean book gets its card before the win screen. The first mission finished in a place finishes
// that level; the last level ends the ocean.
function finishSwim(first = false) {
  const kind = { find: world.zone.giant, friends: world.mission.last }[world.mission.id];
  if (first) cleared = clearLevel();
  if (first && kind && !met.has(kind)) {
    met.add(kind);
    saveMet(met, saves);
    return openCard(kind, "won");
  }
  if (cleared && !nextLevel(cleared)) return showFinished();
  showWon();
  voice.say(cleared ? levelDoneLine(cleared) : missionDoneLine(world.mission));
}

function clearLevel() {
  const id = world.zone.id;
  if (beaten.has(id)) return null;
  beaten.add(id);
  saveBeaten(beaten, saves);
  return id;
}

// The big button: the level just opened, else another swim here. A finished level earns a coral.
function showWon() {
  const { mission } = world;
  const next = nextLevel(world.zone.id);
  const onward = document.querySelector("#won-next-button");
  const again = document.querySelector("#win-restart-button");
  onward.hidden = !next;
  onward.innerHTML = next ? `Next: ${ZONES[next].name} <span aria-hidden="true">↗</span>` : "";
  onward.className = cleared ? "primary-button" : "text-button";
  again.className = cleared ? "text-button" : "primary-button";
  document.querySelector("#won-coral-button").hidden = !cleared;
  document.querySelector("#won-title").textContent = cleared ? "Level complete!" : "Mission complete!";
  document.querySelector("#won-text").textContent = `${missionDone(mission)} ` +
    (cleared ? `You finished ${placeName(cleared)} and earned a coral! Next stop: ${placeName(next)}.` :
      "Every swim has a new mission.");
  showPanel("won");
}

function showFinished() {
  showPanel("finished");
  voice.say(OCEAN_DONE_LINE);
}

// From the win screen into the next level.
function goNext() {
  const next = nextLevel(world.zone.id);
  if (!next) return;
  chooseZone(next);
  begin();
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
  cardFrom = bookFrom = coralFrom = null;
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
  paintOcean(context, world, width, height, visualTime);
  watchBehindHud();
  if (!hint.hidden && hintFrom && world.phase === "playing" &&
    (world.time > 8 || Math.hypot(world.player.x - hintFrom.x, world.player.y - hintFrom.y) > 250)) hint.hidden = true;

  if (world.events.length) {
    for (const event of world.events.splice(0)) {
      if (event.type === "grow" && world.stage < SHARK) tell(growLine(world.zone, world.stage), 3200);
      if (event.type === "hurt") hurtBy(event.by);
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
  if (!touchFirst && event.pointerType === "mouse" && steering.down(event)) canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!touchFirst) steering.move(event);
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
  // Typing a name is not steering.
  if (event.target?.tagName === "INPUT") {
    if (event.key === "Enter") saveName();
    if (event.key === "Escape") closeName();
    return;
  }
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
  if (coralFrom) {
    if (event.key === "Escape") closeCoral();
    return;
  }
  if (world.phase === "mission") {
    if (["Enter", " ", "Escape"].includes(event.key)) {
      event.preventDefault();
      closeMission();
    }
    return;
  }
  if (event.key === "Escape" || event.key.toLowerCase() === "p") {
    world.phase === "paused" ? resume() : pause();
  } else if (event.key === "Enter" && !event.repeat && event.target?.tagName !== "BUTTON") {
    if (world.phase === "ready" && !document.querySelector("#intro").hidden) begin();
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

document.querySelector("#start-button").addEventListener("click", begin);
document.querySelector("#restart-button").addEventListener("click", begin);
document.querySelector("#win-restart-button").addEventListener("click", begin);
document.querySelector("#won-next-button").addEventListener("click", goNext);
document.querySelector("#finished-restart-button").addEventListener("click", begin);
document.querySelector("#resume-button").addEventListener("click", resume);
document.querySelector("#pause-button").addEventListener("click", pause);
document.querySelector("#mission-go").addEventListener("click", closeMission);
document.querySelector("#level-little").addEventListener("click", () => chooseLevel("little"));
document.querySelector("#level-big").addEventListener("click", () => chooseLevel("big"));
document.querySelector("#player-pick").addEventListener("click", event => {
  const slot = event.target?.closest?.("[data-player]")?.dataset.player;
  if (PLAYERS.includes(slot)) choosePlayer(slot);
});
document.querySelector("#player-rename").addEventListener("click", askName);
document.querySelector("#name-save").addEventListener("click", saveName);
document.querySelector("#name-cancel").addEventListener("click", closeName);
document.querySelector("#player-erase").addEventListener("click", askErase);
document.querySelector("#erase-yes").addEventListener("click", erasePlayer);
document.querySelector("#erase-no").addEventListener("click", () => { document.querySelector("#erase-ask").hidden = true; });
document.querySelector("#zone-pick").addEventListener("click", event => chooseZone(event.target?.closest?.("[data-zone]")?.dataset.zone));
for (const id of ["paused-home-button", "won-home-button", "gameover-home-button", "finished-home-button"]) {
  document.querySelector(`#${id}`).addEventListener("click", goHome);
}
document.querySelector("#card-close").addEventListener("click", closeCard);
document.querySelector("#card-hear").addEventListener("click", () => voice.say(cardSpeech(cardKind), { force: true }));
document.querySelector("#intro-book-button").addEventListener("click", () => openBook("intro"));
document.querySelector("#paused-book-button").addEventListener("click", () => openBook("paused"));
document.querySelector("#finished-book-button").addEventListener("click", () => openBook("finished"));
document.querySelector("#intro-coral-button").addEventListener("click", () => openCoral("intro"));
document.querySelector("#won-coral-button").addEventListener("click", () => openCoral("won"));
document.querySelector("#finished-coral-button").addEventListener("click", () => openCoral("finished"));
document.querySelector("#coral-close").addEventListener("click", closeCoral);
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
updateHud();
showVoice();
renderPlayers();
showLevel();
showPanel("intro");
requestAnimationFrame(frame);

// Phones allow sound only after a tap (when the finger lifts), click or key press.
for (const type of ["pointerup", "touchend", "click", "keydown"]) document.addEventListener(type, () => sound.unlock(), true);

// When an update takes over in the background, show it straight away, but only from the start
// screen itself: never mid-swim or with the Ocean book or a card open. Once per launch.
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
