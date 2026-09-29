# Draw your own fish

Status: in progress

## Intent Contract

### Today the customer/user sees
A ready-made yellow sprat that grows through built-in fish shapes into a shark. Every fish in the ocean is a built-in drawing. All feedback is written text.

### After this change the customer/user should see
Proposal approved by George on 2026-09-29 ("go, rulings 1-3 as recommended"):
- Start screen: the child finger-paints on a fish outline with 8 big crayon colours. Paint is clipped to the fish shape, and the game adds the eye and tail, so a scribble still looks like a real fish.
- Their drawing is the fish they play. It grows through all 5 stages, wags its tail, and flips when it turns.
- Ruling 1: one drawing scales up through all 5 stages, with a shark fin added at the shark stage.
- Ruling 2: saved drawings randomly replace the built-in fish, at up to 50% of the ocean. A sibling draws the plankton; a parent draws the shark that chases the kid.
- Ruling 3: the phone hint and the HUD covering the playfield are fixed too.
- Everything stays on the device and offline. No build step, no dependencies, no upload.

### Smoke test (no code, just clicks)
1. Open the game on a phone. Tap **Draw my fish**.
2. Scribble across the whole drawing space in two colours, including outside the fish. Only the fish shape keeps the colour.
3. Tap **Swim!**. Your fish is in the middle of the ocean and in the top-left card.
4. Eat snacks until you become a shark. Your fish gets a shark fin, and the win screen shows it.
5. Reload. Tap **Draw a new fish**, draw a different fish, tap **Swim!**. Your first fish now swims around the ocean.
6. When a bigger fish swims behind the top card, the card fades so you can see it.

### Out of scope for this contract
Sound or voice, redrawing at each growth stage, deleting saved drawings, sharing drawings between devices, the sea floor scrolling up and down.

## Done criteria

- `npm test` passes, including the new drawing, fish-mix, HUD, and offline-cache rules, each shown red by a control.
- `node tools/browser-check.mjs` passes on desktop, phone, and landscape phone, and fails when the fish-shape clip is removed.
- Screenshots of drawing, play, shark, and the drawn ocean are inspected.
- An independent read-only review finds nothing blocking.

## Attempt log

- 2026-09-29: First real-browser run of the existing game in headless Chromium, at desktop and iPhone-13 sizes: loads with no console errors; start, movement, eating, and damage all work. Found the phone HUD hiding a predator, the phone hint mentioning arrow keys, and the hint staying on screen.
- 2026-09-29: Built the drawing page, saved drawings, drawn player and ocean fish, shark fin and gills, HUD thumbnail, win-screen portrait, fading HUD, device-specific hint, and cache `little-fish-v3`.
- 2026-09-29: Controls, each confirmed red then restored: plankton allowed to be drawn; 90% drawn share; HUD fading for prey; `gallery.js` missing from the offline cache; no storage-full fallback; junk storage not filtered. Browser check with the fish-shape clip removed failed: `paint leaked outside the fish at 0.95,-0.75 (rgba 58,155,255,255)`.
- 2026-09-29: Screenshots showed the 8th crayon wrapping (panel styles overridden by later rules), the secondary intro button above the main one on return visits, and a 150px drawing space in landscape. Fixed all three.

## Evidence

- `npm test` → 18 tests, 18 passed, 0 failed.
- `node tools/browser-check.mjs` → desktop: shark in 54s, 0 retries, 8 drawn fish; phone: shark in 19s, 0 retries, 3 drawn fish; landscape drawing space 283px wide; no page errors.
- Without Playwright: `browser-check FAILED: cannot load Playwright`, exit code 2.
