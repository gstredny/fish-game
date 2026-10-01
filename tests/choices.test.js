import test from "node:test";
import assert from "node:assert/strict";
import { pickChoices } from "../src/choices.js";
import { zoneKinds, ZONES } from "../src/zones.js";

test("the answers are the right animal and two others from the same place, each once", () => {
  const pool = zoneKinds(ZONES.reef);
  for (let round = 0; round < 50; round++) {
    const choices = pickChoices("lionfish", pool);
    assert.equal(choices.length, 3);
    assert.ok(choices.includes("lionfish"));
    assert.equal(new Set(choices).size, 3);
    for (const kind of choices) assert.ok(pool.includes(kind), `${kind} lives on the reef`);
  }
});

test("the answers change from one time to the next", () => {
  const pool = zoneKinds(ZONES.reef);
  const seen = new Set();
  const spots = new Set();
  for (let round = 0; round < 50; round++) {
    const choices = pickChoices("lionfish", pool);
    seen.add(choices.filter(kind => kind !== "lionfish").sort().join());
    spots.add(choices.indexOf("lionfish"));
  }
  assert.ok(seen.size > 10, "different wrong answers");
  assert.equal(spots.size, 3, "the right one moves around");
});
