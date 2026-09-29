# Learn about the ocean while you play

Date: 2026-09-29
Status: in progress
Branch: `claude/ocean-learning`

## Intent Contract

### Today the customer/user sees
George, 2026-09-29: "this game is for my kids and I want to teach them about the food chain in the ocean and things in the ocean."
(Today the fish have made-up names — sprat, coral fish, parrotfish — and the parrotfish eats other fish, which real parrotfish don't. Nothing teaches anything.)

### After this change the customer/user should see
George, 2026-09-29: "as you go throughout the game, like have this be real fish that are in the ocean and have it pop up with, you know, five or five to six year old knowledge that they can, it can either speak it like, Hey, this is a parrot fish and they eat X, Y, Z, or this is a seahorse. They eat this and it teaches them about the ocean. So it's not just a game, but like they're learning as they do it."

George's choices, 2026-09-29:
- Food chain: "True chain + schools" — grow Sardine → Mackerel → Squid → Tuna → Great white shark; each really eats the ones below it; your own kind swims beside you as friends.
- Pop-up: "Pause, big card, voice" — first time ever meeting an animal, the game pauses, a big card shows it and the voice reads it; after that, its name floats above it and the voice says one short line.
- Sea friends: "Yes" — seahorse, sea turtle, octopus, sea star, crab, parrotfish, clownfish; plus a spoken "you grew!" line.
- Picture: "Real photo" on the card.

### Smoke test (no code, just clicks)
Drafted by Claude; George to confirm.
1. On the phone, open the game sideways. Next to **Dive in** there is an **Ocean book** button. Tap it: 13 animals, all "?". Tap **Back**.
2. Tap **Dive in**. The voice says "You're a little sardine! Sardines eat plankton. Watch out for mackerel!"
3. Swim near the glowing dots. After a few seconds the game stops and a card shows a real photo of plankton; the voice reads it. Tap **Keep swimming**.
4. Swim near the other sardines: they swim along with you and never hurt you.
5. Let a bigger fish bump you. The voice says who eats whom, like "Watch out! Mackerel eat sardines!"
6. Swim low along the sea bed until you meet a crab, sea star, seahorse, octopus or clownfish; its card opens.
7. Pause, tap **Ocean book**: the animals you met show their photos. Tap one to hear it again.
8. Tap the speaker button at the top to turn the voice off; it stays off next time.

### Out of scope for this contract
Recording George's own voice; other languages; quizzes; renaming the planted coral (its clownfish live in coral, not anemones); resetting the Ocean book; a food-chain picture on the win screen.

## Done criteria

- [ ] `npm test` passes, including the new food-chain, meeting, voice, book and whole-app learning tests; each new test was seen red with the rule it guards broken.
- [ ] `node tools/browser-learn.mjs` passes in headless Chromium: empty book, first card with a loaded photo and its spoken text, sea-bed meeting, name tag, book replay, card and book fit at 844×390/340/330; zoo screenshots inspected.
- [ ] `browser-sideways.mjs`, `browser-reef.mjs`, `browser-play.mjs`, `browser-autoplay.mjs` still pass.
- [ ] Every photo is free to share, credited in `CREDITS.md` and on the card.
- [ ] Tried on George's iPhone: the voice speaks after tapping **Dive in**.

## Attempt log

- 2026-09-29: Intent captured; George picked all four recommended options.
- 2026-09-29: Built the true chain (sardine → mackerel → squid → tuna → great white; own kind = school), sea friends (turtle and parrotfish swim; seahorse, octopus, sea star, crab and clownfish-in-anemone on the sea bed), fact cards with voice, name tags, spoken grow/bump lines, Ocean book, voice button. A helper session is sourcing free-to-share photos from Wikimedia Commons.
- 2026-09-29: On a preview copy with placeholder photos, `browser-sideways`, `browser-reef` (desktop and phone) and `browser-autoplay` pass. The autoplay bot first stalled at mackerel for 76 s, because it chased its own schoolmates as food (a bot bug). With the bot fixed, it reached the shark in 20.6 s with 3 hearts (23.2 s before this change).
- 2026-09-29: An independent read-only review found 9 issues, all fixed. Each fix has a test that went red with the fix undone:
  - Enter on a focused button also ran the global Enter action, which started a swim behind the book and left the keys stuck.
  - Turning the voice on made no sound in that tap, so iPhone stayed silent.
  - The great white ate plankton after the win, which contradicts its card.
  - Clownfish in your coral had no anemone (their card says they live in one); the crab had 8 legs, not 10.
  - Enter on "Hear it again" closed the card instead of replaying it.
  - There was no voice switch on the start screen.
  - A grow line could cut off a card's reading.
  - The card stacked into a column on small sideways phones (568×320).
