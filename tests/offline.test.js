import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("every file the offline cache lists exists", () => {
  const worker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const cached = [...worker.matchAll(/"\.\/([^"]*)"/g)].map(match => match[1]).filter(Boolean);
  assert.ok(cached.length > 5);
  for (const file of cached) assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `missing ${file}`);
});
