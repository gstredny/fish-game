# Active handoff — be a pufferfish

Date: 2026-10-02
Task: `tasks/024-be-a-pufferfish.md`

COMMITTED and PUSHED on `master` (deploy evidence in the task file). A discovered Pufferfish's
Ocean book card offers **Be this animal**. A separate reef scene gives a voiced intro, slow visible
grouper warning, large Puff! control (Space or pointerdown, including a second thumb), rock shelter,
gentle retry, success/replay and return to the same book. A successful defence is required; the
ordinary swim's size/hearts/snacks/mission/world fields and save data remain exact. Blur/visibility/
portrait pause the scene. Save spots keep their existing per-player discovery gate; no new save keys.

New modules: `src/puffer-adventure.js` (controls/narration), `src/puffer-swim.js` (encounter),
`src/puffer-paint.js` (reef scene), `src/puffer-lines.js` (spoken words), `puffer.css`.
Main/card hooks, `sw.js` prepared as `little-fish-v30`, README, fixture and tests updated.
Six clips recorded offline in the existing Kokoro voice; 339 reused, 345 total.

Lead verification: `npm test` 138 passed, 0 failed/cancelled/skipped; puffer-specific tests 16 passed,
0 failed/cancelled/skipped; syntax and diff checks pass. All 31 imported JS modules plus both
stylesheets appear in the offline cache. Independent Sol review found no actionable defects;
Opus 5.5 is unavailable here. Later lead input review added held-second-thumb/release regressions.

BROWSER VERIFIED 2026-10-02 (review session): `node tools/browser-puffer.mjs <scratch>` → 6 passed,
0 failed at 1280×800, 844×390, 568×320; screenshots inspected. Review fix: the top line now says
"That was a close bump!" / "Safe in the shelter!" on retry/win instead of the grouper warning.
Two test mistakes in the runner fixed (CDP touchEnd lifts the listed point; wait one frame before Space).
Not checked: real audio playback, native service-worker install in a browser, George's phone.

## Previous — keep your size after losing all hearts

Date: 2026-10-01
Task: `tasks/023-keep-your-size.md`

LIVE (95d89d0, Pages run 36931929051 success, live cache `little-fish-v29`). Losing the last heart saves the
fish's size for that place (`src/checkpoints.js`, `little-fish-checkpoint-v1`, per save spot). Try again, or
the same place later (even after closing the app), starts at that size with three hearts; the biggest form
starts with a new mission. Game-over says "You keep your size. You'll start again as a lionfish." A finished
mission clears that place's size; Erase clears all. `npm test` 122/122; `tools/browser-keep-size.mjs`
passed (844x390, 1280x800, muted); levels, coral, quiz checks passed. Not on George's phone yet.
Assumption George may veto: leaving mid-swim (Home, closing the app) does not save the size; only dying does.

## Previous — slower fish for Little and Big swimmer

Date: 2026-10-01
Task: `tasks/022-slower-fish.md`

LIVE (666590d, Pages run 36930775570 success, live cache `little-fish-v28`). `LEVELS.pace` in `src/rules.js`:
food-chain animals swim at 75% (Little) / 85% (Big) of their speed. Big hunters chase at 35% of your speed
(was 50%), orca 45% (was 65%); Little orca 40% (was 50%). `npm test` 117/117. Not on George's phone yet.
If still too hard: Big `safe` time, Big `odds` (fewer hunters) or `goals` are the next knobs.

## Previous — pick the answer: a star and a size up

Date: 2026-10-01
Task: `tasks/021-pick-the-answer.md`

LIVE (05d77c8, Pages run 36929872388 success, live cache `little-fish-v27`). The "What animal is this?" card
shows three names (the right one + two from the same place, shuffled fresh each time, `src/choices.js`).
Right pick: ⭐ +1 (top bar, `little-fish-stars-v1` per spot, Erase clears it), the grow chime, and closing the
card grows the fish one size (`growUp` in `src/world.js`; one size before the biggest starts the mission).
Wrong pick: "Good try!" + the right name. Tell me! stays as a small no-star link. `npm test` 116/116;
`tools/browser-quiz.mjs` passed (844x390, 568x320, 1280x800, muted); coral and levels checks passed.
Not on George's phone yet. Known: `tools/browser-learn.mjs` fails at line 138 (expects the open ocean
start; stale since levels, fails the same on 6178918). Assumptions George may veto: quiz only on first
meeting; no stars on the start screen; Tell me! kept.

## Previous — Big swimmer gentler, the question before the name, a coral trophy case

Date: 2026-10-01
Task: `tasks/020-easier-big-guess-first-coral-case.md`

LIVE (bfb6a3f + 46082c8, Pages run 36865632410 success, live cache `little-fish-v26`). Big swimmer
hunters chase at 50% (orca 65%), 2 s safety. "What animal is this?" always comes before a name: a
never-met mission animal gets its card before the mission card (`openMission` → card from "mission" →
`showMission`); a never-met hunter's bump opens its card instead of the hurt line (`hurtBy`). Coral is a
trophy case: finishing a level earns one; `#coral` ("Your coral" on start, win and end screens) paints one
colony per finished level (`src/coral-paint.js`, derived from `beaten`). Reef, planting, shelter, reef bar
and clownfish-at-coral are removed. `npm test` 109/109; `browser-coral`, `browser-levels` and
`browser-sideways` passed. Not on George's phone yet. Left as is: growth/welcome lines still name the next
hunter ("Watch out for mackerel!"); George can ask for nameless versions (needs re-recording).

## Previous — levels in order, named save spots, an ending

Date: 2026-10-01
Task: `tasks/019-levels-and-names.md`

LIVE (695b3bb, Pages run 36860449775 success, live cache `little-fish-v25`). Places are levels in `src/zones.js` order
(reef → open → deep → bottom); only the reef is open for a new spot; one finished mission opens the next
(`src/levels.js`, `little-fish-levels-v1` per spot). Win screen says Level complete! with a Next button; the
last level shows `#finished` ("You did it!"). Three named spots (`src/players.js`, `little-fish-name-v1`;
Player N until named) showing "Level N of 4" / "Finished! ★"; Change name box; Erase asks on the page.
Old saves keep book + reef, start on level 1. `npm test` 119/119; `node tools/browser-levels.mjs` passed
(844x390, 1280x800, 568x320). 5 new voice clips. Not on George's phone yet; old test data on his phone
shows as Player 1 with a few animals met (Erase clears it). Next candidates: start-screen code out of
`src/main.js` (840 lines) as its own task; kelp forest / icy sea (`tasks/013`).

## Previous — no text selection when holding an arrow

Date: 2026-09-30
Task: `tasks/018-no-text-select.md`

Live (333ea04, Pages run 36804007724, cache `little-fish-v24`). The `body` rule in `style.css` turns off
`user-select` and the touch callout for the whole page: iPhone Safari used to select the nearest text
(reef bar) when a thumb held the pad and show Copy / Look Up. New `tests/no-text-select.test.js`.
`npm test` 111/111. Not yet held on George's phone. Fallback if it still shows: `touchstart`
`preventDefault()` on the pad.

## Previous — voice pronunciation fixes

Date: 2026-09-30
Task: `tasks/017-pronunciation.md`

Live (426a567, Pages run 36770779163, cache `little-fish-v23`). `SAY_AS` in `tools/make-voice.py` spells
rattail, narwhal, amphipod, axes and man o' war in Kokoro phonemes; 31 lines re-recorded. Whisper heard
every rattail line as "rat tail" (before: rattle, Rachel). `npm test` 110/110. Not heard on George's phone yet.

## Previous — two players, and "What animal is this?"

Date: 2026-09-30
Branch: `master`
Active task: `tasks/016-players-and-guess.md`

Live. Commits f715857 (players) and 6fd58eb (guess) pushed; Pages run 36767749636 succeeded;
live `sw.js` is `little-fish-v21` and live `index.html` has the Player 2 button. Player 1 / Player 2
each keep their own Ocean book, reef, level and place (Player 1 keeps the old keys). New animals met
while swimming: photo + "What animal is this?", then it waits with NO timer until "Tell me!"
(3cce855, Pages run 36768943101 success, live cache `little-fish-v22`). `npm test` 110/110.
Muted browser look passed at 844x390, 568x320, 1280x800. Not yet tried on George's phone.
Known: `mission-flow.test.js` "becoming a shark..." is flaky (~3 in 20), an old test bug; the 844x390
start screen clips the title by 5px, also old.

## Previous — remove fish drawing

Date: 2026-09-30
Branch: `master`
Active task: `tasks/015-remove-fish-drawing.md`

George asked to remove fish drawing because the colored drawing stays the same while the game
calls it different species. Removed the drawing screen, buttons, mode toggle, player/NPC bitmap
overrides, portraits and orphan drawing modules. Old saved drawings and the old mode preference
are ignored. Each swimmer uses its built-in species; player growth changes the painted animal.
Offline cache is prepared as `little-fish-v19`; documentation and checks reflect the removal.

Verification: `npm test` 108 passed, 0 failed, 0 cancelled, 0 skipped. Focused flow/renderer checks:
5 passed, 0 failed, 0 skipped. The flow covers both old preferences, all four zones, five stages,
Home and reload. Renderer check executes paint code for all 20 forms with retired artwork supplied.
`git diff --check` and syntax checks for the three edited browser scripts pass.

Browser verification remains open: no connected browser; the local HTTP server was denied
(`listen EPERM`), then the port-free smoke runner's Chromium launch was denied the macOS Mach port
(`Permission denied (1100)`). No screenshots or browser passes claimed. The replacement muted
runner is `node tools/browser-check.mjs screenshots/remove-drawing`; run it when a browser-capable
environment is available, inspect screenshots, then finish the task criterion.

Ship state: removal commit 99fac65acadd79fecd43bc3a2787d448d7b1deee is committed and pushed to
origin/master. `git ls-remote` confirms that SHA. GitHub Pages run 36747099993 completed with
conclusion success for that SHA: https://github.com/gstredny/fish-game/actions/runs/36747099993.
The site is https://gstredny.github.io/fish-game/ and Pages builds master from /.
George explicitly authorized shipping so he can test on his phone. Deployment evidence is being
committed separately in the two task/handoff documents.

Live served files remain unverified: curl returned `Could not resolve host: gstredny.github.io`,
and the web tool also could not fetch the live home page, sw.js, main.js or paint.js. Browser and
live-file criteria remain open; do not call phone behavior or screenshots verified.

## Previous release — ocean zones

Date: 2026-09-30
Branch: `master`
Task: `tasks/013-ocean-zones.md`

Slices 1–3 are done: the start screen asks where to swim (Coral reef, Open ocean, The deep, The bottom),
each zone has its own food chain, sea friends, giant, missions and Blender panorama; the Ocean book is
grouped by place. The deep and the bottom are dark: `paintDark` in paint.js, `glow: true` cards show as
lights; the bottom has a bare mud floor (`plants: false`) and a glowing vent. Plus George's three asks:
Home button, "Swim as a real fish", greetings paced 6 s apart. 62 animals in the book.

Verification: `npm test` 116 passed, 0 failed, 0 skipped after the three review fixes. The browser suite for slice 3 was killed mid-run because
`browser-sound.mjs` played audio on George's Mac; the bottom section of `browser-zones` is unverified. Details
and the fact flags are in the task file.

Ship state: slices 1–3 and the three review fixes are pushed to `origin/master`; the tested code HEAD
is 0fd2feee45fe3ca72e7c2e9c2e9d5cd6cb29f0cf. GitHub Pages deployment succeeded for it:
https://github.com/gstredny/fish-game/actions/runs/36737004155. `sw.js` says `little-fish-v18`.
Fetching the live files was blocked by DNS, and the browser runtime has no connected browser;
served-cache contents, the bottom browser smoke and George's phone remain unverified.

Review fixes (`tasks/014-review-fixes.md`): c8af708 lets every effective NPC drawing spawn in real-fish
mode; a4ca845 keeps the last started mission separate from Home/zone previews; 0fd2fee selects and
remembers the newly painted fish. Each has a regression test, first seen failing. All fixes committed
separately with explicit pathspecs; all pre-existing bottom-zone commits were included in the push.

Next: slice 4, **Kelp forest** (light 0.85, floor with tall kelp: the Blender palette needs kelp columns and
paint.js's plants could be taller/greener there): plankton → anchovy → rockfish → lingcod → sea lion →
great white → orca; garibaldi, leopard shark, harbor seal, bat ray (+ sea otter, urchin, sea star move or
share); gray whale as the giant. Then slice 5, **Icy sea**. Per zone the recipe in the task file. Per zone: species-*.js, paint-*-animals.js, photos + CREDITS, a `ZONES`
palette in `tools/render-ocean.py` and a render, voice re-record (`SSL_CERT_FILE` bundle on the work Mac,
see README), sw.js cache bump, tests.

Gotchas: never `cd` in a shell command (a hook blocks it); Python needs the keychain CA bundle for Hugging
Face; `tools/__pycache__/` appears after `py_compile` and is now ignored.
