# Active handoff — ocean zones

Date: 2026-09-30
Branch: `master`
Task: `tasks/013-ocean-zones.md`

Slice 1 is done: the start screen asks where to swim (Coral reef, Open ocean), each zone has its own food
chain, sea friends, giant, missions and Blender panorama; the Ocean book is grouped by place. Plus George's
three asks: Home button, "Swim as a real fish", greetings paced 6 s apart. 40 animals in the book.

Verification: `npm test` 110 passed, 0 failed; all ten browser scripts pass (Chrome CDP on port 9444 for
most, Playwright Chromium for sound, update and check); screenshots inspected. Details and the fact flags
are in the task file.

Ship state: committed on `master` (`4c34fc6`, `fa74b85`, `950a5a2`, plus the task write-up) and pushed to
`origin/master`; GitHub Pages serves master, so it is live once Pages rebuilds (check `sw.js` says
`little-fish-v16`). Not yet tried on George's phone.

Next: slice 2, **The deep** (twilight zone): darkness overlay with the player's glow, `glow` kinds painted on
top of the dark, no floor, 10 new animals (marine snow → shrimp → lanternfish → viperfish → giant squid →
sperm whale; hatchetfish, barreleye, vampire squid, oarfish as giant; anglerfish moves here). Then the
bottom, kelp forest, icy sea. Per zone: species-*.js, paint-*-animals.js, photos + CREDITS, a `ZONES`
palette in `tools/render-ocean.py` and a render, voice re-record (`SSL_CERT_FILE` bundle on the work Mac,
see README), sw.js cache bump, tests.

Gotchas: never `cd` in a shell command (a hook blocks it); Python needs the keychain CA bundle for Hugging
Face; `tools/__pycache__/` appears after `py_compile` and is now ignored.
