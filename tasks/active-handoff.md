# Active handoff — living reef

Date: 2026-09-29
Branch: `master`
Task: `tasks/004-living-reef.md`

The living reef gameplay is implemented locally: one coral reward per shark swim; pending rewards and planted world coordinates saved on this device; coral survives restarts/reloads; three resident clownfish per colony retreat from nearby predators; small forms can shelter inside, leaving or growing too large restores danger. Placement supports touch, mouse, Enter, cancel, and overlap rejection. Storage failure is visible rather than claiming persistence. Returning swims start beside the reef. New runtime modules are included in offline cache v4.

Verification: `npm test` passed 26, failed 0, skipped 0; syntax checks and `git diff --check` passed. Cache audit verified 15 asset paths, 13 runtime imports, and the existence of all app controls. Tests include the real main module with a minimal DOM/canvas fixture; this is not browser or visual verification.

Remaining: Blender MCP is not exposed and Blender is absent from `/Applications`; canvas coral is a working placeholder. The art preference/connection question has not been answered. Browser QA remains open: Chrome MCP is unavailable due to its shared profile and an approval requirement forbidden by this session policy; server binding and direct CDP access fail with EPERM; direct headless Chrome exited 134. `tools/browser-reef.mjs` is ready for an environment with a local server and isolated Chrome on port 9444, but no live checks or screenshots ran here.

Ship state (updated later 2026-09-29): committed locally on `master` in three commits — `617c7ec` browser play scripts, `4bd7964` earlier gameplay fixes, then the living reef. Not pushed. The paragraph below is the Codex session's earlier record.

Earlier ship state: George explicitly requested commit and push. The full preflight passed 26 tests (0 failed, 0 skipped), syntax checks, and `git diff --check`. Initial staging of the eight new reef files succeeded, but subsequent unstaging/staging operations failed with `Unable to create .../.git/index.lock: Operation not permitted`. No commit, push, PR, deployment, or live-site verification occurred. Only those eight new files are staged; shared feature files and required earlier gameplay fixes remain unstaged. Do not commit only the eight staged files. Source files remain identical to the final reef snapshots; the prepared baseline split was never applied. Earlier uncommitted gameplay fixes were preserved. Commit/push requires a session with Git write access. Task 004 also stays open for browser and artwork criteria.
