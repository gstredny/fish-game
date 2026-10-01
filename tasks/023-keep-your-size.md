# Keep your size after losing all your hearts

Date: 2026-10-01
Status: LIVE on GitHub Pages (95d89d0, Pages run 36931929051, cache `little-fish-v29`). George's phone try is his to do
Branch: `master`

George's ask: "why can't it save where they were when they died? Like, it should save at the level
right. They shouldn't have to start over."

## Intent contract

Today: losing the last heart shows "One more swim? Every big fish starts out little." and Try again
(or Home, then the same place) starts over as the littlest fish. Levels finished and the Ocean book are
already saved; the fish's size is not.

After: losing the last heart saves the size the fish was in that place, for this player. Try again,
or Home and the same place later (even after closing the app), starts the swim at that size with three
full hearts and says that size's food-chain line. The game-over screen says "You keep your size.
You'll start again as a lionfish." Dying as the biggest form starts the swim as the biggest form, with
its mission. Finishing the place's mission clears the saved size, so the next swim there starts little.
Each place keeps its own size; Erase clears them.

Assumption (George can veto in one line): only losing all hearts saves the size; leaving mid-swim
(Home, closing the app) does not.

## Smoke test (no code, just clicks)

1. Reef: grow to a lionfish, lose all three hearts. The screen says you'll start again as a lionfish.
2. Try again: you are a lionfish with three hearts.
3. Home, then the reef again (or close and reopen the app): still a lionfish.
4. Lose all hearts as the biggest form: Try again starts as the biggest with the mission card.
5. Finish the reef's mission, then Play again: a little damselfish again.

## Done criteria

- [x] `node --test tests/keep-size-flow.test.js`: all pass (seen failing first).
- [x] `npm test`: all pass (real counts in the log).
- [x] `git diff --check` clean; `sw.js` bumped and caches `src/checkpoints.js`.
- [x] Game-over screen looked at in a muted headless browser (844x390).
- [x] Pushed 95d89d0; Pages run 36931929051 "completed success"; live `sw.js` = `little-fish-v29`, live
      `src/checkpoints.js` and `index.html` with `#gameover-text` served.

## Attempt log (append-only)
- 2026-10-01: red first: `node --test tests/keep-size-flow.test.js` 0 passed, 5 failed (no `#gameover-text`,
  stage 0 after Try again). Built `src/checkpoints.js` (`little-fish-checkpoint-v1`, per player, a size per
  place), `stage` option in `createWorld`, exported `startMission` and `article`; `startSwim` starts at the
  saved size (biggest form: mission at once), `showGameOver` saves it and says so, a finished mission clears
  it, Erase clears it. `sw.js` `little-fish-v29` with `src/checkpoints.js`. Green: 5 passed, 0 failed.
  `npm test`: 122 passed, 0 failed, 0 cancelled, 0 skipped. `git diff --check` clean.
- 2026-10-01: George OK'd a muted browser look and shipping (AskUserQuestion: "Check silently + put online").
  Headless Chrome `--mute-audio`, new `tools/browser-keep-size.mjs`: "keep-size check passed" (844x390 touch,
  1280x800). Looked at the shots: game-over reads "You keep your size. You'll start again as a lionfish.",
  Try again and Home fit; Try again shows Lionfish, three hearts. `browser-levels`, `browser-coral`,
  `browser-quiz` passed again. README: a paragraph under Missions, and the new check in the list.
- 2026-10-01: pushed 95d89d0 (`git ls-remote` shows it). Pages run 36931929051 completed success. Live `sw.js`:
  `const CACHE = "little-fish-v29";`; live `src/checkpoints.js` served; live `index.html` has `id="gameover-text"` (1).
