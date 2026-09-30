# Ocean zones: six places to swim, each with its own animals

Date: 2026-09-30
Status: slice 1 (coral reef + zone plumbing) done and pushed; slices 2–5 open
Branch: `master`

## Intent Contract

### Today the customer/user sees
One ocean. One food chain (plankton → sardine → mackerel → squid → tuna → great white → orca) and 26 sea
friends, all in the same blue water with the same sea bed. A child who has played a few times has met them all.

### After this change the customer/user should see
George, 2026-09-30: "it would be cool to be in different parts of the ocean. You see the animals that exist in
certain areas, like shallow coral reef, deep water, super deep water... my son is going to remember all the
animals after playing a couple times, so I want him to keep learning. So there should be more animals in
multiple levels, be like 'oh wait, what's that animal? Oh, what's THAT animal?' So it's literally teaching them
as they play different levels, different scenes. Like, if it's at the bottom of the ocean, it's dark, and you
only can see little things, however the animals work down there... be brave and ambitious."

### Smoke test (no code, just clicks)
1. On the phone, sideways, the start screen asks **Where will you swim?** with six places: Coral reef, Kelp
   forest, Open ocean, Icy sea, The deep, The bottom. A place with animals this device has never met shows a
   "new" mark. The device remembers the pick.
2. Pick **Coral reef**, tap **Dive in**. The water is bright and warm. The voice says "Welcome to the coral reef!
   You're a little damselfish! Damselfish eat plankton. Watch out for lionfish!" You grow damselfish → lionfish
   → grouper → reef shark → tiger shark. Clownfish, parrotfish, a moray, coral and a giant clam sit on the reef.
3. Pick **The deep**. It is nearly dark. You see a soft glow around your own body and small lights moving in the
   black. Swim toward a light: an animal appears out of the dark, and its card opens. Animals with no light of
   their own appear only when they come close.
4. Pick **The bottom**. It is black except your glow. The floor is mud. Sea pigs and a tripod fish stand on it.
   Somewhere there is a hot vent with tube worms.
5. Open the **Ocean book**: animals are grouped by place. An animal that lives in two places shows in both.
   The count at the top counts each animal once.
6. Finish a swim in any place: **Swim again** swims the same place. The missions fit the place ("Eat 2 reef
   sharks", "Find the whale shark", "Swim away from the orca" only where an orca lives).

### Out of scope for this contract
Unlocking zones in order (all six are open; a "new" mark is the nudge); quizzes; a depth map picture; the
child's planted coral in every zone (it stays where it is today; the deep zones will decide later);
other languages.

## Design

### The zone table (`src/zones.js`, data only)
Each zone: `name`, `hello` (the welcome the voice says), `light` (1 bright … 0.05 black), `floor` (a sea bed to
stand on), `chain` (kinds by tier: tier 0 is the snack no one plays, tiers 1–5 are the five forms, tier 6 the
top hunter and is optional), `friends` (gentle kinds that live here), `giant` (the rare one the "find" mission
looks for), `backdrop` (panorama file), `water` (fallback colours). Tier sizes, speeds and growth goals stay in
`rules.js` as the tier ladder, so every zone keeps the promise a child can see (predators 1.25×, snacks 0.85×).

| Zone | Light | Floor | Chain (tier 0 → top) | New friends | Giant |
|---|---|---|---|---|---|
| Coral reef | 1 | yes | plankton → damselfish → lionfish → grouper → reef shark → tiger shark → orca | coral, giant clam (+ today's reef animals) | whale shark |
| Kelp forest | 0.85 | yes | plankton → anchovy → rockfish → lingcod → sea lion → great white → orca | garibaldi, leopard shark, harbor seal, bat ray | gray whale |
| Open ocean | 1 | yes | today's chain | today's open-water friends | blue whale |
| Icy sea | 0.9 | yes, with ice above | plankton → krill → silverfish → squid → penguin → leopard seal → orca | Weddell seal, icefish, sea spider | humpback whale |
| The deep | 0.3 | no | marine snow → shrimp → lanternfish → viperfish → giant squid → sperm whale (top: nothing) | hatchetfish, barreleye, vampire squid (+ anglerfish) | oarfish |
| The bottom | 0.05 | yes, mud, a hot vent | marine snow → amphipod → snailfish → rattail → deep-sea lizardfish → sleeper shark (top: nothing) | sea pig, tripod fish, giant isopod, tube worms | dumbo octopus |

Every link is a real "eats": lionfish eat damselfish, groupers eat lionfish, reef sharks eat groupers, tiger
sharks eat reef sharks; lingcod eat rockfish, sea lions eat lingcod, great whites eat sea lions; silverfish eat
krill, squid eat silverfish, penguins eat squid, leopard seals eat penguins, orcas eat leopard seals; lanternfish
eat shrimp, viperfish eat lanternfish, giant squid eat deep-sea fish, sperm whales eat giant squid; snailfish eat
amphipods, rattails eat small fish, lizardfish eat fish, sleeper sharks eat rattails. The `eats` text on each card
names the food below it; `tests/learn.test.js` checks that for every zone.

### Darkness (The deep, The bottom)
After the animals are painted, a dark layer covers the screen with a soft hole around the player (your own
glow: many deep animals make light). Kinds marked `glow` in their species entry paint their lights on top of the
dark, so a child sees little lights moving and swims to find out what they are. Name tags and cards work as
today, so an animal is met when it is close, which in the dark is also when it becomes visible.

### Files
- `src/zones.js` new: the table above. `src/species-*.js` new per zone; `species.js` merges them.
  `src/paint-*-animals.js` new per zone, registered into `PAINTERS` (no 5,000-line file).
- `rules.js`: `CREATURES`/`FORMS` lose `kind`, `name`, `color`; kinds come from `world.zone.chain`, colours
  from the species entry. `ORCA` becomes the zone's top tier.
- `world.js`: `createWorld(..., zone)`; friends come from `zone.friends`; no floor friends when `zone.floor` is
  false; the "orca" mission only where a top hunter exists.
- `missions.js`: missions by role (eat tier 4, eat tier 3, meet friends, find the giant, flee the top hunter),
  worded from the zone's kinds. The open ocean's words stay as they are today.
- `lines.js`: every line for every zone, so the voice is recorded for all of them.
- `main.js`, `index.html`, `style.css`: the zone picker on the start screen; the Ocean book grouped by zone.
- `paint.js`: backdrop per zone; darkness; no sea bed where there is no floor.
- `art/ocean-*.webp`: one Blender panorama per zone (`tools/render-ocean.py --zone`).
- Photos, `CREDITS.md`, voice clips, `sw.js` cache list.

### Slices (tracer bullet first)
1. Zone plumbing end to end + **Coral reef** (7 new animals: damselfish, lionfish, grouper, reef shark, tiger
   shark, coral, giant clam). Picker, book by zone, zone missions, reef backdrop, tests, voice, browser check.
2. **The deep** + darkness and glow (10 new animals, no floor).
3. **The bottom** + the hot vent (9 new animals).
4. **Kelp forest** (9 new animals).
5. **Icy sea** (7 new animals, ice ceiling).

## Done criteria

Slice 1 (zones + coral reef, plus George's three asks):
- [x] `npm test` → 110 passed, 0 failed, 0 skipped. New tests seen red with their rule broken: greetings
      never wait (`GREET_GAP = 0`), the swim ignores the picked zone, floor animals where there is no floor,
      Home forgets to reset, every zone offers the flee mission. (A sixth, "top hunter spawns where there is
      none", was vacuous: the top tier there is your own kind. Replaced by the flee-mission check.)
- [x] Every reef animal: species entry (facts sourced, flags in the log), real licensed photo (each looked
      at: 600×400 WebP, CC BY / CC BY-SA from Commons), drawing, voice clips, CREDITS line.
- [x] `browser-zones` (new) and `browser-learn` pass in headless Chrome 154, no page errors: the picker fits
      and shows "new" counts, the reef is remembered and its water shows behind the start screen, the swim
      says the welcome line and names reef forms in the HUD and mission card, Home works, the book is by
      place, the fish switch works, start screen and book fit at 844×340, 667×375 and 568×320.
- [x] `browser-sideways`, `browser-play` (desktop, phone), `browser-reef`, `browser-autoplay`, `browser-voice`
      pass (Chrome CDP); `browser-sound`, `browser-update`, `browser-check` pass (Playwright Chromium).
- [x] Screenshots inspected: the reef start screen, the reef swim with all seven drawings, the tiger shark as
      player, the mission card, pause with Home, the book by place, the start screen with a saved drawing at
      844×390 and 1280×600 (the fish switch and the zone row needed tighter mid-height styles).
- [ ] Pushed to `origin/master` and live on GitHub Pages (sw cache `little-fish-v16`).

Later slices (the deep, the bottom, kelp forest, icy sea):
- [ ] Same checks per zone; the dark zones' screenshots show the glow and the lights.

## Attempt log

- 2026-09-30: Rebased local `master` onto `origin/master` (32 commits, PR #4 harder animals). Read the game.
  Wrote this plan. Started the voice venv install in the background (Python 3.12, Kokoro model download).
- 2026-09-30: George added three asks mid-build, folded into slice 1: a **Home** button (pause, win, game over);
  **Swim as a real fish** once a drawing is saved (the drawing joins the other fish); calmer greetings (one known
  animal's name tag and line every 6 s, `GREET_GAP`), since in Big swimmer the names came "penguin, starfish, man
  o' war" all at once. Fish speed unchanged, as asked.
- 2026-09-30: Slice 1 plumbing built: `zones.js`; tiers in `rules.js` lost their kinds; `world.js` takes an
  options object (`{ reef, artCount, level, zone, mission, met }`); missions by role (`hunt`, `snack`, `friends`,
  `find`, `flee`); `lines.js` covers every zone; picker, book by place, Home, fish switch in `main.js`. Reef
  panorama rendered (`tools/render-ocean.py` now has a `ZONES` palette; `art/ocean-reef.webp`). Two helpers wrote
  `species-reef.js` + `paint-reef-animals.js` and sourced the 7 photos. Tests updated; new `tests/zone-flow.test.js`
  and `tools/browser-zones.mjs`. First `npm test` after the rewrite: only photo and voice-clip checks failing
  (waiting on the photos and the recording). Voice venv set up at `.venv`; recording 199 lines.
- 2026-09-30: Photos: the helper found all seven on Commons (licences from the API metadata; all CC BY,
  CC BY-SA or public domain). Voice: Hugging Face download failed with `CERTIFICATE_VERIFY_FAILED` (the work
  Mac's HTTPS inspection); fixed by building a CA bundle from the keychain and setting `SSL_CERT_FILE` (now
  in the README). 56 clips generated, 143 reused, 2 pruned, 199 total.
- 2026-09-30: Layout: with a saved drawing the start screen overflowed at 1280×600 and 568×320 (the zone row
  and the fish switch add height). Fixed with mid-height styles (smaller title, tighter gaps), hiding the
  tagline under 340px, and keeping the fish switch in the button row on sideways phones, small and unwrapped.
- 2026-09-30: Fact flags from the species helper, kept as written: "orcas eat reef sharks" (orcas eat many
  sharks incl. a close relative; no reef-shark-specific record), "sometimes reef sharks" eat lionfish
  (sharks documented, not reef-shark-specific), "wider than a door" for a giant clam over a metre.
- 2026-09-30: Commits on `master`: `4c34fc6` zones + coral reef, `fa74b85` voice, `950a5a2` Home / real
  fish / calmer greetings, then this write-up. Pushed to `origin/master` after this entry.
