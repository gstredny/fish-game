// Saved fish drawings, newest first. Storage may be missing or full; play
// continues with the drawings held in memory.
export const DRAWINGS_KEY = "little-fish-drawings";
export const MAX_DRAWINGS = 30;

export function isDrawing(value) {
  return typeof value === "string" && value.startsWith("data:image/png;base64,");
}

export function loadDrawings(storage) {
  try {
    const list = JSON.parse(storage.getItem(DRAWINGS_KEY) || "[]");
    return Array.isArray(list) ? list.filter(isDrawing).slice(0, MAX_DRAWINGS) : [];
  } catch {
    return [];
  }
}

export function saveDrawing(storage, drawing, current = loadDrawings(storage)) {
  const drawings = [drawing, ...current].slice(0, MAX_DRAWINGS);
  for (let kept = drawings.length; kept > 0; kept--) {
    try {
      storage.setItem(DRAWINGS_KEY, JSON.stringify(drawings.slice(0, kept)));
      break;
    } catch {
      // Full or unavailable storage: keep fewer old drawings, then none.
    }
  }
  return drawings;
}
