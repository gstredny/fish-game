# Harder ocean animals

Date: 2026-09-30
Status: done on branch; waiting for George's check on the phone
Branch: `claude/harder-ocean-animals`

## What George asked for

George, 2026-09-30: "The animals are basic… we need some new harder ones so my son actually learns. He's very smart and all those animals are relatively easy. Let's add more animals from the ocean… Not obscure but different creatures! You can do anything! Be brave!"

## What changed

- **Twelve new sea friends**, each picked to teach a bigger idea than "who eats whom". Each has a fact card, a real photo, a drawing and recorded lines:

  | Animal | Where | The idea it teaches |
  |---|---|---|
  | Hammerhead shark | open water | feeling the electricity every animal makes |
  | Whale shark | open water | a shark, not a whale; filter feeders |
  | Narwhal | open water | a tusk that is a tooth; the Arctic |
  | Anglerfish | open water | a lure like a fishing rod; bioluminescence |
  | Sea otter | open water | using tools; otters → urchins → kelp forests |
  | Penguin | open water | a bird that flies underwater; poles apart from polar bears |
  | Flying fish | open water | gliding to escape |
  | Portuguese man o' war | open water | not a jellyfish: a colony |
  | Mantis shrimp | sea bed | the fastest punch; seeing colors we can't |
  | Sea cucumber | sea bed | an animal, cousin of sea stars; breathes through its bottom |
  | Moray eel | sea bed | a fish, not a snake; a second set of jaws |
  | Horseshoe crab | sea bed | not a crab; older than dinosaurs; blue blood |

  The Ocean book now holds 33 animals. The plankton and crab cards now list whale sharks and sea otters among the animals that eat them.
- **Never-met animals come first.** Sea friends this device has never met are chosen before the others. A child who already knows the first 21 animals meets the new ones within a few swims, not by chance.
- **Anglerfish photo.** The only free photo of a live anglerfish is a goosefish, and its lure does not glow. So the card says that every anglerfish has a rod and lure, and that deep-sea anglerfish have glowing ones. The drawing is a deep-sea anglerfish with a glowing lure.
- **Offline cache v15**, with the 12 photos. 48 new voice clips, recorded with the same Kokoro voice.

## Verification

- `npm test`: 104 passed, 0 failed, and the same in 5 runs in a row.
- Controls: each new test was checked by breaking the rule it guards, seeing it go red, and reverting.
  - Never-met first: drop the `unmet` pool in `makeFriend`.
  - The real game passes the Ocean book into each swim: drop `met` from `startSwim`.
  - Every sea friend has a drawing: remove the moray from `PAINTERS`.
- Browser, headless Chromium 141, no page errors:
  - `browser-learn`: 33 photos load. The book and the wordiest card (anglerfish) fit at five sizes down to 568×320, and so does the card with the longest name (Portuguese man o' war). The last tile (horseshoe crab) can be reached above Back. The zoo shows every animal.
  - `browser-sideways`, `browser-play` (desktop and phone), `browser-reef` (desktop and phone), `browser-sound`, `browser-voice` (online and offline), `browser-update`, `browser-autoplay` (shark and mission in 17.6 s), `browser-check`.
- Photos: the licence of each was read on its own Commons page: NOAA public domain, CC BY 2.0, or CC BY-SA 2.0/3.0/4.0. Three were checked again by hand.
- An independent read-only review found no must-fix issues. It found:
  - one fact that was too broad: "hammerheads love stingrays" is true of great hammerheads;
  - one test gap: nothing checked that the real game passes the Ocean book into a swim;
  - some small wording points, about mantis shrimp that punch and narwhal tusks, which mostly males grow.

  All are fixed and re-recorded. Left as they are:
  - the anglerfish's needle teeth (they are what it's known for);
  - the penguin drawing's gold neck patch next to a gentoo photo;
  - card alt text that lowercases "Portuguese".
- Not tested: real Safari or WebKit.

## Open

- George to try it on his phone. How do the new animals read at phone size, and does his son like them?
