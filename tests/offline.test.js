import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const worker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const cached = [...worker.matchAll(/"\.\/([^"]*)"/g)].map(match => match[1]).filter(Boolean);

test("the offline cache holds every game script", () => {
  for (const file of readdirSync(new URL("../src", import.meta.url))) {
    assert.ok(cached.includes(`src/${file}`), `sw.js does not cache src/${file}`);
  }
});

test("every offline file exists", () => {
  assert.ok(cached.length > 5);
  for (const file of cached) assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `missing ${file}`);
});
