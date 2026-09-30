# Fix the three reviewed regressions

Date: 2026-09-30
Branch: master
Status: fixes committed, pushed and deployed; browser/live-file verification remains open

## Intent contract

Today: real-fish mode leaves saved drawings out of NPC spawning; Home can cause the next swim
to repeat the previous mission; painting a new fish leaves real-fish mode enabled.

After: every effective NPC drawing can spawn; mission history changes only when a swim starts;
saving a painted fish selects that drawing and remembers drawing mode.

Verify: `npm test`; the three new flow tests exercise the actual main.js event bindings.
Then commit each fix separately on master, push all local commits to origin/master and verify
the remote SHA and GitHub Pages deployment. Browser checks must be muted.

## Done criteria

- [x] All three new regressions demonstrated failing before fixes.
- [x] All three permanent regression tests pass against the actual checkout.
- [x] `npm test` passes with real counts.
- [ ] Changed paths exercised in a muted real browser with screenshots inspected.
- [x] One conceptual commit per fix, with explicit pathspecs and reviewed staging.
- [x] `git ls-remote origin refs/heads/master` confirms the three fixes reached origin/master.
- [ ] GitHub Pages serves the final release.

## Attempt log (append-only)

- Review baseline: `npm test`: 113 passed, 0 failed, 0 skipped. Each review reproduction failed.
- Draft NPC regression: 0 passed, 1 failed, 0 skipped against the original checkout; one-line
  effective-NPC-list fix in an isolated temporary source: 1 passed, 0 failed, 0 skipped.
- Draft Home regression: 0 passed, 1 failed, 0 skipped; temporary mission-history fix:
  1 passed, 0 failed, 0 skipped, across four zones and Home after win/pause/game-over.
- Draft drawing regression: 0 passed, 1 failed, 0 skipped; temporary drawing-selection fix:
  1 passed, 0 failed, 0 skipped, including persistence after reload.
- Combined temporary candidate: `node --test /tmp/fish-fixes-final-*.test.mjs`:
  3 passed, 0 failed, 0 skipped. These are fixture checks, not browser screenshots.
- Browser runtime lists no connected browser. Prior muted Chrome and local server launch attempts
  were denied by the sandbox; no sound test or blocked launch retry.
- Held the checkout after the concurrency question. George renewed the instruction:
  "ok commit please and push". Proceeding with his explicit direction; HEAD remains 4f9dc3e,
  tree/index clean, no index lock, no other agents running in this session.
- Remote preflight: `git ls-remote origin refs/heads/master`:
  91872aaa5b79c80bf8bde99fb23b57e82aa81dc8. GitHub Pages deploys master from the repo root.
  The existing bottom-zone commits are local-only and will be included in the authorized push.
- Applied slice 1. `node --test tests/npc-drawings-flow.test.js`:
  1 passed, 0 failed, 0 skipped. `git diff --check`: exit 0. Only the effective NPC count changed.
- Commit c8af708 `Spawn drawings in real-fish mode`: source + its regression only; gitleaks hook
  found no leaks. Staged paths reviewed before commit; explicit commit pathspecs used.
- Applied slice 2. `node --test tests/home-mission-flow.test.js`:
  1 passed, 0 failed, 0 skipped, covering four zones, all three Home exit screens and preview clicks.
  `git diff --check`: exit 0. Only actual swim starts now update the separate mission history.
- Commit a4ca845 `Remember missions across Home previews`: source + its regression only;
  gitleaks found no leaks. Staged paths reviewed; explicit commit pathspecs used.
- Applied slice 3. `node --test tests/drawing-mode-flow.test.js`:
  1 passed, 0 failed, 0 skipped. Painting and Swim selects the new drawing and persists that choice.
  `git diff --check`: exit 0.
- Full checkout suite: `npm test > /tmp/fish-fixes-full-tests.log 2>&1`: exit 0;
  116 passed, 0 failed, 0 cancelled, 0 skipped. No unrelated file changes in the diff.
- Commit 0fd2fee `Select newly painted fish for swimming`: source + its regression only;
  gitleaks found no leaks. Staged paths reviewed; explicit commit pathspecs used.
- Final source diff reviewed: three small changes in main.js, three separate flow-test files.
  Remote SHA pre-push check failed: `git ls-remote origin refs/heads/master`: exit 128,
  `Could not resolve host: github.com`. Proceeding to the explicitly authorized normal push;
  no force push or alternate remote.
- `git push origin master`: exit 0; `91872aa..0fd2fee master -> master`.
  All three fixes and all three previously local-only bottom-zone commits are now pushed.
- Browser discovery remains empty, so screenshots and a real-browser smoke remain unverified.
  Post-push compound `git ls-remote` again returned DNS resolution failure; checking the
  remote via separate read-only commands and GitHub API, then watching Pages deployment.
- Separate `git ls-remote origin refs/heads/master`: exit 0;
  0fd2feee45fe3ca72e7c2e9c2e9d5cd6cb29f0cf, matching the tested fix HEAD.
  `gh api repos/gstredny/fish-game/git/ref/heads/master --jq '.object.sha'` confirms the same SHA.
- `gh api 'repos/gstredny/fish-game/actions/runs?head_sha=0fd2feee45fe3ca72e7c2e9c2e9d5cd6cb29f0cf'`:
  Pages run 36737004155 completed successfully for that SHA:
  https://github.com/gstredny/fish-game/actions/runs/36737004155.
- Live-file checks: curl for the Pages sw.js and main.js returned exit 6 (`Could not resolve host`).
  Web-tool requests for both files also returned inaccessible. GitHub reports deployment success;
  served-file contents, screenshot verification and phone behavior remain unverified.
