# Missions, levels, a natural voice, and more animals

Date: 2026-09-30
Status: done on branch; waiting for George's iPhone check
Branch: `claude/peaceful-ride-dled9q`

## What George asked for

George, 2026-09-29:
- "improving the voice? It's just very robotic. Is there anything else I could… add a good… voice that's better for kids to hear?"
- "I want them to be able to see and say 'Oh, that's a sardine'… the sardines picture was… a bunch of them all in one."
- "add a feature to where basically they can maybe do like a web search to see where they can dig deeper into one."
- "Can we add a few more animals? Or fish. Or creatures."
- "It's too easy. And once you become a shark the game never ends. You just keep eating everything. What's the objective?"

George's choices, 2026-09-29:
- Shark goal: **Missions each swim**.
- Difficulty: **Pick a level** (Little swimmer / Big swimmer).
- Voice: **Recorded natural voice**.
- New animals: all four pairs: orca + dolphin, jellyfish + pufferfish, blue whale + manta ray, lobster + sea urchin.

"Rebase everything from GitHub": the branch already matched `origin/master` (`34b90e5`), so there was nothing to rebase. `origin/claude/project-innovation-brainstorm-ei0baa` has one commit that isn't on master (`7f7d736`, sound effects and "what's new"). It was left alone.

## What changed

- **Missions.** Reaching great white shark pauses on a mission card, which the voice reads out. Each swim picks a mission different from the last: eat tuna, eat squid, meet sea friends, find the blue whale (an arrow points to it), or swim away from an orca (a bump restarts the count). Finishing it ends the swim with **Mission complete!** and earns the coral. The coral used to come just for reaching shark. There is no endless "Explore the ocean" any more.
- **Orca at the top of the food chain.** Orcas are tier 6. They appear now and then at the tuna and shark stages. Cards and spoken lines now say "Only orcas hunt great white sharks".
- **Levels.**
  - **Little swimmer** is the previous game.
  - **Big swimmer** takes more snacks per stage (8/9/11/12 instead of 6/7/8/9) and has more hunters. The hunters turn and chase at 62% of your speed; orcas chase at 80%. The safe time after a bump drops to 1.5 s, and missions ask for more.
  - The choice is remembered on the device.
- **Voice.** All 97 lines the game says are recorded with Kokoro-82M (Apache-2.0, voice `af_heart`, speed 0.9). That is 2.7 MB of MP3 in `voice/`, cached for offline play.
  - When a line has no recording, the device voice speaks it instead. The device voice now skips the novelty voices, such as "Albert", that iPhone lists.
  - The service worker answers range requests, which Safari needs to play cached audio.
  - `npm test` fails if any spoken line has no recording.
- **Eight new animals**, each with a fact card, a photo, a drawing and lines: orca, dolphin, jellyfish, pufferfish (it puffs up when you swim close), blue whale (rare), manta ray, lobster and sea urchin. The Ocean book now holds 21 animals.
- **Find out more.** Each card has a link that opens a Google search for "<animal> facts for kids" with SafeSearch forced on. It is hidden when the device is offline.
- **Sardine photo.** The school of sardines is replaced with a single sardine.

## Verification

- `npm test`: 91 passed, 0 failed. 15 runs of the whole suite in a row had no flaky failures.
- Controls: each new test was checked by breaking the rule it guards and reverting afterwards. All 19 went red. The rules broken were:
  - mission repeats;
  - coral farming after a win;
  - Big swimmer chase;
  - the double shark line;
  - the clip ticket, novelty-voice filter, iPhone `hasOwn` and unlock-while-playing;
  - the SW range, all-or-nothing clip install and 416;
  - the orca reset and respawn;
  - the offline link;
  - sea-friend counting;
  - the whale card and last-friend card;
  - Escape and cancel while planting after a win;
  - a deleted clip.
- Browser, headless Chromium 141, no page errors:
  - `browser-check` (desktop, phone and six screen sizes, including 568×320);
  - `browser-learn` (21 photos load; book, card, mission card and "Find out more" fit at five sizes; zoo);
  - `browser-sideways`;
  - `browser-reef` (desktop and phone);
  - `browser-play` (desktop and phone);
  - `browser-voice` (the clip plays after a tap, online and offline, and the device voice stays quiet).
- Autoplay bot, time to reach the shark: Little about 20 s; Big 27 to 44 s in good runs, and over 150 s in a run with a bad start.
- An independent read-only review found 2 should-fix bugs, 3 nits and 2 wording issues, and all are fixed:
  - `Object.hasOwn` froze the game on iOS below 15.4.
  - The last sea friend of a mission got no card.
  - A click could cut off a clip.
  - The service worker install failed outright if one clip failed.
  - Bad byte ranges got a malformed reply.
  - The lobster had "ten legs and two claws".
  - The pufferfish card said "swim close and watch it puff".
- Not tested: real Safari or WebKit (only Chromium ran here). The 206 range path is unit-tested for Safari's `bytes=0-1`.

## Open

- George still needs to try it on his iPhone: the recorded voice after tapping Dive in, and whether Big swimmer is hard enough.
- Voice samples are available for picking a different voice.
