// Two children can share a phone: each player has their own Ocean book, reef, level and place to
// swim. Player 1 keeps the keys the game always used, so a save from before players stays theirs.
export const PLAYER_KEY = "little-fish-player-v1";
export const PLAYERS = ["1", "2"];

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
    setItem: (name, value) => storage.setItem(key(name), value)
  };
}
