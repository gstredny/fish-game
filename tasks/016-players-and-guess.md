# Two players, and "What animal is this?"

Date: 2026-09-30
Status: done; live on GitHub Pages (6fd58eb). George's phone try is his to do

George's asks: "have multiple players like Player 1 this is their save data, Player 2 this is theirs"
and "pause before it started talking and say, 'What fish is this?' or 'What animal is this?' ... to let
them respond. And then it plays and tells you about it."

## Intent contract

Today: one save per device. The Ocean book, reef, Little/Big swimmer and place to swim are shared by
everyone who plays on the phone. A new animal's card starts reading its facts at once, name included.

After, slice 1 (players): the start screen has Player 1 and Player 2. Each keeps their own Ocean book,
reef, level and place to swim; the phone remembers who played last. A save from before players is
Player 1's. The sound on/off switch stays one per phone.

After, slice 2 (guess): a new animal's card met while swimming first shows the photo and asks "What
animal is this?", waits a few seconds for the child to answer ("Tell me!" skips), then shows the name
and reads the card. "Animal" for every card, since "fish" is wrong for a whale or a squid.

Slice order: players (storage keys, start-screen buttons, flow test); then the guess pause.

## Done criteria

- [x] `node --test tests/player-flow.test.js`: an old save stays Player 1's; Player 2 starts empty;
  each keeps their own book, reef, level and place across a reload.
- [x] `npm test`: all checks pass.
- [x] Guess pause: flow test shows the question, the wait, then the name and the card speech.
- [x] Start screen and guess card looked at in a muted headless browser (844x390, 568x320, 1280x800).
- [x] `git diff --check`: clean.
- [x] `gh api .../actions/runs?head_sha=6fd58eb`: Pages deploy succeeds.
- [x] `curl -fsS https://gstredny.github.io/fish-game/sw.js`: live cache is `little-fish-v21`.

## Attempt log (append-only)

- Preflight: `master` clean and level with `origin/master` (2303970). Save keys today:
  `little-fish-met-v1`, `-reef-v1`, `-level-v1`, `-zone-v1`, `-voice-v1`.
- Slice 1 red: `node --test tests/player-flow.test.js` failed (`Cannot read properties of undefined
  (reading 'emit')`: no Player 2 button). Built `src/players.js` (Player 1 keeps the old keys; Player 2
  adds `-player-2`), start-screen buttons, `sw.js` cache `little-fish-v20`. Green: 1 passed, 0 failed.
- `npm test` then: 108 passed, 1 failed. The failure is an old flake, not this change: `mission-flow.test.js`
  "becoming a shark shows and says the mission" forces the mission to "hunt" after `startSwim` already
  remembered a random one, so the next pick can also be "hunt" (failed 1 of 9 reruns). Left as is.
- Slice 2 red: learn-flow failed (`lines.js` has no `WHAT_ANIMAL`). Built the guess: mid-swim meet cards
  ask "What animal is this?", show photo and "?", wait 5 s (`GUESS_WAIT`) or "Tell me!", then name and read.
  Win-screen cards (giant, last friend) skip it: the mission already named the animal. One word, "animal",
  for all: a whale or squid is not a fish. Updated four older card checks for the extra step.
- Recorded the line: `make-voice.py ... --prune` with the keychain CA bundle: generated 1, reused 333.
- Final: `npm test` 110 passed, 0 failed, 0 cancelled, 0 skipped. `git diff --check` clean.
- Browser look NOT run: memory says no browser checks on this Mac without George's say-so (sound played
  on 2026-09-30). Muted runner when allowed: `node tools/browser-check.mjs screenshots/players`.
- George OK'd a muted browser look and shipping (AskUserQuestion: "Save + put online", "Yes, sound off").
  Scratch script (Chromium `--mute-audio`, game voice saved "off", files served by route, no port):
  `players-guess-check: 3 passed, 0 failed` (phone 844x390, short-phone 568x320, desktop). Checked: both
  player buttons fit; Player 1 book 2 met, Player 2 book 0; guess card shows photo, "?", facts hidden,
  "Tell me!" fits; tap names Plankton and shows facts; reload keeps Player 2; Player 1 book still 2; no
  browser errors. Screenshots in `screenshots/players/` (not tracked), inspected by eye.
- 844x390 start screen: title top is cut by 5px. Same on HEAD before this change (title top -5px both),
  so not from this work. Left as is.
- Split into two commits. Players-only tree: `npm test` 108/1 twice (the known flake; 3 of 20 reruns of
  that one test fail), then 109 passed, 0 failed. Committed f715857. Full tree with `sw.js` bumped to
  `little-fish-v21`: `npm test` 110 passed, 0 failed, 0 skipped. Committed 6fd58eb. Pushed:
  `git ls-remote` shows 6fd58eba9255f16f8d82560a230f9bfc08dc0ff7.
- Pages run 36767749636 for 6fd58eb: completed, success
  (https://github.com/gstredny/fish-game/actions/runs/36767749636). `curl` of the live `sw.js` prints
  `const CACHE = "little-fish-v21";`; live `index.html` contains `player-2` (1 match).
