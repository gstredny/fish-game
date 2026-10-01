// Three children can share a phone: each save spot has its own name, Ocean book, reef, level,
// levels finished and place to swim. Spot 1 keeps the keys the game always used, so a save from
// before spots stays theirs.
export const PLAYER_KEY = "little-fish-player-v1";
export const NAME_KEY = "little-fish-name-v1";
export const PLAYERS = ["1", "2", "3"];

export function savedPlayer(storage) {
  try {
    const player = storage.getItem(PLAYER_KEY);
    return PLAYERS.includes(player) ? player : "1";
  } catch {
    return "1";
  }
}

// The phone's storage, with every key this player saves marked as theirs.
export function playerSaves(storage, player) {
  const key = name => player === "1" ? name : `${name}-player-${player}`;
  return {
    getItem: name => storage.getItem(key(name)),
    setItem: (name, value) => storage.setItem(key(name), value),
    removeItem: name => storage.removeItem(key(name))
  };
}

// A typed name, tidied: one space between words, at most twelve letters; blank means no name.
export function cleanName(text) {
  return text.trim().replace(/\s+/g, " ").slice(0, 12).trim();
}
