// One short reef encounter, with no save state or ordinary-world progress.
export function createPufferSwim(width, height) {
  const state = { phase: "intro", time: 0, width, height, puff: 0, puffLeft: 0, defended: false, defendedAt: null,
    warned: false, reminded: false, shelterReached: false, events: [], player: { x: width * 0.24, y: height * 0.45, direction: 1 },
    hunter: { x: width * 0.82, y: height * 0.45, direction: -1, phase: "waiting" }, shelter: {} };
  resizePufferSwim(state, width, height);
  return state;
}

export function resizePufferSwim(state, width, height) {
  const sx = width / state.width, sy = height / state.height;
  state.player.x *= sx;
  state.player.y *= sy;
  state.hunter.x *= sx;
  state.hunter.y *= sy;
  state.width = width;
  state.height = height;
  state.shelter = { x: width * 0.82, y: height * 0.45 };
  keepClear(state.player, width, height);
}

export function puffPuffer(state) {
  if (state.phase !== "playing" || state.puffLeft > 0) return false;
  state.puffLeft = 3;
  return true;
}

export function swimPuffer(state, seconds, input) {
  if (state.phase !== "playing") return;
  const step = Math.min(seconds, 0.05);
  state.time += step;
  state.puffLeft = Math.max(0, state.puffLeft - step);
  state.puff = Math.max(0, Math.min(1, state.puff + (state.puffLeft > 0 ? 5 : -2) * step));
  if (!state.shelterReached) movePuffer(state, input, step);
  const hunter = state.hunter;
  if (!state.warned && state.time >= 1.8) {
    state.warned = true;
    hunter.phase = "warning";
    state.events.push("warning");
  }
  if (hunter.phase === "warning" && state.time >= 5.3) hunter.phase = "approaching";
  if (hunter.phase === "warning" || hunter.phase === "approaching") approach(state, step);
  if (hunter.phase === "retreating") {
    hunter.x += state.width * 0.3 * step;
    if (hunter.x > state.width + 100) hunter.phase = "gone";
  }
  if (state.phase !== "playing") return;
  const atShelter = Math.hypot(state.player.x - state.shelter.x, state.player.y - state.shelter.y) <= 46;
  if (state.defended && atShelter) {
    state.shelterReached = true;
    Object.assign(state.player, state.shelter);
  }
  if (state.shelterReached && state.time - state.defendedAt >= 1.3) {
    state.phase = "won";
    state.events.push("won");
  } else if (atShelter && !state.defended && !state.reminded) {
    state.reminded = true;
    state.events.push("practise");
  }
}

function approach(state, step) {
  const { hunter, player } = state;
  const dx = player.x - hunter.x, dy = player.y - hunter.y;
  const gap = Math.hypot(dx, dy);
  if (state.puff >= 0.55 && gap < 160) {
    state.defended = true;
    state.defendedAt = state.time;
    hunter.phase = "retreating";
    hunter.direction = 1;
    state.events.push("defended");
    return;
  }
  if (hunter.phase === "warning") return;
  if (gap < 58) {
    state.phase = "retry";
    state.events.push("retry");
    return;
  }
  const move = state.width * 0.045 * step;
  hunter.x += dx / gap * move;
  hunter.y += dy / gap * move;
  if (Math.abs(dx) >= 1) hunter.direction = Math.sign(dx);
}

function movePuffer(state, input, seconds) {
  const { player } = state;
  let x = Number(input.keys.has("ArrowRight") || input.keys.has("d")) -
    Number(input.keys.has("ArrowLeft") || input.keys.has("a")) + (input.pad?.x ?? 0);
  let y = Number(input.keys.has("ArrowDown") || input.keys.has("s")) -
    Number(input.keys.has("ArrowUp") || input.keys.has("w")) + (input.pad?.y ?? 0);
  let distance = Math.hypot(x, y);
  let move = (state.puff > 0.1 ? 60 : 145) * seconds;
  if (!distance && input.pointer) {
    x = input.pointer.x - player.x;
    y = input.pointer.y - player.y;
    distance = Math.hypot(x, y);
    move = Math.min(move, distance);
  }
  if (!distance) return;
  player.x += x / distance * move;
  player.y += y / distance * move;
  if (Math.abs(x) >= 1) player.direction = Math.sign(x);
  keepClear(player, state.width, state.height);
}

// Leave room for the inflated body above both thumb controls, including the short phone.
function keepClear(player, width, height) {
  const padSize = Math.max(120, Math.min(160, height * 0.38));
  const puffSize = Math.max(96, Math.min(120, height * 0.3));
  player.x = Math.max(52, Math.min(width - 52, player.x));
  player.y = Math.max(102, Math.min(height - 52, player.y));
  if (player.x < 18 + padSize + 52) player.y = Math.min(player.y, height - padSize - 16 - 52);
  if (player.x > width - 18 - puffSize - 52) player.y = Math.min(player.y, height - puffSize - 16 - 52);
}
