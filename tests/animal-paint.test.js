import test from "node:test";
import assert from "node:assert/strict";
import { paintAnimal } from "../src/animal-paint.js";
import { SEA_FRIENDS } from "../src/rules.js";

// Every canvas call succeeds and does nothing; drawing an animal with no painter throws instead.
const canvas = () => new Proxy({}, { get: (target, key) => target[key] ?? (String(key).startsWith("create") ?
  () => ({ addColorStop() {} }) : () => {}), set: (target, key, value) => { target[key] = value; return true; } });

test("every sea friend has a drawing, so meeting it never stops the game", () => {
  for (const { kind, size, floor } of SEA_FRIENDS) {
    for (const direction of [1, -1]) {
      for (const time of [0, 1.3, 7.9]) {
        assert.doesNotThrow(() => paintAnimal(canvas(), kind, 100, 100, size, direction, time, floor ? "floor" : "friend", { puff: 0.5 }), kind);
      }
    }
  }
});
