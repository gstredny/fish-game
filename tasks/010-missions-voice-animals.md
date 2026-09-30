# Missions, levels, a natural voice, and more animals

Date: 2026-09-30
Status: in review
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

See the session report. It covers `npm test`, the controls, the browser scripts and the screenshots.

## Open

- George still needs to try it on his iPhone: the recorded voice after tapping Dive in, and whether Big swimmer is hard enough.
- Voice samples are available for picking a different voice.
