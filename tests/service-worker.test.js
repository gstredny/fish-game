import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

test("the offline cache holds every game module and picture", () => {
  const worker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const files = folder => readdirSync(new URL(`../${folder}/`, import.meta.url), { withFileTypes: true })
    .flatMap(entry => entry.isDirectory() ? files(`${folder}/${entry.name}`) : [`${folder}/${entry.name}`]);
  const found = [...files("src"), ...files("art")];
  assert.ok(found.some(file => file.startsWith("art/animals/")), "the animal photos should be in art/animals");
  for (const file of found) assert.ok(worker.includes(`"./${file}"`), `sw.js does not cache ${file}`);
  for (const [, file] of worker.matchAll(/"\.\/((?:src|art)\/[^"]+)"/g)) {
    assert.ok(found.includes(file), `sw.js caches ${file}, which does not exist`);
  }
});

test("an update fetches fresh files instead of the browser's saved copies", () => {
  const worker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.match(worker, /cache: "reload"/);
});
