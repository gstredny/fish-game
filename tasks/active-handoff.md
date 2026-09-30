# Active handoff — ocean zones

Date: 2026-09-30
Branch: `master`
Task: `tasks/013-ocean-zones.md`

Slices 1 and 2 are done: the start screen asks where to swim (Coral reef, Open ocean, The deep), each zone
has its own food chain, sea friends, giant, missions and Blender panorama; the Ocean book is grouped by
place. The deep is dark: `paintDark` in paint.js, `glow: true` cards show as lights. Plus George's three
asks: Home button, "Swim as a real fish", greetings paced 6 s apart. 51 animals in the book.

Verification: `npm test` 112 passed, 0 failed; all ten browser scripts pass (Chrome CDP on port 9444 for
most, Playwright Chromium for sound, update and check); screenshots inspected. Details and the fact flags
are in the task file.

Ship state: slice 1 (`4c34fc6`, `fa74b85`, `950a5a2`, `4e06b47`) is live on GitHub Pages (v16 confirmed).
Slice 2 (the deep, its voice, this write-up) is committed on `master` and pushed; live once Pages rebuilds
(check `sw.js` says `little-fish-v17`). Not yet tried on George's phone.

Next: slice 3, **The bottom** (`light: 0.05`, mud floor, a hot vent landmark): marine snow → amphipod →
snailfish → rattail → deep-sea lizardfish → sleeper shark (no top hunter); sea pig, tripod fish, giant
isopod, tube worms; dumbo octopus as the giant (NOAA has a public-domain photo, File:Dumbo-hires.jpg). Then
kelp forest and icy sea. Per zone: species-*.js, paint-*-animals.js, photos + CREDITS, a `ZONES`
palette in `tools/render-ocean.py` and a render, voice re-record (`SSL_CERT_FILE` bundle on the work Mac,
see README), sw.js cache bump, tests.

Gotchas: never `cd` in a shell command (a hook blocks it); Python needs the keychain CA bundle for Hugging
Face; `tools/__pycache__/` appears after `py_compile` and is now ignored.
