# Active handoff — voice pronunciation fixes

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
