# Slower fish for Little and Big swimmer

Date: 2026-10-01
Status: in progress
Branch: `master`

George's ask (after v27): "make it a little easier for the little swimmers and the big swimmers? The big
swimmer is still way too fast. And the little swimmer's still ... a little too hard for the kids like the
fish are still a little too fast."

## Intent contract

Today: every food-chain animal swims at its full speed in both games (13 to 76 px/s by size). Big
swimmer's hunters turn and chase at 50% of your speed (the orca 65%); Little swimmer's orca chases at 50%.

After: Little swimmer's animals swim at 75% of that speed and its orca chases at 40%. Big swimmer's
animals swim at 85%, its hunters chase at 35% of your speed and the orca at 45%. Your own speed, the
snacks needed, hearts and safe time stay the same. Slower snacks are easier to catch too.

## Smoke test (no code, just clicks)

1. Little swimmer, reef: fish drift by more slowly; the orca, when it comes, is easy to swim away from.
2. Big swimmer: a hunter still turns and follows you, but you pull away from it easily.

## Done criteria

- [x] `node --test tests/game.test.js`: the new slower-swim checks pass (seen failing first).
- [x] `npm test`: all pass (real counts in the log).
- [x] `git diff --check` clean; `sw.js` cache bumped.
- [ ] Pushed; Pages deploy success; live `sw.js` shows the new cache.

## Attempt log (append-only)
- 2026-10-01: red first: `node --test tests/game.test.js` 20 passed, 2 failed ("but slowly, well under half your
  speed (33px)"; "Big swimmer: 54 of 54px"). Added `pace` to `LEVELS` (little 0.75, big 0.85) used by
  `swimAlong`; Big `chase` 0.5 → 0.35, `orcaChase` 0.65 → 0.45; Little `orcaChase` 0.5 → 0.4. `sw.js`
  `little-fish-v28`; README lines updated. `tests/game.test.js`: 22 passed, 0 failed. `npm test`: 117 passed,
  0 failed, 0 cancelled, 0 skipped. `git diff --check` clean. No browser run: no screen changed, only speeds.
