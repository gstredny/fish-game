# Fish that follows your finger, easy snacks, sideways phone

Date: 2026-09-29
Status: Done in code and in a headless phone-sized browser; not yet tried on George's own phone.

## Intent contract

George played on his phone and reported: "whenever I try to control the fish it controls every other fish but the
fish itself ... isn't moving. It's backwards inverted"; "I can't tell if he is eating the food ... it's really hard to
get the food"; "I just ran into a fish, how did I turn into a coral fish?"; "it needs to be full screen horizontal on
your phone".

- Today: the player is locked to the screen centre and the whole ocean scrolls, so steering looks like it moves
  everything except the player. A snack needs near-exact overlap and eating shows nothing near the fish. Growth says
  "You grew into a Coral fish!" with no reason. Phones play upright.
- After: the fish swims to the held finger (or mouse) and stops on it; the ocean scrolls only when the fish is more
  than a quarter screen from the centre. A snack counts the moment it touches the fish and shows a "+1" and a gulp;
  predators still need a real bump. Growth says "6 snacks! Now you're a Coral fish!". Phones play sideways: Dive in
  asks for full screen and a landscape lock where the browser allows it (Android); upright phones see "Turn your phone
  sideways to play" and the swim pauses. Panels fit a sideways phone, including Safari with its bars (844×340).
- Smoke test: `npm test`; with the local server and headless Chrome from the README, `node tools/browser-sideways.mjs`.

## Done criteria

- [x] `npm test` → 32 passed, 0 failed, 0 skipped (new: finger steering, edge scroll, snack reach with +1, predator
      brush, offline list, fresh-cache update).
- [x] `node tools/browser-sideways.mjs` → fish moved from screen (422,195) to the finger at (602,125) with the camera
      still at (0,0); finger at the left edge scrolled the camera to x −197 with the fish at screen x 211; a
      finger-on-snack child grew in 2–3 s; grow toast "6 snacks! Now you're a Coral fish!"; upright → paused with the
      turn prompt; all panel buttons on screen at 844×390 and 844×340; errors: none.
- [x] `node tools/browser-play.mjs desktop` and `phone` (now 844×390) run with no errors.
- [x] `node tools/browser-autoplay.mjs` → shark at 16.2 s game time, three hearts, console errors: none.
- [x] `node tools/browser-reef.mjs` → desktop and phone PASS, console errors 0.
- [x] No safety regression from the moving camera: 400 simulated one-direction swims on 844×390 (scratch
      `first-hurt-sim.mjs`) → hit by 6 s 7% before vs 5% after; median first hit 9.7 s vs 8.9 s.

## Not verifiable here

iPhone Safari has no full-screen API for pages, so on iPhone the game is sideways but keeps Safari's bars unless it
is opened from the home screen. Real touch feel and frame rate need a real phone.

## Attempt log

- 2026-09-29: Tests first: 4 new tests failed on the old code (finger steering, edge scroll, +1 on touch, fresh-cache
  update); after the change 32 passed. New `src/camera.js` owns when the view follows the fish and screen-to-ocean
  conversion (movement, planting by touch, drawing).
- 2026-09-29: First sideways browser run showed the win panel's buttons below the bottom edge at 844×390 and 844×340
  (the reef panel scrolled). Added a short-screen layout; both sizes then fit.
- 2026-09-29: A single keyboard run was hit at 2.0 s, which looked like a regression. The 400-swim simulation above
  shows it was chance.
- 2026-09-29: Existing browser scripts assumed a centred fish (autoplay aimed from screen centre) and upright phones;
  updated to aim from the fish and to play phones sideways.
