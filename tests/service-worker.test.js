import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

test("the offline cache holds every game module", () => {
  const worker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  for (const file of readdirSync(new URL("../src/", import.meta.url))) {
    assert.ok(worker.includes(`"./src/${file}"`), `sw.js does not cache src/${file}`);
  }
});

test("an update fetches fresh files instead of the browser's saved copies", () => {
  const worker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(worker, /cache: "reload"/);
});
