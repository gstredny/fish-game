# Arrow controls, full screen, and an app icon

Date: 2026-09-29
Status: Done in code and in a headless phone-sized browser; not yet tried on George's own phone.

## Intent contract

### Today the customer/user sees
George, on his iPhone, 2026-09-29: "it's not a full screen either, and I want to be able to save it as an icon like a real app on my phone. Um, and then also, like, whenever you use your finger, you can't see the fish. So I wonder if it, you could just have arrows to, to go up and down and back with the fish, like a video game."

### After this change the customer/user should see
- A round arrow pad in the bottom-left corner while swimming. Holding an arrow swims the fish that way; holding between two arrows swims diagonally. The pressed arrows light up. A finger on the water no longer moves the fish, so nothing covers it.
- On iPhone, the start screen says: "Full screen: tap Share, then Add to Home Screen". Opened from the home-screen icon, the game fills the screen, uses a proper square fish icon named "Little Fish", and works offline. On Android the start screen offers "Add to home screen".
- The start screen fits a sideways phone with the browser bars showing (the top was cut off before).

### Smoke test (no code, just clicks)
1. On the iPhone, open https://gstredny.github.io/fish-game/ sideways. The start screen shows the whole title and the Share tip.
2. Tap Share, then Add to Home Screen. A fish icon called "Little Fish" appears on the home screen.
3. Open it from the icon. There are no browser bars.
4. Tap Dive in. Hold the up arrow: the fish swims up. Hold between up and right: it swims diagonally, and both arrows light up.
5. Put a finger on the water away from the fish. The fish does not move toward it.

### Out of scope for this contract
Drawing your own fish (parked on `claude/project-innovation-brainstorm-ei0baa`), sound, the living-reef browser check's flakiness, and a left-handed pad position.

## Done criteria

- [x] `npm test` → 35 passed, 0 failed. New tests:
  - eight-way pad directions with a rest spot;
  - holding a pad arrow swims the fish;
  - the ocean scrolls rather than let the fish under the pad.
- [x] `node tools/browser-sideways.mjs` passes twice in a row, with no page errors:
  - The up-right arrow swims the fish up and right and lights "1,-1"; lifting the thumb stops it.
  - With two thumbs on the pad, when the newer one lifts, the one still down takes over.
  - A finger held on the water leaves the fish still.
  - The left arrow scrolls the ocean.
  - With a simulated iPhone notch, swimming down-left keeps the fish centre at least 21px outside the pad.
  - The arrows alone grow a sprat within 20 s.
  - The pad hides when paused, on the win screen and while planting, and comes back after resuming.
  - The whole start screen and the win panel fit at 844×390, 844×340 and 844×330.
  - A touchscreen laptop gets the pad on its first touch.
- [x] Controls, each red on its own assertion: finger steering restored ("a finger on the water should not move the fish"); pad cut from movement ("the up-right arrow should swim the fish up and right", plus the node test); short-screen start layout removed ("844x340: start or win screen does not fit"); pad always visible ("arrow pad should stay hidden on the start screen").
- [x] `browser-play.mjs desktop|phone` and `browser-autoplay.mjs` (shark at 23.2 s, three hearts) run with no console errors.
- [x] Second-round controls, each red on its own assertion:
  - keep-out removed: "the fish swam under the arrow pad", plus the node test;
  - pad shown during planting: "arrow pad should hide while planting coral";
  - no thumb handover: "the thumb still down should take over";
  - no first-touch pad: "a touch on a mouse-first screen should bring up the arrow pad".
- [ ] Tried on George's iPhone from the home-screen icon.

## Attempt log

- 2026-09-29: Finger steering made the fish stop under the finger, which hid it. Replaced it on touch-first devices with an eight-way arrow pad that feeds the same movement as the arrow keys. Mouse steering still works on computers.
- 2026-09-29: The first phone run showed the fish drifting to the top-left corner while a finger rested on the water. Chrome sends a synthetic mouse hover at (0,0), and mouse steering chased it. Touch-first devices now ignore mouse steering.
- 2026-09-29: iPhone cannot make a web page full screen; only a home-screen web app hides the bars. Added an iPhone-only tip on the start screen, a full-bleed 180px `apple-touch-icon` (the old icon had transparent corners, which iOS fills black), `apple-mobile-web-app-title`, and an Android install button when Chrome offers one. Offline cache moves to v7.
- 2026-09-29: An independent read-only review of `ebc11ea` found one blocking problem.
  - On a notched iPhone opened from the home screen, swimming down-left put 40–65% of the fish under the pad. That is the original complaint again.
  - Fix: the camera now scrolls the ocean rather than let the fish's centre come within its size × 1.4 of the pad. The pad is measured each frame, so notch changes are followed.
- 2026-09-29: The review's minor findings, all fixed:
  - the pad showed while planting coral;
  - a touchscreen laptop with a mouse as its main pointer had no touch control;
  - a second thumb didn't take over;
  - the install button stayed dead after one tap and also showed on desktop;
  - the "fits on screen" check passed for hidden elements;
  - `browser-play.mjs` phone mode still steered by finger;
  - the edge-scroll check depended on frame rate.
- Known, not fixed here:
  - The service worker serves the page from its cache first, so the first open after this deploy shows the old game; the second open is new. Open twice before adding to the home screen.
  - Fixing that properly needs care, because a new page could otherwise load old scripts.
- 2026-09-29: `browser-reef.mjs` failed 1 of 3 runs here at a shelter step ("Timed out: hearts === 2"). On unchanged `master` it failed 2 of 3 phone runs at the neighbouring step ("2 !== 3"). This change does not touch reef, shelter, or keyboard code. Left for its own investigation.
