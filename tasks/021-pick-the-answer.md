# Pick the answer: stars and a size up for a right guess

Date: 2026-10-01
Status: in progress
Branch: `master`

George's asks: "whenever they encounter a fish or an animal and ask you what it is? They should get
points. It should be multiple choice and it should change every time ... if they get it right, then
they get to ... move up a fish level, so if they got one right as a damselfish, then they immediately
go into being lionfish" · "So they're like rewarded for getting it right."

## Intent contract

Today: a new animal's card asks "What animal is this?" with its photo and one button, "Tell me!",
which names it and reads the card. Nothing is won for knowing it.

After: the same card also shows three answer buttons: the right animal and two others from the same
place, picked and shuffled fresh every time. A right pick earns a star (⭐ in the top bar, kept per
player), plays the grow chime, names the animal and reads its card; closing the card grows the fish
one size at once (a damselfish becomes a lionfish). One size before the biggest, it becomes the
biggest and the mission starts. A wrong pick shows "Good try!" and the right name; no star, no growing.
"Tell me!" stays as a small "I don't know" button: no star.

Assumptions (George can veto in one line): the quiz is the existing "What animal is this?" moment, the
first time a player meets each animal; already-met animals keep their name tag. Already the biggest
(the mission's animal): a right pick earns a star only. The star count is not on the start screen.

## Smoke test (no code, just clicks)

1. Reef, Player 1, a damselfish. Swim until a new animal's card asks "What animal is this?": three name
   buttons under the photo, in a different order and with different wrong ones on another try.
2. Tap the right one: "That's right!", a chime, the top bar shows ⭐ 1. Tap Keep swimming: you are a
   lionfish now.
3. On another new animal tap a wrong name: "Good try!", the right name shows, ⭐ stays, you stay the
   same size.

## Done criteria

- [x] `node --test tests/choices.test.js tests/quiz-flow.test.js`: all pass.
- [x] `npm test`: all pass (real counts in the log).
- [x] Muted headless browser: question card with three choices and the revealed card fit at 844x390,
      568x320 and 1280x800; screenshots looked at.
- [x] `git diff --check` clean; `sw.js` bumped and caches `src/choices.js`.
- [ ] Pushed, Pages deploy success, live `sw.js` shows the new cache (only once George says ship).

## Attempt log (append-only)
- 2026-10-01: red first: `node --test tests/choices.test.js tests/quiz-flow.test.js` failed (no `src/choices.js`,
  no `#stars`, no `#card-choices`). Built `pickChoices` (`src/choices.js`), `growUp` + `startMission` in
  `src/world.js`, the answer buttons, star count (`little-fish-stars-v1` per player, cleared by Erase) and
  `prize` growth on close in `src/main.js`, `#stars` and `#card-choices` in `index.html`, styles, `sw.js`
  `little-fish-v27` with `src/choices.js`. Green: 7 passed, 0 failed. `npm test`: 116 passed, 0 failed,
  0 cancelled, 0 skipped. `git diff --check` clean.
- 2026-10-01: George OK'd a muted browser look and shipping (AskUserQuestion: "Check silently + put online").
  Headless Chrome `--mute-audio`, new `tools/browser-quiz.mjs`: "quiz check passed" (844x390 touch, 568x320
  touch, 1280x800). Looked at the shots: three name buttons under the photo; right pick shows "That's right! ⭐
  You get to grow!" and the card; HUD shows Lionfish and ⭐ 1; wrong pick shows "Good try!" + Damselfish.
  Fixed two looks from the first pass: the star count was pink (copied the hearts style), now gold; Tell me!
  sat off-centre behind the invisible hear button, now the hear button and Find out more are `display: none`
  while guessing. Re-ran: passed. `browser-coral` passed, `browser-levels` passed. `browser-learn` FAILS at
  line 138 (expects the open ocean welcome; new players start on the reef since task 019). Same failure on
  HEAD 6178918 served from `git archive` on port 8779, so it is old, not from this change. Left as is.
- 2026-10-01: README updated (the pick, stars per spot, `browser-quiz`, `--mute-audio` in the Chrome line).
  `npm test`: 116 passed, 0 failed, 0 cancelled, 0 skipped. `git diff --check` clean.
