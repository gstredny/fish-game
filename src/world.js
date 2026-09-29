import { canEat, CREATURES, FLOOR, FORMS, isDanger, isFriend, nextGrowth, SEA_FRIENDS } from "./rules.js";
import { createReef, isSheltered } from "./reef.js";
import { followPlayer, toWorld } from "./camera.js";

export function createWorld(width, height, reef = createReef()) {
  const home = reef.corals[0];
  const start = { x: home ? home.x - 100 : 0, y: home ? home.y : 0 };
  const world = {
    player: { ...start, direction: 1 },
    camera: { ...start },
    reef,
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
    // Learning: kinds already met this swim, floating name tags, and when the next fact card may open.
    greeted: new Set(),
    labels: [],
    nextCardAt: 5
  };
  fillOcean(world, width, height, true);
  return world;
}

export function resetWorld(world, width, height) {
  Object.assign(world, createWorld(width, height, world.reef));
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

  for (const creature of world.creatures) {
    creature.x += creature.direction * CREATURES[creature.tier].speed * step;
    creature.y += Math.sin(world.time * 2 + creature.wobble) * 8 * step;
    const gap = distance(world.player, creature);
    if (!world.sheltered && isDanger(world.stage, creature.tier) && gap < 180) {
      const chase = creature.tier === CREATURES.length - 1 ? 18 : 10;
      creature.x += Math.sign(world.player.x - creature.x) * chase * step;
      creature.y += Math.sign(world.player.y - creature.y) * chase * step;
    } else if (isFriend(world.stage, creature.tier) && gap < 220) {
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
}

// Animals close enough to meet, nearest first: one per kind, skipping kinds already met this swim.
// Floor animals sit on the sea bed at the bottom of the screen, so the fish meets them by swimming low.
export function nearbyAnimals(world, width, height) {
  const found = new Map();
  const left = world.camera.x - width / 2, top = world.camera.y - height / 2;
  const onScreen = spot => spot.x > left && spot.x < left + width && spot.y > top && spot.y < top + height;
  const consider = (kind, target, gap, reach, lift) => {
    if (world.greeted.has(kind) || gap > reach || gap >= (found.get(kind)?.gap ?? Infinity)) return;
    found.set(kind, { kind, target, gap, lift });
  };
  for (const creature of world.creatures) {
    if (creature.gone || !onScreen(creature)) continue;
    const { kind, size } = CREATURES[creature.tier];
    consider(kind, creature, distance(world.player, creature), 130 + size, size + 16);
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
  let move = (235 - world.stage * 9) * step;

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
    burst(world, creature.x, creature.y, CREATURES[creature.tier].color, 7);
    world.particles.push({ x: creature.x, y: creature.y - 12, vx: 0, vy: -55, life: 0.9, color: "#fff4ad", text: "+1" });
    const growth = nextGrowth(world.stage, world.bites + 1);
    world.stage = growth.stage;
    world.bites = growth.bites;
    world.events.push({ type: growth.grew ? "grow" : "eat" });
    if (world.stage === FORMS.length - 1 && growth.grew) {
      world.phase = "won";
      world.reef.pending += 1;
      world.events.push({ type: "reef" });
    }
    return;
  }

  if (world.invulnerable > 0 || isSheltered(world)) return;
  creature.gone = true;
  world.hearts -= 1;
  world.invulnerable = 2.4;
  burst(world, world.player.x, world.player.y, "#ffdaab", 14);
  world.events.push({ type: "hurt", by: CREATURES[creature.tier].kind });
  if (world.hearts === 0) world.phase = "gameover";
}

function fillOcean(world, width, height, initial) {
  const target = Math.max(26, Math.min(54, Math.floor(width * height / 16000)));
  while (world.creatures.length < target) {
    world.creatures.push(makeCreature(world, width, height, initial));
  }
  const floorTarget = Math.max(1, Math.round(width / 520));
  while (world.friends.filter(friend => friend.floor).length < floorTarget) {
    world.friends.push(makeFriend(world, width, height, initial, true));
  }
  if (!world.friends.some(friend => !friend.floor)) world.friends.push(makeFriend(world, width, height, initial, false));
}

// Sea friends not yet met this swim come first, so every swim shows someone new.
function makeFriend(world, width, height, initial, floor) {
  const choices = SEA_FRIENDS.filter(friend => friend.floor === floor);
  const fresh = choices.filter(choice => !world.greeted.has(choice.kind) &&
    !world.friends.some(friend => friend.kind === choice.kind));
  const pool = fresh.length ? fresh : choices;
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
  return {
    x,
    y,
    tier,
    direction: initial ? (Math.random() < 0.5 ? -1 : 1) : -side,
    wobble: Math.random() * Math.PI * 2
  };
}

function pickTier(world) {
  // The shark's ocean holds every kind of fish, but no plankton: great whites don't eat it.
  if (world.stage === FORMS.length - 1) return 1 + Math.floor(Math.random() * (CREATURES.length - 1));
  const roll = Math.random();
  // Mostly snacks, a few of your own kind, and about one in four bigger hunters.
  const offset = roll < 0.25 ? -1 : roll < 0.65 ? 0 : roll < 0.75 ? 1 : roll < 0.95 ? 2 : 3;
  return Math.max(0, Math.min(CREATURES.length - 1, world.stage + offset));
}

function burst(world, x, y, color, count) {
  for (let index = 0; index < count; index++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 65;
    world.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.55, color });
  }
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}
