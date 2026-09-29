import test from "node:test";
import assert from "node:assert/strict";
import { DRAWINGS_KEY, loadDrawings, MAX_DRAWINGS, saveDrawing } from "../src/gallery.js";

const png = name => `data:image/png;base64,${name}`;

function memoryStorage(limit = Infinity) {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem(key, value) {
      if (value.length > limit) throw new Error("QuotaExceededError");
      values.set(key, value);
    }
  };
}

test("drawings are kept newest first and survive a reload", () => {
  const storage = memoryStorage();
  saveDrawing(storage, png("a"));
  const drawings = saveDrawing(storage, png("b"));
  assert.deepEqual(drawings, [png("b"), png("a")]);
  assert.deepEqual(loadDrawings(storage), [png("b"), png("a")]);
});

test("only the newest drawings are kept", () => {
  const storage = memoryStorage();
  for (let index = 0; index < MAX_DRAWINGS + 5; index++) saveDrawing(storage, png(index));
  const drawings = loadDrawings(storage);
  assert.equal(drawings.length, MAX_DRAWINGS);
  assert.equal(drawings[0], png(MAX_DRAWINGS + 4));
});

test("stored values that are not fish drawings are ignored", () => {
  const storage = memoryStorage();
  storage.setItem(DRAWINGS_KEY, JSON.stringify([png("a"), "javascript:alert(1)", 7, "data:text/html,x"]));
  assert.deepEqual(loadDrawings(storage), [png("a")]);
  storage.setItem(DRAWINGS_KEY, "{not json");
  assert.deepEqual(loadDrawings(storage), []);
});

test("a full store drops old drawings but keeps the new one", () => {
  const storage = memoryStorage(JSON.stringify([png("new"), png("old1")]).length);
  const drawings = saveDrawing(storage, png("new"), [png("old1"), png("old2")]);
  assert.deepEqual(drawings, [png("new"), png("old1"), png("old2")]);
  assert.deepEqual(loadDrawings(storage), [png("new"), png("old1")]);
});

test("without storage the drawing still plays for this visit", () => {
  assert.deepEqual(loadDrawings(null), []);
  assert.deepEqual(saveDrawing(null, png("a")), [png("a")]);
});
