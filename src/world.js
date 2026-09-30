import { canEat, CREATURES, FLOOR, FORMS, friendTraits, goalFor, isDanger, isFriend, LEVELS, nextGrowth, SHARK,
  swimSpeed } from "./rules.js";
import { createReef, isSheltered } from "./reef.js";
import { followPlayer, toWorld } from "./camera.js";
import { createMission, MISSIONS, pickMission } from "./missions.js";
import { DEFAULT_ZONE, hasTopHunter, topTier, ZONES } from "./zones.js";

// `zone` is where this swim happens (zones.js): its food chain fills the tiers and its list of sea
// friends fills the water and the sea bed. `met` is the device's Ocean book: sea friends it has
// never met come first (see makeFriend).
export function createWorld(width, height, { reef = createReef(), level = "little", zone = DEFAULT_ZONE,
  mission, met = new Set() } = {}) {
  const place = typeof zone === "string" ? ZONES[zone] : zone;
  const home = reef.corals[0];
  const start = { x: home ? home.x - 100 : 0, y: home ? home.y : 0 };
  const world = {
    player: { ...start, direction: 1 },
    camera: { ...start },
    reef,
    zone: place,
    sheltered: false,
    stage: 0,
    bites: 0,
    hearts: 3,
    invulnerable: 2.5,
    gulp: 0,
    phase: "ready",
    time: 0,
    creatures: [],
    friends: [],
    particles: [],
    events: [],
    level,
    // Chosen at the start; it begins when you reach the biggest form, and finishing it ends the swim.
    mission: createMission(mission ?? pickMission(null, place), level, place),
    // Learning: kinds already met this swim, floating name tags, when the next fact card may open, and
    // when the next known animal may be greeted (main.js paces both).
    greeted: new Set(),
    met,
    labels: [],
    nextCardAt: 5,
    nextGreetAt: 0
  };
  fillOcean(world, width, height, true);
  return world;
}

// A new swim in the same place (or another): the reef, level and Ocean book carry over,
// and the mission differs from the last one.
export function resetWorld(world, width, height, options = {}) {
  const zone = options.zone ?? world.zone;
  const place = typeof zone === "string" ? ZONES[zone] : zone;
  const mission = options.mission ?? pickMission(place === world.zone ? world.mission.id : null, place);
  Object.assign(world, createWorld(width, height, { reef: world.reef, level: world.level,
    met: world.met, ...options, zone: place, mission }));
}

// The animal on a tier, in this swim's zone.
export function kindAt(world, tier) {
  return world.zone.chain[tier];
}

export function swim(world, seconds, input, width, height) {
  if (world.phase !== "playing") return;

  const step = Math.min(seconds, 0.05);
  world.time += step;
  world.invulnerable = Math.max(0, world.invulnerable - step);
  world.gulp = Math.max(0, world.gulp - step);
  movePlayer(world, input, step, width, height);
  followPlayer(world.camera, world.player, width, height,
    world.keepOut && { ...world.keepOut, r: world.keepOut.r + FORMS[world.stage].size * 1.4 });
  const wasSheltered = world.sheltered;
  world.sheltered = isSheltered(world);

  const level = LEVELS[world.level] ?? LEVELS.little;
  const top = topTier(world.zone);
  for (const creature of world.creatures) {
    const gap = distance(world.player, creature);
    const danger = !world.sheltered && isDanger(world.stage, creature.tier);
    const pace = creature.tier === top && hasTopHunter(world.zone) ? level.orcaChase : level.chase;
    if (danger && pace && gap > 1 && (creature.hunt || gap < level.reach)) {
      // A hunter turns and chases, a little slower than you, so you can always get away.
      const speed = pace * swimSpeed(world.stage);
      if (Math.abs(world.player.x - creature.x) > 4) creature.direction = Math.sign(world.player.x - creature.x);
      creature.x += (world.player.x - creature.x) / gap * speed * step;
      creature.y += (world.player.y - creature.y) / gap * speed * step;
    } else if (danger && gap < level.reach) {
      swimAlong(world, creature, step);
      const chase = creature.tier >= SHARK + 1 ? 18 : 10;
      creature.x += Math.sign(world.player.x - creature.x) * chase * step;
      creature.y += Math.sign(world.player.y - creature.y) * chase * step;
    } else {
      swimAlong(world, creature, step);
    }
    if (isFriend(world.stage, creature.tier) && gap < 220) {
      // Your own kind schools with you: it turns your way and keeps close.
      creature.direction = world.player.direction;
      if (gap > CREATURES[creature.tier].size * 2.2) {
        creature.x += Math.sign(world.player.x - creature.x) * 20 * step;
        creature.y += Math.sign(world.player.y - creature.y) * 20 * step;
      }
    }
    meetCreature(world, creature);
    if (world.phase !== "playing") break;
  }

  world.sheltered = isSheltered(world);
  if (wasSheltered !== world.sheltered) world.events.push({ type: "shelter" });

  world.creatures = world.creatures.filter(creature =>
    !creature.gone && Math.abs(creature.x - world.camera.x) < width * 1.4 + 160 &&
    Math.abs(creature.y - world.camera.y) < height * 1.4 + 160
  );
  for (const friend of world.friends) {
    friend.x += friend.direction * friend.speed * step;
    if (!friend.floor) friend.y += Math.sin(world.time * 1.3 + friend.wobble) * 6 * step;
    // A pufferfish puffs up when you swim close, and slowly lets the water out again.
    if (friend.kind === "pufferfish") {
      const close = distance(world.player, friend) < 100 + friend.size * 2;
      friend.puff = Math.min(1, Math.max(0, (friend.puff ?? 0) + (close ? 3 : -0.7) * step));
    }
  }
  world.friends = world.friends.filter(friend => Math.abs(friend.x - world.camera.x) < width * 1.4 + 160 &&
    (friend.floor || Math.abs(friend.y - world.camera.y) < height * 1.4 + 160));
  for (const label of world.labels) label.life -= step;
  world.labels = world.labels.filter(label => label.life > 0 && !label.target.gone);
  world.particles = world.particles.filter(particle => particle.life > 0);
  for (const particle of world.particles) {
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;
    particle.life -= step;
  }
  fillOcean(world, width, height, false);
  followMission(world, step, width, height);
}

// Animals close enough to meet, nearest first: one per kind, skipping kinds already met this swim.
// Floor animals sit on the sea bed at the bottom of the screen, so the fish meets them by swimming low.
export function nearbyAnimals(world, width, height, skip = world.greeted) {
  const found = new Map();
  const left = world.camera.x - width / 2, top = world.camera.y - height / 2;
  const onScreen = spot => spot.x > left && spot.x < left + width && spot.y > top && spot.y < top + height;
  const consider = (kind, target, gap, reach, lift) => {
    if (skip.has(kind) || gap > reach || gap >= (found.get(kind)?.gap ?? Infinity)) return;
    found.set(kind, { kind, target, gap, lift });
  };
  for (const creature of world.creatures) {
    if (creature.gone || !onScreen(creature)) continue;
    const { size } = CREATURES[creature.tier];
    consider(kindAt(world, creature.tier), creature, distance(world.player, creature), 130 + size, size + 16);
  }
  for (const friend of world.friends) {
    if (friend.floor) {
      const gap = Math.hypot(friend.x - world.player.x, height * FLOOR - (world.player.y - top));
      consider(friend.kind, friend, gap, height * 0.15 + 70 + friend.size, friend.size * 2 + 16);
    } else if (onScreen(friend)) {
      consider(friend.kind, friend, distance(world.player, friend), 110 + friend.size, friend.size + 16);
    }
  }
  for (const coral of world.reef.corals) consider("clownfish", coral, distance(world.player, coral), 170, 100);
  return [...found.values()].sort((first, second) => first.gap - second.gap);
}

function movePlayer(world, input, step, width, height) {
  let horizontal = Number(input.keys.has("ArrowRight") || input.keys.has("d")) -
    Number(input.keys.has("ArrowLeft") || input.keys.has("a")) + (input.pad?.x ?? 0);
  let vertical = Number(input.keys.has("ArrowDown") || input.keys.has("s")) -
    Number(input.keys.has("ArrowUp") || input.keys.has("w")) + (input.pad?.y ?? 0);
  let length = Math.hypot(horizontal, vertical);
  let move = swimSpeed(world.stage) * step;

  // A held finger or mouse is a place to swim to: the fish heads there and stops on it.
  if (!length && input.pointer) {
    const target = toWorld(world.camera, input.pointer, width, height);
    horizontal = target.x - world.player.x;
    vertical = target.y - world.player.y;
    length = Math.hypot(horizontal, vertical);
    move = Math.min(move, length);
  }
  if (!length) return;
  world.player.x += horizontal / length * move;
  world.player.y += vertical / length * move;
  if (Math.abs(horizontal) >= 1) world.player.direction = Math.sign(horizontal);
}

function meetCreature(world, creature) {
  const playerSize = FORMS[world.stage].size;
  const creatureSize = CREATURES[creature.tier].size;
  if (isFriend(world.stage, creature.tier)) return;
  const edible = canEat(world.stage, creature.tier);
  // Snacks count the moment they touch the fish; a bigger fish must really bump it to hurt.
  const reach = edible ? playerSize + creatureSize : playerSize * 0.68 + creatureSize * 0.62;
  if (distance(world.player, creature) > reach) return;

  if (edible) {
    creature.gone = true;
    world.gulp = 0.25;
    burst(world, creature.x, creature.y, { kind: kindAt(world, creature.tier) }, 7);
    world.particles.push({ x: creature.x, y: creature.y - 12, vx: 0, vy: -55, life: 0.9, color: "#fff4ad", text: "+1" });
    const growth = nextGrowth(world.stage, world.bites + 1, goalFor(world.level, world.stage));
    world.stage = growth.stage;
    world.bites = growth.bites;
    world.events.push({ type: growth.grew ? "grow" : "eat" });
    if (world.stage === SHARK && growth.grew) {
      // The biggest form now: the swim's mission begins, and the game waits while it is explained.
      world.mission.active = true;
      world.phase = "mission";
      world.events.push({ type: "mission" });
    } else if (world.mission.active && !world.mission.done && MISSIONS[world.mission.id].tier === creature.tier) {
      advanceMission(world, 1);
    }
    return;
  }

  if (world.invulnerable > 0 || isSheltered(world)) return;
  creature.gone = true;
  world.hearts -= 1;
  world.invulnerable = (LEVELS[world.level] ?? LEVELS.little).safe;
  // Caught by the mission's hunter: start staying away again.
  if (creature.hunt) Object.assign(world.mission, { have: 0, wait: 2 });
  burst(world, world.player.x, world.player.y, { color: "#ffdaab" }, 14);
  world.events.push({ type: "hurt", by: kindAt(world, creature.tier) });
  if (world.hearts === 0) world.phase = "gameover";
}

function swimAlong(world, creature, step) {
  creature.x += creature.direction * CREATURES[creature.tier].speed * step;
  creature.y += Math.sin(world.time * 2 + creature.wobble) * 8 * step;
}

function advanceMission(world, amount) {
  const mission = world.mission;
  mission.have = Math.min(mission.need, mission.have + amount);
  if (mission.id !== "find" && mission.id !== "flee") world.events.push({ type: "mission-count" });
  if (mission.have < mission.need) return;
  mission.done = true;
  mission.target = null;
  world.phase = "won";
  world.reef.pending += 1;
  world.events.push({ type: "reef" }, { type: "done" });
}

// The giant and the top hunter come from ahead, where the player is looking; an arrow on screen
// points at them (see paint.js). Sea friends count once each.
function followMission(world, step, width, height) {
  const mission = world.mission;
  if (!mission.active || mission.done || world.phase !== "playing") return;
  const ahead = world.player.direction || 1;
  if (mission.id === "find") {
    const giant = world.zone.giant;
    let target = world.friends.find(friend => friend.kind === giant);
    if (!target) {
      target = makeFriend(world, width, height, false, false, giant);
      Object.assign(target, { x: world.camera.x + ahead * (width / 2 + target.size + 80), y: world.player.y, direction: -ahead });
      world.friends.push(target);
    }
    mission.target = target;
    if (distance(world.player, target) < 110 + target.size) advanceMission(world, 1);
  } else if (mission.id === "flee") {
    const top = topTier(world.zone);
    mission.target = world.creatures.find(creature => creature.hunt && !creature.gone) ?? null;
    mission.wait -= step;
    if (!mission.target && mission.wait <= 0) {
      mission.target = { x: world.camera.x + ahead * (width / 2 + CREATURES[top].size * 1.6), y: world.player.y + (Math.random() - 0.5) * 120,
        tier: top, direction: -ahead, wobble: 0, art: null, hunt: true };
      world.creatures.push(mission.target);
    }
    advanceMission(world, step);
  } else if (mission.id === "friends") {
    const gentle = [...world.zone.friends, world.zone.giant];
    for (const { kind } of nearbyAnimals(world, width, height, mission.seen)) {
      if (!gentle.includes(kind) || world.phase !== "playing") continue;
      mission.seen.add(kind);
      mission.last = kind;
      advanceMission(world, 1);
    }
  }
}

function fillOcean(world, width, height, initial) {
  const target = Math.max(26, Math.min(54, Math.floor(width * height / 16000)));
  while (world.creatures.length < target) {
    world.creatures.push(makeCreature(world, width, height, initial));
  }
  const floorTarget = world.zone.floor ? Math.max(1, Math.round(width / 520)) : 0;
  while (world.friends.filter(friend => friend.floor).length < floorTarget) {
    world.friends.push(makeFriend(world, width, height, initial, true));
  }
  const swimTarget = Math.max(1, Math.round(width / 450));
  while (world.friends.filter(friend => !friend.floor).length < swimTarget) {
    world.friends.push(makeFriend(world, width, height, initial, false));
  }
}

// Sea friends not yet met this swim (or this mission) come first, so every swim shows someone new;
// of those, ones this device has never met come before all others, so a child who knows the first
// animals by heart soon meets the new ones. Now and then the zone's giant swims by.
function makeFriend(world, width, height, initial, floor, only = null) {
  const seen = world.mission.active ? world.mission.seen : world.greeted;
  const zone = world.zone;
  const choices = only ? [friendTraits(only)] : zone.friends.map(friendTraits).filter(friend => friend.floor === floor);
  const fresh = choices.filter(choice => !seen.has(choice.kind) &&
    !world.friends.some(friend => friend.kind === choice.kind));
  const unmet = fresh.filter(choice => !world.met.has(choice.kind));
  const giant = !floor && !only && Math.random() < 0.05 && !world.friends.some(friend => friend.kind === zone.giant);
  const pool = giant ? [friendTraits(zone.giant)] : unmet.length ? unmet : fresh.length ? fresh : choices;
  const { kind, size, speed } = pool[Math.floor(Math.random() * pool.length)];
  // Floor animals wait ahead of the fish, where it is heading; swimmers come from either side.
  const side = floor ? world.player.direction : Math.random() < 0.5 ? -1 : 1;
  let x = world.camera.x + (initial ? (Math.random() - 0.5) * width * 0.8 : side * (width / 2 + 60 + size * 2));
  if (initial && Math.abs(x - world.player.x) < 160) x += 320;
  const y = floor ? 0 : world.camera.y + (Math.random() - 0.5) * height * 0.6;
  return { kind, size, speed, floor, x, y, wobble: Math.random() * Math.PI * 2,
    direction: initial || floor ? (Math.random() < 0.5 ? -1 : 1) : -side };
}

function makeCreature(world, width, height, initial) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const horizontal = (Math.random() - 0.5) * width * 0.9;
  const vertical = (Math.random() - 0.5) * height * 0.84;
  let x = world.camera.x + (initial ? horizontal : side * (width / 2 + 45));
  const y = world.camera.y + vertical;
  if (initial && Math.abs(x - world.player.x) < 100 && Math.abs(vertical) < 100) x += 180;
  let tier = pickTier(world);
  if (initial && Math.hypot(x - world.player.x, vertical) < 260) tier = Math.min(tier, world.stage);
  // New arrivals start fully off screen (big fish need more room) and a little spread out, so they
  // swim in rather than popping in at the edge in a column. Kept tight so the ocean stays as busy.
  if (!initial) x += side * (Math.max(0, CREATURES[tier].size * 1.6 - 45) + Math.random() * width * 0.05);
  return {
    x,
    y,
    tier,
    direction: initial ? (Math.random() < 0.5 ? -1 : 1) : -side,
    wobble: Math.random() * Math.PI * 2
  };
}

// True when a fish that could hurt the player is on screen behind this box.
export function dangerBehind(world, box, width, height) {
  return world.creatures.some(creature => {
    if (!isDanger(world.stage, creature.tier)) return false;
    const reach = CREATURES[creature.tier].size * 1.6;
    const x = creature.x - world.camera.x + width / 2;
    const y = creature.y - world.camera.y + height / 2;
    return x > box.left - reach && x < box.right + reach && y > box.top - reach && y < box.bottom + reach;
  });
}

function pickTier(world) {
  const level = LEVELS[world.level] ?? LEVELS.little;
  const top = topTier(world.zone);
  // The biggest form's ocean holds every kind of fish but no tier-0 snack (great whites don't eat
  // plankton), and now and then the top hunter, where the zone has one.
  if (world.stage === SHARK) {
    return hasTopHunter(world.zone) && Math.random() < level.orcas ? top : 1 + Math.floor(Math.random() * (SHARK + 1));
  }
  const roll = Math.random();
  // Mostly snacks, a few of your own kind, and some bigger hunters.
  const [below, snack, school, hunter] = level.odds;
  const offset = roll < below ? -1 : roll < snack ? 0 : roll < school ? 1 : roll < hunter ? 2 : 3;
  return Math.max(0, Math.min(top, world.stage + offset));
}

// `paint` is the burst's colour, or the kind whose swatch colours it (paint.js looks it up).
function burst(world, x, y, paint, count) {
  for (let index = 0; index < count; index++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 65;
    world.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.55, ...paint });
  }
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}
