# Big swimmer gentler, the question before the name, and a coral trophy case

Date: 2026-10-01
Status: open
Branch: `master`

George's asks (after playing v25 on his phone): "it's a little too hard on the big swimmer. Can you make it
a little slower?" · "it said the orca before we even got to the question where it says what is this?
... make sure it asks you before you mention any of the creatures" · "the plant the coral is confusing ...
it should just be a separate thing that ... as you get a level you get coral and at the end of the thing
you can go back and look at your coral. It's kind of like a trophy case ... right now when it says plant
your coral it's not noticeable and it's confusing to look at."

## Intent contract

Today: Big swimmer's hunters chase at 62% of your speed (the orca at 80%) and you get 1.5 s of safety
after a bump. The mission card shows and names its animal (the orca for "swim away", tuna for "eat 2
tuna") before the child has met it, and a bump by a never-met hunter says "Watch out! Orcas eat great
white sharks!" before its card asks "What animal is this?". Every finished mission earns a coral to
plant by tapping the water; planted coral sits in the ocean with clownfish and a shelter ring.

After: Big swimmer's hunters chase at 50% (the orca 65%) and you get 2 s of safety. A mission animal the
child has never met gets the "What animal is this?" card first, then the mission card. A bump by a
never-met hunter opens its card first instead of saying its name (unless that bump ended the swim).
Coral is a trophy case: finishing a level earns one coral; **Your coral** on the start screen (and on the
win and end screens) shows a shelf with one coral per level, grey until earned. No planting, no reef in
the water, no reef bar, no clownfish shelter.

Left as is (George can veto): the growth and welcome lines still name the next hunter ("Watch out for
mackerel!") since that is the food-chain lesson; re-recording nameless versions is a separate ask.

## Smoke test (no code, just clicks)

1. Big swimmer: a hunter turns and follows, but you pull away more easily than before.
2. Grow to the great white in the open ocean with the orca never met and a "swim away" mission: the
   card asks "What animal is this?" with the orca photo, "Tell me!" names it, then "Your mission".
3. Get bumped by a never-met mackerel: its card asks first; no "Watch out! Mackerel..." before it.
4. Finish level 1: the win screen says you earned a coral; **See your coral** shows a shelf with one
   coral lit and three grey "?"; **Your coral** on the start screen shows the same.

## Done criteria

- [x] `node --test tests/guess-first.test.js tests/level-flow.test.js`: 6 pass, 0 fail.
- [x] `npm test`: 109 pass, 0 fail, 0 skipped (reef tests and the planting test are gone with the feature).
- [x] `tools/browser-coral.mjs`: "coral check passed" (844x390 + 1280x800; screenshots 01–05 in
      `screenshots/coral/`, looked at); `tools/browser-levels.mjs` passed; `tools/browser-sideways.mjs`
      passed at 844x390, 844x340 and 844x330.
- [x] `git diff --check` clean; README updated; `sw.js` is `little-fish-v26`, reef files gone, `coral-paint.js` in.
- [ ] Pushed; Pages run success; live `sw.js` cache name matches.

## Attempt log (append-only)
- 2026-10-01: Big swimmer `chase` 0.62 → 0.5, `orcaChase` 0.8 → 0.65, `safe` 1.5 → 2 (`src/rules.js`).
- 2026-10-01: guess first: `openMission` opens the card (from "mission") for a never-met mission animal, then
  `showMission`; `hurtBy` opens the card for a never-met hunter instead of the hurt line (the game-over bump
  still tells it). Old tests that bumped or hunted strangers now seed those animals as met.
- 2026-10-01: coral trophy case: reef.js, reef-save.js, reef-paint.js, reef bar, planting, shelter and
  clownfish-at-coral removed; `src/coral-paint.js` paints one colony per finished level on `#coral`
  (`openCoral`, derived from `beaten`, no new storage). Fixture: setting innerHTML now empties children.
- 2026-10-01: the spots row made the 844x340 start screen overflow (sideways check): at ≤340px tall the two
  question labels and the spots' level lines are hidden; passes at 390/340/330.
