import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Holding an arrow on an iPhone must not pop up Copy / Look Up on the nearest text.
// The pad is already unselectable; Safari then selects the closest text that is not,
// so the rule has to cover the whole page.
test("the whole page is unselectable, so holding the pad selects nothing", () => {
  const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
  const body = css.match(/^body \{([^}]*)\}/m)?.[1] ?? "";
  for (const rule of ["user-select: none", "-webkit-user-select: none", "-webkit-touch-callout: none"]) {
    assert.ok(body.includes(rule), `body rule is missing "${rule}"`);
  }
});
