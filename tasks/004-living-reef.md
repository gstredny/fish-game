# A reef that remembers

Date: 2026-09-29
Status: Gameplay committed locally on `master` (not pushed); Blender artwork and live browser verification remain open.

## Intent contract

Today each new swim resets the ocean. After this slice, reaching the shark earns one coral colony, the child plants it in the world, and the colony survives restarts and reloads. One species of resident fish lives there. Small player forms can hide inside the colony; leaving it restores predator danger. Blender MCP is requested for the coral artwork; its connection is not exposed in this session.

## Slice order

1. Earn, plant, save, reload: validate the complete happy path before adding habitat behavior.
2. Add resident fish, visible shelter feedback, and predator protection.
3. Complete coral artwork through Blender MCP if available, then inspect desktop and phone screenshots.

## Done criteria

- [x] `npm test` verifies earning once per shark swim, saved rewards, placement, restart/reload persistence, resident fish, and shelter entering/leaving.
- [ ] `node tools/browser-reef.mjs` exercises earning, planting by real input, reload, restart as a sprat, and predator encounters inside/outside shelter; desktop and phone screenshots are inspected.
- [x] `node --check src/main.js && node --check src/world.js && node --check src/reef.js && node --check src/reef-save.js && node --check src/reef-paint.js && node --check sw.js` passes.
- [ ] Blender MCP coral artwork is generated and integrated, or George chooses existing canvas artwork.
- [x] Offline cache contains all new runtime assets; `git diff --check` passes.

## Attempt log

- 2026-09-29: Checked existing tasks and confirmed no other active fish-game session through `list_threads`. Current branch is `master`; previous uncommitted gameplay fixes are preserved. Baseline `npm test`: 13 passed, 0 failed, 0 skipped.
- 2026-09-29: Blender MCP is absent from the available tools; `/Applications/Blender.app` is absent. Local socket probing is denied by this sandbox (connect result 1), so it cannot establish add-on availability. Requested the connection or a canvas-art preference while proceeding with independent gameplay work.
- 2026-09-29: Chrome DevTools MCP cannot open its shared browser because its profile is already in use. Will use the existing isolated raw-CDP browser verification route if available.
- 2026-09-29: `python3 -m http.server 8778 --bind 127.0.0.1` failed with `PermissionError: [Errno 1] Operation not permitted`. Node REPL raw-CDP probing also failed with `connect EPERM 127.0.0.1:9444`. Neither route can currently perform browser verification.
- 2026-09-29: Completed the first tracer slice through the simulation, placement controls, and storage. `npm test` → 18 passed, 0 failed, 0 skipped. Integration test earns at the shark milestone, persists an unplanted reward, plants at world coordinates, saves, reconstructs a new sprat world, restarts without losing the colony, and verifies a safe start near its new location. `git diff --check` → exit 0. Next: residents, shelter, and the final artwork/verification path.
- 2026-09-29: Added three clownfish per colony, predator-driven retreat, shelter only for fully contained small forms, and immediate danger on leaving. Added canvas colony artwork as a working placeholder while Blender MCP remains unconnected. `npm test` → 21 passed, 0 failed, 0 skipped. The six syntax checks in the done criteria and `git diff --check` exited 0.
- 2026-09-29: Chrome MCP `new_page` with an isolated context returned `MCP tool call requires approval, but approval policy is never`; this route cannot perform live verification. No approval override is available in this session. Blender is absent from `/Applications`, and no Blender MCP tool is exposed. Artwork and browser criteria remain open.
- 2026-09-29: Tried a direct headless Chrome file-page screenshot with an isolated temporary profile and `--allow-file-access-from-files`; Chrome exited 134 without output. No screenshot was generated. This failed fallback is not browser evidence.
- 2026-09-29: Added `tools/browser-reef.mjs` to check desktop and phone earn → plant → reload → sprat → shelter → leave with actual inputs and seven screenshots per viewport. `node --check tools/browser-reef.mjs` passed. `node tools/browser-reef.mjs` failed before opening the game with `connect EPERM 127.0.0.1:9444`; no browser checks ran and no screenshots were produced. Adding an actual-main-module DOM fixture to verify save/control wiring locally; it does not replace visual QA.
- 2026-09-29: Actual-main-module fixture verifies automatic reward saving, touch placement without accidentally steering, reload as a sprat, shelter HUD feedback, cancel/Enter controls, rejected overlap without spending the reward, and honest feedback on a full storage device. `npm test` → 25 passed, 0 failed, 0 skipped; `git diff --check` → exit 0. Added a final boundary check for growing too large inside shelter; next run will verify that protection ends in the same frame.
- 2026-09-29: Final boundary check passed. `npm test` → 26 passed, 0 failed, 0 skipped. Runtime and browser-script syntax checks and `git diff --check` exited 0. Cache/import/control audit output: `Verified 15 cache asset paths and 13 runtime imports; all app controls exist.` Placed the returning sprat 100 px beside its first coral, so the colony fits within the narrow phone view; rerunning tests after that spawn adjustment.
- 2026-09-29: Spawn adjustment verification: `npm test && git diff --check && node --check src/world.js && node --check tools/browser-reef.mjs` → exit 0; 26 passed, 0 failed, 0 skipped. Updated the active handoff in `tasks/active-handoff.md`. Task remains open for Blender artwork and actual browser/screenshot verification.
- 2026-09-29: George requested commit and push. Confirmed `master`, origin `https://github.com/gstredny/fish-game.git`, no other active fish-game session, and an initially empty index. `npm test` → 26 passed, 0 failed, 0 skipped; syntax checks and `git diff --check` passed. Initially staged only the eight new living-reef files. Prepared baseline/final snapshots in `/private/tmp/fish-reef-commit-7w4jrpb2` to split required earlier gameplay fixes from the new feature.
- 2026-09-29: `git restore --staged --` for the eight new files failed with `fatal: Unable to create '.../fish-game/.git/index.lock': Operation not permitted` (exit 128); the following source replacement did not run. The separate attempt to stage the dependency fixes also failed with the same filesystem error (exit 128). Its targeted game/steering check passed 13, failed 0, skipped 0. Stopped Git mutations rather than bypassing this session's permissions. No commit was created and no push occurred. Read-only comparison confirmed all five shared source/document files still match the final reef snapshots. The original eight new reef files remain staged; other changes remain unstaged.
- 2026-09-29: Claude Code session with Git write access. No `.git/index.lock` existed; the earlier failure was the Codex sandbox only. Full tree `npm test` → 26 passed, 0 failed, 0 skipped. Applied the prepared split through the index (working tree untouched): `617c7ec` browser play scripts; `4bd7964` earlier gameplay fixes using the baseline snapshots, whose exported index snapshot passed `npm test` → 13 passed, 0 failed, 0 skipped; then the living reef on top. Not pushed.

## Remaining verification

- Blender MCP must be connected, or George must select canvas artwork. The current colony is original canvas art, not a Blender render.
- `node tools/browser-reef.mjs` must run in a session that can bind the local game server and access isolated Chrome CDP. Inspect its actual desktop/phone screenshots, including the new win panel and planted colony. No screenshots exist from this session.
- Work is uncommitted on local `master`; nothing was pushed or deployed. Existing earlier uncommitted fixes were retained.
- The requested commit/push requires a session permitted to write `.git`. The index currently contains only the eight new reef files; do not commit them alone because the shared gameplay/UI/cache changes and required prior gameplay fixes must accompany the feature.
