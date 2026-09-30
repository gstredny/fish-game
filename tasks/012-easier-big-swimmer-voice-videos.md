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

- **Photos**: all 8 from Wikimedia Commons, licenses read from Commons' metadata (see CREDITS.md). The narwhal is NOAA's public-domain pod photo; a sharper single-narwhal photo was rejected because its CC BY-SA claim (an oil company's press office) could not be traced to its source.

## Verification

- `npm test`: 112 passed, 0 failed.
- Controls (break it, see red, restore): the slow-chase test; 5 voice guards (no Web Audio fallback, no "refused" shortcut, no wait for the recordings list, silent robot unlock, robot reading a recorded line); 5 review regressions (tap silence ending a loading line, double fallback, starting on a sleeping engine, polite line replacing a waiting one, device voice never woken when the list fails); 4 video guards (player not removed, keys reaching the card, voice not stopped, search link shown with a video); a missing painter. All went red.
- Browser, headless Chromium 141, no page errors: `browser-voice` (online, offline, and iPhone-strict for both levels; the old voice code fails it), `browser-learn` (29 photos load; book and card fit at 5 sizes), `browser-check`, `browser-sideways`, `browser-reef`, `browser-play` (desktop, phone), `browser-sound`, `browser-update`, `browser-autoplay` (Little and Big both won with 3 hearts).
- Video panel at 844×390, 568×320 and 1280×800: player and Back in view; Back removes the player; browser history stays at the same length over repeated videos.
- Independent read-only review: 1 must-fix (a tap's silent sound ending cut off the line that tap was loading), 3 should-fix (video history, double fallback echo, sleeping Web Audio keeping the voice busy), 3 nits. All fixed except the silent switch (below). The reviewer's own reproduction went from 3/3 lines lost to 3/3 heard.
- Not checked here: real iPhone Safari, and real YouTube playback (this sandbox's browser can't reach YouTube). All 29 video IDs pass YouTube's oEmbed and embed-page checks; a garbage ID fails them.

## Open

- George's ruling: should the game ignore the iPhone silent switch (`navigator.audioSession.type = "playback"`, iOS 17+)? Today the switch silences Web Audio (sound effects and the voice's fallback) but not the audio element, so on a silenced phone some lines are heard and some are not.

- George to try on his iPhone: Little swimmer from a fresh open, tap Dive in first, and listen for the recorded voice on the grow lines ("You're a mackerel now!").
- Real iPhone Safari was not available here; the iPhone behaviour was emulated in Chromium (stricter than iPhone: the audio player plays only while a tap is being handled).
