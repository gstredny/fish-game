# Fix: fair food chain and a safe start
Date: 2026-09-29
Severity: major
Source: Code review of task 001 (playable reef): lead review with real-browser runs via `tools/browser-play.mjs`
and `tools/browser-autoplay.mjs`, plus one blind reviewer with a 400-trial headless simulation of `src/world.js`.

## Problem
The one rule a five-year-old must learn is "eat what is smaller, run from what is bigger". At the first two
stages the game breaks that rule: the fish that hurt you are the same size as you or smaller. On top of that,
the player is unprotected at the start and predators spawn right beside them, so both dumb keyboard runs and
the phone touch run were hit within 2 seconds of pressing Dive in, and the simulation puts a hit inside the
first 3 seconds at 18–28% even for a fish that never moves.

## Investigation first
Before changing anything:
- [ ] Confirm the size table by reading `src/rules.js:1-15`: danger-to-player size ratio is 0.88, 1.04, 1.12, 1.24
      across the four stages that can be hurt. Only the last step is clearly bigger.
- [ ] Confirm `src/world.js:117` only nudges initial spawns that land inside a 100 px box, and that `begin()` in
      `src/main.js:57` leaves `invulnerable` at 0.
- [ ] Reproduce with `node tools/browser-play.mjs desktop` and look at the first HURT time in the events list.

## Findings (most severe first)
1. major | rules | `src/rules.js:1-15`, `src/world.js:80` | Predator sizes at tiers 1 and 2 are not visibly bigger
   than the player forms they hurt (anchovy 14 vs sprat 16, reef fish 24 vs coral fish 23), so the hurt message
   "Watch out, big fish!" contradicts what the child sees. → Re-space sizes so every predator is at least 1.3× the
   player it hurts and every snack is at most 0.8× the player that eats it, and add a data test that asserts the
   invariant over the whole table. Add a second cue a five-year-old reads faster than size: teeth on predators, a
   soft glow on snacks.
2. major | edge-case | `src/world.js:107-117`, `src/main.js:57` | No start grace: predators may spawn about 100 px away
   and the player has no invulnerability. Real runs: hit at 0.4 s, 1.6 s, and under 3 s by touch. Simulation, 400
   trials: idle sprat hurt within 3 s in 28% (phone) and 18% (desktop); swimming straight, 21–50%. → On `begin()` and
   after resume set `world.invulnerable` to about 2.5 s (the existing blink reads as "safe") and keep predators out of a
   260 px radius on the initial fill. Test: `createWorld` yields no tier > 0 creature within 260 px.
3. major | input | `src/main.js:105-108` | Touch steering ignores `pointerId`: any second finger or palm lifting sets
   the pointer to null and stops the fish while the first finger is still held, and a still finger sends no move
   event to restore it. → Store the steering pointer's id and clear only on a matching pointerup or pointercancel.
4. major | design | `src/world.js:108-110`, `src/paint.js:165-199` | After the win the spawn table clamps to tier 4, so
   the ocean becomes about 75% sharks and the player shark is nearly the same colour and shape as the crowd
   (`#b8d8eb` vs `#99b6cb`). Screenshot `auto-07-shark-exploring` shows twelve sharks and no reef fish. → At the top
   stage spawn across all tiers, and give the player a permanent bright outline so they never lose themselves.
5. minor | ux | `src/world.js:44-47`, `src/world.js:100-101` | The keep-alive box is about 3 screens per axis while the
   target count comes from screen area, so swimming halves what is on screen: simulation shows about 18 visible idle
   vs about 10 swimming on 390×844, danger share rising from 14% to about 30%, and 3.8% of samples swimming up show
   an empty screen. The phone screenshot shows five things. → Size the population from the visible area (or the cull
   box), and spawn replacements ahead of the movement direction, including top and bottom in portrait.
6. minor | bug | `src/main.js:111-114` | Holding P or Escape toggles pause on every key-repeat because `event.repeat`
   is not checked; children hold keys. → Return early when `event.repeat` is true.
7. minor | input | `src/main.js:74-77`, `src/main.js:121-122` | `resume()` and "Explore the ocean" do not clear keys or
   the pointer, and blur while not playing clears nothing, so a keyup lost while away can leave the fish drifting.
   → Clear both inputs in `resume()` and in the blur handler regardless of phase.
8. minor | input | `src/main.js:102-106`, `src/world.js:63-67` | The mouse steers on hover at full speed and the fish is
   always at screen centre, so a mouse user cannot stop except by parking within 24 px of centre; the hint only says
   "Touch and hold". → Require a held button for mouse steering, or scale speed with distance and widen the dead zone.
9. minor | render | `src/paint.js:110-121`, `src/paint.js:132-135` | Seaweed height and colour and coral colour come from
   the loop index while the x offset wraps every 100 px of parallax, so the whole seabed pops every ~263 px of travel
   (coral every ~436 px), about once a second at full speed. → Derive the slot index from `floor(offset / spacing)`.
10. minor | rules | `src/world.js:73` | Facing flips on a 1 px horizontal jitter when steering nearly straight up or
    down. → Update `direction` only when |horizontal| exceeds about 8 px.
11. minor | ux | `src/main.js:50-55`, `src/main.js:93-94` | The hurt toast stays visible behind the game-over blur and
    the "You became a shark!" toast is hidden under the won panel. → Clear the toast inside `showPanel`.
12. minor | ux | `src/main.js:34`, `index.html:36` | The "Touch and hold to swim" hint never disappears, even as a shark,
    and mentions arrow keys on phones. → Hide it after the first movement; word it per input type.
13. minor | ux | `src/main.js:115` | Enter only starts from the intro; on the result panels a keyboard child must reach
    for the mouse. → Accept Enter or Space on every panel.
14. minor | perf | `src/main.js:79-96`, `style.css:42,87,98,114,148` | The animation loop repaints the full scene at
    full rate in every phase, and the result overlay blurs the live canvas with `backdrop-filter` (four more blurs
    during play). Read from code; not measured on a phone. → Paint one frame and stop the loop while paused or on a
    result panel; consider opaque panel backgrounds instead of blur.
15. minor | pwa | `sw.js:1,17,29` | Cache-first with a hand-bumped name: a deploy that forgets the bump leaves installed
    phones on the old game; `cache.addAll` can precache from the HTTP cache; `caches.match` has no `ignoreSearch` or
    navigation fallback. → Precache with `cache: "reload"`, use `ignoreSearch`, fall back to `./index.html` for
    navigations, and make the version bump a checked step (or serve stale-while-revalidate).
16. minor | design | `src/world.js:35-39` | Predator chase is 10–18 px/s against a player at about 200 px/s, so it never
    changes an outcome. → Either make sharks do a short, telegraphed lunge when close, or delete the chase.
17. nit | mobile | `style.css:26-27,222`, `style.css:78-88`, `style.css:228` | HUD ignores left/right safe-area insets
    in landscape; `.hearts` swallows touches that start on it; the pause button is 37 px on phones, under the 44 px
    touch guideline and right where thumbs steer. → Use `max(24px, env(safe-area-inset-left/right))`, set
    `pointer-events: none` on `.hearts`, keep 44 px.
18. nit | compat | `index.html:5-8`, `main.js:136` | Chrome logs a deprecation for `apple-mobile-web-app-capable`; no
    `apple-mobile-web-app-title`, so iOS truncates the name; service worker registration has no `.catch`. → Add
    `<meta name="mobile-web-app-capable" content="yes">`, a short title meta, and a guarded registration.
19. test-gap | `tests/game.test.js` | No test ties FORMS and CREATURES sizes to `canEat` (would have caught the anchovy);
    the eat test uses distance 0 so collision radii are untested; the game-over test zeroes invulnerability by hand;
    the spawn test pins one random value so only the right side is checked; the pointer steering path, dead zone, WASD
    and top-stage spawn mix have no tests; `main.js` has no coverage.

Checked and fine: phone landscape intro fits (panel bottom 387 px of 390); no console errors in any run; desktop
and phone layouts have no visible defects.

## Fix steps (ordered)
1. `src/rules.js:1-15` → new size table meeting the 1.3× / 0.8× invariant; `tests/game.test.js` → invariant test (red first).
2. `src/main.js:57,74` → set `world.invulnerable = 2.5` in `begin()` and `resume()`; `src/world.js:107-117` → predator-free
   start radius; test.
3. `src/main.js:98-108` → track the steering `pointerId`.
4. `src/world.js:108-110` → uniform tier roll at the top stage; `src/paint.js:171-179` → stronger player outline.
5. `src/world.js:100-105` → population from visible area; spawn ahead of movement.
6. `src/main.js:111-122` → `event.repeat` guard, clear inputs in `resume()` and on blur, Enter/Space on panels.
7. `src/paint.js:110-135` → slot index from offset; `src/world.js:73` → facing dead zone.
8. `src/main.js:29-35` → clear toast in `showPanel`; hide hint after first movement.
9. `src/main.js:79-96` → stop the loop while not playing.
10. `sw.js` → `cache: "reload"`, `ignoreSearch`, navigation fallback; bump the cache name.
11. `index.html`, `style.css` → meta tags, safe-area insets, hearts pointer-events, 44 px pause button.

## Verification
- [x] `npm test` passes with the new invariant, safe-start, top-stage mix, and pointer tests (collision-radius test still open, finding 19).
- [x] `node tools/browser-play.mjs desktop` → first HURT no earlier than 3 s on three runs.
- [ ] `node tools/browser-play.mjs phone` → at least 10 creatures visible in the `playing-start` screenshot (finding 5, not started).
- [x] `node tools/browser-autoplay.mjs` → still reaches the shark; the `shark-exploring` screenshot shows a mix of fish.
- [ ] Both reviews left unchecked: real phone hardware (frame rate, touch feel, iOS Safari), a live GitHub Pages
      install and service-worker update cycle, and audio. Those need a hosted build and a real phone.

## Attempt log
- 2026-09-29: George picked "fix the big four first". Findings 1–4 done test-first, plus the cache name bump
  (`little-fish-v3`). Red run: `npm test` 8 passed, 4 failed for the expected reasons (tier 1 size 14 < 20; no safe
  period; only tiers 3,4 at stage 4; `src/steering.js` missing). Green run: 13 passed, 0 failed, 0 skipped; `node --check`
  clean on six runtime files. Files: `src/rules.js` (sizes 15/23/35/52/78 vs 6/19/29/44/66), `src/world.js`
  (`invulnerable: 2.5` at creation, `pickTier`, 260 px predator-free start), `src/steering.js` (new, owns which pointer
  steers), `src/main.js` (wires steering, 1.2 s grace on resume), `src/paint.js` (teeth and frown on predators, soft ring
  on prey, bright outline on the player), `sw.js`, `tests/game.test.js`, `tests/steering.test.js`.
- 2026-09-29: Browser evidence after the fix. `browser-play.mjs desktop` ×3 → first HURT at 22.5 s, 8.4 s, and never in
  60 s (before: 0.4 s and 1.6 s). `browser-play.mjs phone` → three hearts kept through the touch run (before: one lost
  inside 3 s). `browser-autoplay.mjs` → shark at 26.8 s game time, three hearts, `console errors: none`; the
  `shark-exploring` screenshot shows tuna, anchovies, reef fish and plankton around an outlined shark. Screenshots at
  1024×700 and 390×844 show teeth and frowns on predators and the ring on snacks. Findings 5–19 remain open.
