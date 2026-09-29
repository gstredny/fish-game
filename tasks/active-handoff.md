# Active handoff — living reef

Date: 2026-09-29
Branch: `master`
Task: `tasks/004-living-reef.md`

The living reef gameplay is implemented locally: one coral reward per shark swim; pending rewards and planted world coordinates saved on this device; coral survives restarts/reloads; three resident clownfish per colony retreat from nearby predators; small forms can shelter inside, leaving or growing too large restores danger. Placement supports touch, mouse, Enter, cancel, and overlap rejection. Storage failure is visible rather than claiming persistence. Returning swims start beside the reef. New runtime modules are included in offline cache v4.

Verification: `npm test` passed 26, failed 0, skipped 0; syntax checks and `git diff --check` passed. Cache audit verified 15 asset paths, 13 runtime imports, and the existence of all app controls. Tests include the real main module with a minimal DOM/canvas fixture; this is not browser or visual verification.

Remaining: Blender MCP is not exposed and Blender is absent from `/Applications`; canvas coral is a working placeholder. The art preference/connection question has not been answered. Browser QA remains open: Chrome MCP is unavailable due to its shared profile and an approval requirement forbidden by this session policy; server binding and direct CDP access fail with EPERM; direct headless Chrome exited 134. `tools/browser-reef.mjs` is ready for an environment with a local server and isolated Chrome on port 9444, but no live checks or screenshots ran here.

Ship state: committed on `master` in `617c7ec` (browser scripts), `4bd7964` (earlier gameplay fixes), and `500c7c7` (living reef). The Claude Code session created the commits; this Codex session pushed them successfully. `git ls-remote origin refs/heads/master` matched local HEAD at `500c7c703c3cc11ed491125e2cdeb0f255d9f2e0`. Post-push `npm test` passed 26, failed 0, skipped 0. No PR, site deployment, or live-site verification occurred. Task 004 stays open for browser and artwork criteria.

Permission diagnosis: local config sets `default_permissions = ":workspace"` and `approval_policy = "never"`, but saved execution-policy rules already allow standalone `git add`, `git commit -m`, and `git push origin`. Earlier Git failures occurred inside compound shell commands, including heredocs; complex wrappers do not match the individual command rules. Standalone staging, commit `e470fea` (publication status, gitleaks passed), and its push succeeded in this session. No permission settings needed changing for these approved operations. Use separate Git tool calls. **Ask for approval** remains an option for commands that need a new exception. Earlier failed attempts remain in the append-only task log.
