# Active handoff — ocean zones

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
