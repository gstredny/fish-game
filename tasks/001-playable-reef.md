# Playable reef

Status: Open — pushed to GitHub; browser verification blocked by this session's sandbox

## Intent

Today a playable local game exists, but this environment cannot run its local server or browser for visual and interaction checks. After this task, a child can open the game on a Mac or phone, swim by touch/mouse/keyboard, eat smaller sea life, avoid predators, grow through fish forms, and become a shark. The game should be installable from a hosted web page and work offline after its first visit.

## Done criteria

- `node --test tests/*.test.js` passes the growth and collision rules.
- `python3 -m http.server 8778` serves a playable game; verify start, movement, eating, predator damage, growth, and shark finish in a real browser.
- Inspect a desktop and phone-sized screenshot; fix visible layout problems.
- `git status --short` shows only intended project files.

## Attempt log

- 2026-09-29: Created the local Git repository. Research suggests MECC's *Odell Down Under* is a strong match for the school-computer memory; *Fishy* and *Feeding Frenzy* share the growth mechanic.
- 2026-09-29: Added a first playable slice: original canvas reef art, five growth forms, prey and predator collisions, touch/mouse/keyboard controls, win and retry screens, and offline web app files. Next: generate icon PNGs and verify the game in a browser.
- 2026-09-29: `npm test` passed 5/5. `sips` cannot decode the SVG icon (exit 13), so the PNGs will be captured from its browser rendering instead.
- 2026-09-29: The sandbox denied binding the local HTTP server (`PermissionError: Operation not permitted`). Chrome DevTools also requires approval, which this session cannot request. Trying local rendering tools for visual inspection and icon conversion.
- 2026-09-29: Quick Look thumbnail generation failed at sandbox initialization (exit 255), and headless Chrome exited 134. Added a small native icon renderer to produce the required PNGs without those tools.
- 2026-09-29: Native rendering produced valid 192px and 512px PNGs; the 512px icon was visually inspected. Added a WebKit snapshot tool as one last local browser route.
- 2026-09-29: WebKit could not load the page in this sandbox (exit 133, launch-services sandbox extension denied); removed the failed snapshot tool. Browser layout and live play remain unverified here.
- 2026-09-29: Simulated 12 mobile-size swims using a simple seek-food/avoid-predator controller: all 12 reached shark form in 21–63 simulated seconds, with 2–3 hearts left. Added explicit game-over and keyboard checks.
- 2026-09-29: Final static checks passed. The only unmet criterion is a real browser playthrough and desktop/phone screenshot, which needs a browser and local server outside this sandbox.
- 2026-09-29: Kept service-worker activation alive until it claims open pages, so offline control does not depend on a later navigation.
- 2026-09-29: Review retest: `python3 -m http.server 8778` still fails with `PermissionError: [Errno 1] Operation not permitted`. The in-app browser reports `No browser is available`, and browser discovery returns `[]`. Real desktop and phone screenshots remain blocked in this environment.
- 2026-09-29: Code review found that blur/pause could retain pressed movement keys and canceled touches could retain their swim target. Cleared both inputs on those paths and advanced the offline cache version so installed copies can receive the change.
- 2026-09-29: Review verification: `npm test` passed 7/7 with 0 failed and 0 skipped; `node --check` passed for all four JavaScript runtime files; the app asset check found all 10 referenced local files. Browser play and screenshot criteria remain open.
- 2026-09-29: Added a regression test for replacement fish entering the visible play area. Red run: `npm test` passed 7/8, failed 1/8 because replacements could spawn below the screen and never swim vertically into view.
- 2026-09-29: Spawned replacements just beyond the left or right edge, facing inward, with their vertical position inside the play area. Green run: `npm test` passed 8/8 with 0 failed and 0 skipped; `node --check` passed for the four runtime JavaScript files.
- 2026-09-29: Publication preflight: `npm test` passed 8/8 with 0 failed and 0 skipped; runtime JavaScript syntax checks passed. Committed the game as `118a240` after checking the 16 staged paths and passing the gitleaks hook.
- 2026-09-29: `gh repo create gstredny/fish-game --public` failed with a connection error. Read-only GitHub API calls succeeded and confirmed the repo was absent.
- 2026-09-29: `gh api -X POST user/repos` created the public repository; `git push -u origin master` pushed `118a240`. GitHub Pages is not configured, and live browser verification remains open.

## Evidence

- `npm test` → 8 tests, 8 passed, 0 failed, 0 skipped.
- `node --check src/main.js && node --check src/world.js && node --check src/paint.js && node --check sw.js` → exit 0.
- Manifest/cache asset check → `Verified 12 manifest/cache asset paths`.
- `sips -g pixelWidth -g pixelHeight icons/fish-192.png icons/fish-512.png` → 192×192 and 512×512.
- `git status --short` → only the intended new project files; no other repository changes.
- `git ls-remote origin refs/heads/master` → `118a240492a3c89da0cf23ad731d4029dd6d33f1 refs/heads/master`.
- `gh repo view gstredny/fish-game --json name,url,visibility,defaultBranchRef` → public repository, URL `https://github.com/gstredny/fish-game`, default branch `master`.
