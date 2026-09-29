import { canEat, CREATURES, FORMS, nextGrowth } from "./rules.js";
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
    phase: "ready",
    time: 0,
    creatures: [],
    particles: [],
    events: []
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
  movePlayer(world, input, step, width, height);
  followPlayer(world.camera, world.player, width, height);
  const wasSheltered = world.sheltered;
  world.sheltered = isSheltered(world);

  for (const creature of world.creatures) {
    creature.x += creature.direction * CREATURES[creature.tier].speed * step;
    creature.y += Math.sin(world.time * 2 + creature.wobble) * 8 * step;
    if (!world.sheltered && creature.tier > world.stage && distance(world.player, creature) < 180) {
      const chase = creature.tier === 4 ? 18 : 10;
      creature.x += Math.sign(world.player.x - creature.x) * chase * step;
      creature.y += Math.sign(world.player.y - creature.y) * chase * step;
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
  world.particles = world.particles.filter(particle => particle.life > 0);
  for (const particle of world.particles) {
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;
    particle.life -= step;
  }
  fillOcean(world, width, height, false);
}

function movePlayer(world, input, step, width, height) {
  let horizontal = Number(input.keys.has("ArrowRight") || input.keys.has("d")) -
    Number(input.keys.has("ArrowLeft") || input.keys.has("a"));
  let vertical = Number(input.keys.has("ArrowDown") || input.keys.has("s")) -
    Number(input.keys.has("ArrowUp") || input.keys.has("w"));
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
  if (distance(world.player, creature) > playerSize * 0.68 + CREATURES[creature.tier].size * 0.62) return;

  if (canEat(world.stage, creature.tier)) {
    creature.gone = true;
    burst(world, creature.x, creature.y, CREATURES[creature.tier].color, 7);
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
  world.events.push({ type: "hurt" });
  if (world.hearts === 0) world.phase = "gameover";
}

function fillOcean(world, width, height, initial) {
  const target = Math.max(26, Math.min(54, Math.floor(width * height / 16000)));
  while (world.creatures.length < target) {
    world.creatures.push(makeCreature(world, width, height, initial));
  }
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
  if (world.stage === FORMS.length - 1) return Math.floor(Math.random() * CREATURES.length);
  const roll = Math.random();
  const offset = roll < 0.25 ? -1 : roll < 0.7 ? 0 : roll < 0.94 ? 1 : 2;
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
