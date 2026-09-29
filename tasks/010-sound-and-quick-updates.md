# Sound for the main moments, and updates on the first open

Date: 2026-09-29
Status: Done in code and in headless desktop and sideways-phone browsers; not yet heard on George's phone.

## Intent Contract

### Today the customer/user sees
George: "Are you saying sound is left? … Just get the sound of the main things working." The game is silent. An update only appears the second time the game is opened.

### After this change the customer/user should see
- Sounds for the main moments, made in the game with no sound files:
  - a bubbly "nom" for each snack;
  - a rising chime when the fish grows;
  - a soft "bonk" when a big fish bumps it;
  - a fanfare on becoming the shark;
  - a gentle three-note tune on game over.
- Sound starts after the first tap, as phones require. The game's speaker button (🔊/🔇) turns the sounds and the voice off together. The iPhone's silent switch and volume buttons also control the sounds.
- From the next update on, a new version shows the first time the game is opened, as long as nobody is mid-swim.

### Smoke test (no code, just clicks)
1. Open the Little Fish icon twice, so this version loads.
2. Make sure the iPhone's silent switch is off and the volume is up.
3. Tap Dive in or Just swim, and eat a snack: "nom".
4. Keep eating until the fish grows: chime. Bump a bigger fish: bonk.
5. Grow into a shark: fanfare. Lose all three hearts: game-over tune.

### Out of scope for this contract
- Background music.
- A separate sound button: the voice's speaker button now controls both.

## Done criteria

- [x] `npm test` → 49 passed. New tests:
  - which sound each moment plays;
  - winning replaces the grow chime, and game over replaces the bump;
  - several snacks make one nom;
  - silent until unlocked;
  - quiet without Web Audio.
- [x] `node tools/browser-sound.mjs` passes on desktop and a sideways phone.
  - Nothing sounds before a tap, and a real tap or click switches audio on.
  - Notes per moment: snack 2, grow 4, bump 1, shark 7, game over 3.
- [x] `node tools/browser-update.mjs`: with GitHub's cache headers, the first open after an update shows the new version.
- [x] Controls, each red:
  - no reload on update → "the first open after an update should show the new version";
  - no unlock on tap → sound never switched on;
  - game loop not listening → "a snack should go nom";
  - fanfare not replacing the chime → two unit tests.
- [x] No regressions:
  - `browser-check.mjs` (drawing), `browser-sideways.mjs` (arrows), and `browser-play` desktop/phone run with no console errors;
  - `browser-autoplay` reaches shark.

## Attempt log

- 2026-09-29: George: "everything's merged … merge everything into yours".
  - Brought `master` into this branch after ocean learning (#2) and the start-screen change (#3). The only conflict was the offline cache name, now v12.
  - The speaker button now mutes sounds as well as the voice; its label says "sound".
  - Sound checks mark every animal as met, so fact cards don't interrupt.
  - `npm test`: 72 passed.
  - Browser checks all pass: `browser-sound`, `browser-update`, `browser-check` (drawing), `browser-learn`, `browser-sideways`, `browser-play` desktop/phone, `browser-autoplay`, and `browser-reef` 3 of 3.
- 2026-09-29: Two follow-ups held until ocean learning landed:
  - **New fish arrived in a column at the screen edge.** Every replacement spawned exactly 45px outside it, and big fish poked into view. They now start fully off screen (size × 1.6), plus a random 0–30% of the screen width. New test "new fish swim in from off screen at spread-out distances"; with the change removed, it fails.
  - **`browser-reef.mjs` was flaky at leaving the shelter.** The shark from the shelter step could bump the fish on the way out, then the next bump took hearts from 2 to 1 before the check saw 2. The check now clears the water first, asserts no heart is lost leaving, then asserts exactly one heart is lost to the bump. It passed 3 of 3; it failed 1–2 of 3 before.

- 2026-09-29: Sound lives in `src/sound.js` and is hooked into `main.js` with one line in the game loop and one unlock listener. This keeps the collision small with the ocean-learning branch, which rewrites much of `main.js`.
  - The unlock listens on `document`, because both app-test fixtures keep one listener per event type on `window`.
  - The unlock fires on finger-up, click or key press. Chrome and iPhone don't count finger-down as permission to play sound.
- 2026-09-29: Updates showed only on the second open because the old offline worker serves the old page. The page now reloads itself when a new worker takes over on the start screen. This helps every update after this one ships, because the currently installed version doesn't have the reload yet.
