# Be this animal — pufferfish adventure

Date: 2026-10-02
Status: DONE and LIVE (ffdec5e, Pages run 37016708482, cache `little-fish-v30`)
Branch: `master`

## Intent contract

Today: the Ocean book contains discovered animal cards. Pufferfish puff up as sea friends,
but the child cannot play as one or use its defence.

After: a discovered pufferfish's Ocean book card offers **Be this animal**. It opens a short,
voiced reef adventure: swim toward a clearly marked rock shelter, press a large **Puff!**
button to deter an approaching hunter, reach shelter, replay or return to the book.
The ordinary swim stays paused with its exact size, hearts, bites and mission progress.
The adventure works with the existing arrow pad, mouse and keyboard, including Space to puff.
It has no timer or loss of saved progress. A bump gives a gentle retry.

Scope: one pufferfish adventure; later animals remain a future decision. Discovery in either
the reef or open ocean unlocks it for that save spot. Entry comes from the book, so the
first-discovery quiz and its growth reward finish normally. No extra currency or save format.

## Slice order

1. Enter a pufferfish scene from its book card, steer, return to the same book/paused swim.
2. Add the puff defence, readable hunter encounter, shelter, gentle retry and success.
3. Record the voice, cache the assets offline, verify the full flow and visual layout.

## Visual plan

Keep the game's Trebuchet/Avenir type and reef art. Palette: reef turquoise `#26a9c9`,
deep water `#073c5e`, warm puffer gold `#ffdd93`, pale seafoam `#f4fff6`, shelter stone `#426777`.
The inflated pufferfish is the memorable element. One short instruction at the top,
arrow pad bottom-left, round gold Puff! action bottom-right, shelter marked in the scene.
Intro, pause and success use the existing panel language. No new menu on the start screen.

## Done criteria

- [x] `node --test tests/puffer*.test.js`: 16 passed, 0 failed, 0 cancelled, 0 skipped.
- [x] `npm test`: 138 passed, 0 failed, 0 cancelled, 0 skipped; progression, quiz, voice and offline checks pass.
- [x] `node tools/browser-puffer.mjs`: exercise discovery-to-book entry, touch steering plus Puff!,
      keyboard, pause, retry, completion, replay, return, and offline flow at 844×390, 568×320, 1280×800.
      → `browser-puffer: 6 passed, 0 failed` (2026-10-02, Claude Code review session).
- [x] Inspect screenshots from the browser check, including puffed fish and reachable controls.
- [x] `git diff --check`: exit 0, no output.

## Attempt log (append only)

2026-10-02 — Read the current handoff and decision-critical card/input/frame code. Current branch
is master; working tree was clean; no index lock; team has only this session's read-only reader.
OS process listing is denied, so no process-level claim of exclusivity is made.

2026-10-02 — Browser runtime setup succeeded, but browser selection returned `No browser is available`;
the troubleshooting discovery returned `[]`. Local server attempt:
`python3 -m http.server 8778 --bind 127.0.0.1` → exit 1, `PermissionError: [Errno 1] Operation not permitted`.
Use the repository's port-free browser smoke approach if Chromium can launch; do not retry the server.

2026-10-02 — Port-free baseline `node tools/browser-check.mjs screenshots/puffer-baseline` → exit 1.
Chromium launched then exited with `MachPortRendezvousServer ... Permission denied (1100)`.
No page loaded or screenshot was captured. Do not repeat a blocked Chromium launch.
The implementation proceeds with Node integration tests; browser verification stays open.

2026-10-02 — Baseline `npm test` → exit 0, 122 passed, 0 failed, 0 cancelled, 0 skipped.
`.venv/bin/python -c 'import kokoro, imageio_ffmpeg, numpy; print("Voice engine dependencies available")'`
→ exit 0, `Voice engine dependencies available`.
The separately provided Chrome DevTools connector lists a connected `about:blank` test page;
investigate whether it can verify the local files without launching Chromium or opening a server.

2026-10-02 — Chrome DevTools `new_page` for the local index returned
`MCP tool call requires approval, but approval policy is never`. The connected page cannot
be navigated by this session. No browser bypass or repeat launch attempted. Visual verification
requires a browser-capable session with permission to open the app; it remains unchecked.

2026-10-02 — `HF_HUB_OFFLINE=1 .venv/bin/python -c 'from kokoro import KPipeline;
p = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M"); p.load_voice("af_heart");
print("Cached Kokoro model and af_heart voice load offline")'` → exit 0,
`Cached Kokoro model and af_heart voice load offline`. New spoken instructions can be
recorded with the existing voice without downloading models.

2026-10-02 — Tracer built and independently verified before deepening:
`node --test tests/puffer*.test.js tests/quiz-flow.test.js tests/steering.test.js`
→ exit 0, 13 passed, 0 failed, 0 cancelled, 0 skipped.
The real main-module bindings demonstrate discovery gating, unaffected quiz growth,
keyboard/mouse/pad movement, paused/ready return origins, first-touch switching,
and exact main-world/storage preservation. `git diff --check` → exit 0.
No browser rendering evidence is claimed. Proceed to defence and shelter.

2026-10-02 — Recorded six new lines with the existing Kokoro voice:
`node tools/voice-lines.mjs > /private/tmp/fish-puffer-lines.json` and
`HF_HUB_OFFLINE=1 .venv/bin/python tools/make-voice.py /private/tmp/fish-puffer-lines.json voice --prune`
→ exit 0, `generated 6, reused 339, pruned 0, total 11609136 bytes in 345 clips`.
No network download was needed. The manifest and six MP3 assets are updated.

2026-10-02 — Builder's combined delete/add patch for `src/puffer-adventure.js` was rejected:
`invalid patch: multiple operations target ...`. No files changed in that attempt.
Continue with a normal Update File patch; no repeat of the rejected operation.

2026-10-02 — Lead review found a short-phone reaction-time bug in the initial simulation:
holding Right at 568×320 reached the hunter just as the warning began, allowing a bump within
about 0.1 seconds. Builder added a distinct warning phase before pursuit/collision and accepts
nearby puff defence during that phase. Normal-input route tests will verify the fix.

2026-10-02 — `node --test tests/voice-clips.test.js tests/offline.test.js` → exit 0,
4 passed, 0 failed, 0 cancelled, 0 skipped. Every new line has a used recording; cached files exist;
recording installation and Safari audio-range responses pass. This is Node evidence, not a
real offline-browser pass.

2026-10-02 — Builder's renderer/simulation/README combined patch failed on an unnecessary README
hunk; no files changed. Reapplied the valid hunks successfully.

2026-10-02 — Builder's first expanded targeted run: 17 passed, 1 failed. The untouched successful
route exposed holding Right past shelter while waiting for a visible retreat. Docking on arrival
after a defence now lets the retreat finish before success. Builder rerun: 18 passed, 0 failed.
The 568×320 normal-input test verifies at least 3.4 seconds between warning and possible bump;
another untouched route verifies successful puff defence through shelter completion.

2026-10-02 — Lead `npm test` → exit 0, 136 passed, 0 failed, 0 cancelled, 0 skipped.
`git diff --check` → exit 0. Independent GPT-6.1 Sol reviewer ran 22 relevant tests
(all passed, 0 failed/skipped) and a real-main fixture probe; no actionable findings.
The requested Opus 5.5 review model is unavailable in this runtime; lead review also ran.
Browser layout, actual audio playback and real offline operation remain unverified.

2026-10-02 — Lead requested one additional input-boundary regression: a second finger's
pointerdown on Puff! must activate immediately while the first finger holds the pad,
without depending on a secondary-touch synthesized click. Builder owns the correction;
rerun the suite after this change.

2026-10-02 — Second-thumb regression first failed as expected: 0 passed, 1 failed,
`second contact activates defence before it lifts`. Touch/pen pointerdown binding fixed it.
Builder's focused rerun: 27 passed, 0 failed/skipped. Lead `npm test` after the fix → exit 0,
137 passed, 0 failed, 0 cancelled, 0 skipped.

2026-10-02 — Lead review identified a remaining release-edge case: after a long touch outlasts
inflation, the subsequent synthesized click could start another puff. Requested physical
pointerdown activation plus keyboard/programmatic click activation, with a held-touch regression.

2026-10-02 — Release-edge fix verified: physical left-button pointerdown activates for mouse/touch/pen;
only zero-detail keyboard/programmatic click activates afterward. Holding each pointer type beyond
inflation then emitting a synthesized click no longer starts a second puff. Builder's focused
checks: 28 passed, 0 failed/skipped. Browser smoke selectors were scoped to the reef section because
pufferfish appear twice in the grouped book; runner is unrun, syntax checked only.

2026-10-02 — Lead's final functional verification:
`node --test tests/puffer*.test.js` → exit 0, 16 passed, 0 failed, 0 cancelled, 0 skipped.
An import-graph/cache diagnostic derived every relative import from `src/main.js` and both
stylesheets from `index.html` → exit 0,
`PASS: all 31 reachable JavaScript modules and both stylesheets are cached`.

2026-10-02 — Final renderer review found the warning marker and shelter label used the same initial
centre with baselines five pixels apart. Moved the warning 85 pixels left. No gameplay or voice change.
Lead then ran `npm test` → exit 0, 138 passed, 0 failed, 0 cancelled, 0 skipped, 258.989625 ms.
`node --check src/puffer-paint.js`, `node --check tools/browser-puffer.mjs`, `git diff --check`
→ exit 0, no output. The recorded clips remain six new plus 339 reused, all covered by the suite.

2026-10-02 — Review session (Claude Code, Opus 5.5). Code review found one real bug: the top line
fell through to "Grouper coming — get ready to Puff!" on retry and win, visible behind the
"Safe in the shelter!" dialog (seen in the desktop screenshot). `NOTES` in `src/puffer-adventure.js`
now names a line for every event; `tests/puffer-flow.test.js` asserts the retry and win lines
(failed first: actual 'Grouper coming — get ready to Puff!').

2026-10-02 — First real run of `node tools/browser-puffer.mjs <scratch>` failed twice, both test
mistakes, not game bugs: (1) desktop offline case pressed Space in the same frame as the click,
while focus was still on the just-hidden `#puffer-go` (after one rendered frame focus is BODY and
Space puffs); (2) phone case sent CDP `touchEnd` with `[first]`, which lifts the listed point —
the pad thumb (logged `pointerup:11:pad`), not the Puff! thumb. Test now waits one frame and lifts
`[second]`; the game keeps steering when the Puff! thumb lifts (pad stays `{x:1,y:0}`).
Rerun → `browser-puffer: 6 passed, 0 failed`. Inspected intro, retry, two-thumb puff, paused and
shelter-success shots at 1280×800, 844×390 and 568×320: controls fit, puffed fish readable.
`npm test` → exit 0, 138 passed, 0 failed, 0 cancelled, 0 skipped. `git diff --check` → exit 0.
Review items left as is (not bugs): per-frame `renderControls`, steering math shared with
`world.js`, dialogs need Tab/click like the main game's won/game-over panels.

2026-10-02 — Committed ffdec5e, pushed `de4e708..ffdec5e master`. Pages run 37016708482 →
completed, success. Live: `curl https://gstredny.github.io/fish-game/sw.js` → `const CACHE = "little-fish-v30";`;
live `src/puffer-adventure.js` has the new retry line; `voice/9eca6c058684.mp3` → 200 audio/mp3.
Muted Chromium on the live URL at 844×390 → `#card-be` and `#puffer-ui` present, 0 page errors,
start screen renders. Not checked: real audio playback, George's phone.

## Handoff / remaining verification

Implementation is uncommitted on `master`; nothing was pushed or deployed.
The playable entry is **Ocean book → discovered Pufferfish → Be this animal**.
The first-discovery quiz remains unchanged. Simulation, controls, renderer and narration have
dedicated modules; main only connects card entry, frame/input/pause/resize and book return.

The task stays open because this session cannot launch or navigate a real browser. No screenshots,
phone rendering, actual audio playback or native offline-browser success are claimed.
In a browser-capable session, run `node tools/browser-puffer.mjs screenshots/puffer`, inspect its
desktop/phone/small-phone screenshots, fix any failures, and close the unchecked criteria.
The runner uses cached response bytes for its port-free offline case; it explicitly does not prove
native service-worker installation. Existing Node worker lifecycle/range/cache tests pass.
