# Levels in order, named save spots, and an ending

Date: 2026-10-01
Status: LIVE on GitHub Pages (695b3bb, Pages run 36860449775 success, live cache `little-fish-v25`). George's phone try is his to do
Branch: `master`

George's ask: "make it like Donkey Kong Country Super Nintendo where the next level is the different parts of
the ocean so you start off with just the first part, and then as you progress in the game you go to other
parts of the ocean ... instead of Player 1, Player 2, you can write in your player's name like George or Dora.
And those player spots are saved just like Donkey Kong Country so they could go back in and say, 'Oh, I made it
through level two; I'm still on level three' ... you can erase those names and start over, maybe just up to
three saved spots ... the game needs to have an end like Donkey Kong Country so they know they made it through
the level."

## Intent contract

Today: every place is open from the first visit; there is no order and no end. Two fixed save spots,
Player 1 and Player 2.

After: the places are levels, in order: 1 Coral reef, 2 Open ocean, 3 The deep, 4 The bottom. A new spot
has only the reef open; a locked place shows a lock and, when tapped, the voice says to finish the one
before it. Finishing a mission in a place finishes that level: the win screen says "Level complete!",
names the next place, and a **Next** button swims there. Finishing the last level shows an end screen,
"You did it!", and the voice says the ocean is done; every place stays open after that.
Three save spots with a typed name (or "Player N" until named), each showing "Level N of 4" or "Finished!".
A spot can be renamed or erased (with an in-page "Really erase?" step). A save from before has its
Ocean book and reef but starts on level 1.

Assumptions (George vetoes in one line): one mission finished = level done; level order is the order in
`src/zones.js`; no migration of old saves to "all open".

## Smoke test (no code, just clicks)

1. Fresh phone, sideways: the start screen shows Player 1 / Player 2 / Player 3 spots and only Coral reef
   open; The deep shows a lock. Tap the lock: the voice says it is still locked.
2. Tap "Change name", type Dora, OK: the spot says Dora · Level 1 of 4.
3. Dive in, grow to the tiger shark, finish the mission: "Level complete! You finished the coral reef.
   Next stop: the open ocean!" with a Next: Open ocean button. Tap it: you are a little sardine.
4. Home: Dora's spot says Level 2 of 4; the open ocean is open, the deep still locked.
5. Finish all four: "You did it!" screen; the spot says Finished!; every place is open.
6. Erase Dora: "Really erase Dora?" then Erase; the spot is Player 1 again with an empty book.

## Done criteria

- [x] `node --test tests/levels.test.js tests/level-flow.test.js tests/player-flow.test.js`: 9 pass, 0 fail.
- [x] `npm test`: 119 pass, 0 fail, 0 skipped (5 new voice lines recorded: 3 level-complete, the end, locked).
- [x] `OUT=screenshots/levels node tools/browser-levels.mjs`: "levels check passed" at 844x390, 1280x800 and
      568x320; screenshots 01–08 in `screenshots/levels/` (ignored by git) looked at.
- [x] `git diff --check`: clean.
- [x] README "Levels, save spots and the end"; `sw.js` is `little-fish-v25` and lists `src/levels.js`.
- [x] Committed 695b3bb and pushed (George: "just push and commit so I can test on my phone");
      `gh api .../actions/runs?head_sha=695b3bb…`: "pages build and deployment completed success" (run
      36860449775); `curl https://gstredny.github.io/fish-game/sw.js`: `little-fish-v25`; live `src/levels.js`
      and `index.html` with `player-pick` and `#finished` served.
- [ ] Tried on George's phone: type a name (keyboard, sideways), lock voice line, Level complete, the end.

## Attempt log (append-only)

- 2026-10-01: read main.js, players.js, zones.js, missions.js, voice.js, tests. Plan: `src/levels.js`
  (order, beaten set, open rule, lines) + main.js start screen/win/ending; then names in players.js.
- 2026-10-01: slice 1 (levels) built: `src/levels.js`, locked zone buttons, Level complete / Next button,
  `#finished` end screen, 5 new voice lines recorded (HF_HUB_OFFLINE=1 worked; the keychain CA step was
  denied). Old flow tests seeded with `OPEN_SEA` (every level done) so they keep swimming the open ocean.
  `npm test` 117/117.
- 2026-10-01: slice 2 (spots) built: `PLAYERS` 1–3, `NAME_KEY`, `cleanName` in players.js; `#player-pick`
  rendered from saves with name + "Level N of 4" / "Finished! ★" / "New swimmer"; Change name box (Enter saves,
  Escape closes, typing is not steering); Erase asks on the page first. `tests/player-flow.test.js` rewritten.
- 2026-10-01: browser check found two things the fixture missed: Home did not refresh the spot's level text
  (fixed: `showPanel("intro")` renders spots too; test added) and the start screen overflowed at 844x390
  (fixed: number badge instead of "Level N ·" text, spots + tools on one row, tagline hidden under 500px
  tall). Erase question shortened to one row. Lock mark kept on ≤340px-tall screens.
- Follow-ups, not done: `src/main.js` grew 704 → 840 lines; the start-screen code (spots, name box, zones)
  is a candidate for its own module as a scoped task. The 568x320 install guide overlapping Ocean book is
  older than this task. Kelp forest / icy sea (`tasks/013`) would slot into the level order by position in
  `src/zones.js`; a player who finished the level before a new one keeps every level after it open.
- 2026-10-01: George: old saves need not be kept ("that was just me testing; he hasn't played yet"), so no
  migration; the assumption stands. Pushed 695b3bb; Pages run 36860449775 success; live cache v25.
