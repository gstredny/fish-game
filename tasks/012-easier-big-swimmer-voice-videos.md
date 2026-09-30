# Easier Big swimmer, one voice everywhere, more animals, and videos

Date: 2026-09-30
Status: done on branch `claude/easier-big-swimmer-voice-videos`; waiting for George's iPhone check
Branch: `claude/easier-big-swimmer-voice-videos`

## What George asked for

George, 2026-09-30:
- "the big swimmer, the harder version of the game is too hard. You need to make it easier. Yeah, just slower for the animals to attack you."
- "the voice is great on the big swimmer one, but on the little swimmer, it's still the bad non-human voice. It sounds like a robot. Make both voices the same on each side."
- "look to see where you can add more animals … get more pictures … that are free, but good ones."
- "whenever you click to learn more, it just sends you to Google … it'd be cool if it, like … pulled up a YouTube video or something about educational about it."

## What changed

- **Big swimmer is easier.** Its hunters still turn and chase, but slowly: 30% of your speed instead of 62%, and orcas 45% instead of 80%. They notice you from 180 px instead of 230 px. The safe time after a bump is 2.4 s, the same as Little swimmer (it was 1.5 s). Snacks to grow and mission sizes are unchanged, so it is still the harder level.
  - Measured with a headless simulation of a sloppy player (reacts every 0.35 s, sees hunters only at 150 px, wobbly steering), 200 swims each: Big swimmer game overs fell from 78% to 35% (Little swimmer: 2%). A tidy player still never loses on either level. Script: `difficulty-sim.mjs` in the session scratchpad; not kept in the repo.
- **One voice on both levels.** No code chose the voice by level. The robot voice was the device's speech engine, which the game used whenever a recording failed to play. On iPhone that can happen when a line is said outside a tap. The main difference between the two levels is the tap order: Little swimmer usually starts with Dive in as the very first tap, and Big swimmer with a tap on its level button first. Fixed so it can't matter:
  - A recorded line is never read by the robot voice.
  - If the phone refuses the audio player, the same recording plays through Web Audio (the sound effects' engine, already awake after the first tap). Once refused, lines go straight there until a tap wakes the player again.
  - The first tap no longer wakes the device's speech engine when recordings exist, so it can't get in the audio player's way.
  - Every tap (touch, click or key) wakes the voice before the tap's own button speaks, not just clicks.
  - A line said before the list of recordings has loaded waits for it instead of falling back.
- **8 new sea friends** (29 animals in the Ocean book): penguin, sea otter, seal, narwhal and whale shark in open water; stingray, moray eel and hermit crab on the sea bed. Each has a fact card, a free photo (see CREDITS.md), a drawing, name-tag lines and recordings in the same Kokoro voice. The 97 earlier clips are unchanged; 24 were added.
- **Watch a video.** A fact card shows **Watch a video**, which plays a short kid-friendly video about that animal inside the game (YouTube's privacy-enhanced player). **Back** (or Escape) stops it and returns to the card. Each video ID was checked to be public, allowed in other sites, and not age-restricted. An animal without a video keeps the kid-safe Google search. Both are hidden offline.

## Verification

See the session report for the final numbers; recorded here once the branch was done.

## Open

- George to try on his iPhone: Little swimmer from a fresh open, tap Dive in first, and listen for the recorded voice on the grow lines ("You're a mackerel now!").
- Real iPhone Safari was not available here; the iPhone behaviour was emulated in Chromium (stricter than iPhone: the audio player plays only while a tap is being handled).
