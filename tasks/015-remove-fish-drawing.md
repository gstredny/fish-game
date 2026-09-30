# Remove fish drawing

Date: 2026-09-30
Status: shipping authorized; automated verification passed; browser verification blocked

## Intent contract

Today: saved colored drawings override the player's species and some NPC species. The spoken
names change while the same drawing keeps swimming, which makes the food chain confusing.

After: the drawing screen and mode switch are removed. Every swimmer uses its built-in species
artwork. Growing changes the player's artwork to the named species. Existing saved drawings and
the old mode preference have no effect, including after Home, zone changes and reloads.

Slice order: remove the drawing path; remove its orphan code, UI, cache entries and checks;
verify old saved data, growth and zone changes; inspect desktop and sideways-phone screenshots.

## Done criteria

- [x] `node --test tests/built-in-fish-flow.test.js`: old saved data cannot activate drawings.
- [x] `npm test`: all remaining gameplay, species, learning and cache checks pass.
- [ ] `node tools/browser-check.mjs`: desktop and sideways-phone smoke checks pass; screenshots inspected.
- [x] `git diff --check`: clean.
- [x] Update `tasks/active-handoff.md` with exact verification and ship state.
- [ ] `git ls-remote origin refs/heads/master`: includes the removal commit.
- [ ] `gh api repos/gstredny/fish-game/actions/runs`: Pages deployment succeeds for the pushed commit.
- [ ] `curl -fsS https://gstredny.github.io/fish-game/sw.js`: live cache is `little-fish-v19`;
  live HTML and renderer use built-in animals without drawing controls or overrides.

## Attempt log (append-only)

- Preflight: checkout on `master`, `git status --short` empty, HEAD bb76625. No other agent
  process has this repository as its working directory; local node processes are browser helpers.
  Existing task/handoff files read. This is a separate correction to the completed drawing feature.
- Browser runtime setup succeeded, but selection returned `No browser is available`.
  Read bootstrap troubleshooting. No local server/Chrome listens on 8778/9444.
  The prior task records audio playing on this Mac; browser QA must mute audio.
- Regression before removal: `node --test tests/built-in-fish-flow.test.js`: 0 passed,
  1 failed, 0 skipped (`draw-button is removed` failed). Browser discovery returned `[]`.
- First removal slice: player/NPC overrides, drawing controls and async decoding removed.
  `node --test tests/built-in-fish-flow.test.js`: 0 passed, 1 failed, 0 skipped;
  the regression caught the remaining win-screen drawing thumbnail (`won-art`). Removing it.
- Removed orphan drawing modules, portraits, styles, cache entries and retired drawing tests.
  The regression then reached growth but failed because the new test called `goalFor(stage)`;
  its actual signature is `goalFor(level, stage)`. Correcting the test call.
  The installed Playwright browser is available for standalone, muted smoke checks.
- `node --test tests/built-in-fish-flow.test.js`: 1 passed, 0 failed, 0 skipped,
  covering both old mode preferences, four zones, all five growth stages, Home and reload.
  `npm test > /tmp/fish-remove-drawing-tests.log 2>&1`: exit 0; 107 passed, 0 failed,
  0 cancelled, 0 skipped. Removed 10 retired drawing tests; added the saved-data regression.
- `node tools/browser-check.mjs screenshots/remove-drawing`: exit 1 before any browser cases.
  Local HTTP server creation failed with `listen EPERM: operation not permitted 127.0.0.1`.
  Switching this standalone static-app smoke runner to intercepted file responses, which needs no
  listening port. `git diff --check`: exit 0.
- Port-free browser attempt: `node tools/browser-check.mjs screenshots/remove-drawing`: exit 1.
  Chromium launched but macOS denied its required Mach port: `bootstrap_check_in ... Permission
  denied (1100)`. No browser cases ran and no screenshots were produced. No permission bypass or
  additional launch attempt. Browser verification stays open. Adding a renderer regression for
  retired player/NPC artwork; it executes real paint code with a recording canvas, not a browser.
- Final automated verification:
  - `node --test tests/built-in-fish-flow.test.js tests/paint.test.js`: 5 passed, 0 failed,
    0 cancelled, 0 skipped. Actual main-module growth uses the correct HUD species through every
    zone; actual canvas paint code ignores supplied retired player/NPC bitmaps in all 20 forms.
  - `npm test > /tmp/fish-remove-drawing-tests.log 2>&1`: exit 0.
    Output: `tests 108`, `pass 108`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`.
  - `node --check tools/browser-check.mjs`, `node --check tools/browser-zones.mjs`,
    `node --check tools/browser-update.mjs`: each exit 0. Removed obsolete drawing cases;
    the replacement screenshot runner covers old saved data, species rendering, growth and Home.
  - Search of src, HTML, cache, CSS and README finds no imports or UI references to retired
    drawing modules or controls. `git diff --check`: exit 0.
- Ship state: all changes remain uncommitted on master; no push or deployment performed.
  Cache prepared as `little-fish-v19`. Browser task criterion remains unchecked because of
  the recorded environment failures. Next command when a browser-capable environment is available:
  `node tools/browser-check.mjs screenshots/remove-drawing`, then inspect the screenshots.
- George authorized shipping: "ok commit and push so I can test on my phone". Proceeding with
  the exact tested removal despite the already reported local browser limitation.
  Pre-commit checks: `git diff --check` exit 0; index empty, no index lock; only this root agent
  is running in the collaboration tree, and the authored diff is unchanged. Prior test log confirms
  108 passed, 0 failed, 0 cancelled, 0 skipped. Remote preflight:
  `git ls-remote origin refs/heads/master` exit 0, bb7662576239f2c0ca00557730592bea759f7b67,
  matching local HEAD. `gh api repos/gstredny/fish-game/pages` exit 0: source master at /,
  status built, https://gstredny.github.io/fish-game/.
