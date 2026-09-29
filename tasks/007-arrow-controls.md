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

- [x] `npm test` → 34 passed, 0 failed (new: eight-way pad directions with a rest spot; holding a pad arrow swims the fish).
- [x] `node tools/browser-sideways.mjs` → up-right arrow swims the fish up and right and lights "1,-1"; lifting stops it; a finger held on the water leaves the fish still; left arrow scrolls the ocean; arrows alone grow a sprat in 1.9 s; whole start screen and win panel fit at 844×390, 844×340 and 844×330; errors: none.
- [x] Controls, each red on its own assertion: finger steering restored ("a finger on the water should not move the fish"); pad cut from movement ("the up-right arrow should swim the fish up and right", plus the node test); short-screen start layout removed ("844x340: start or win screen does not fit"); pad always visible ("arrow pad should stay hidden on the start screen").
- [x] `browser-play.mjs desktop|phone` and `browser-autoplay.mjs` (shark at 23.2 s, three hearts) run with no console errors.
- [ ] Tried on George's iPhone from the home-screen icon.

## Attempt log

- 2026-09-29: Finger steering made the fish stop under the finger, which hid it. Replaced it on touch-first devices with an eight-way arrow pad that feeds the same movement as the arrow keys. Mouse steering still works on computers.
- 2026-09-29: The first phone run showed the fish drifting to the top-left corner while a finger rested on the water. Chrome sends a synthetic mouse hover at (0,0), and mouse steering chased it. Touch-first devices now ignore mouse steering.
- 2026-09-29: iPhone cannot make a web page full screen; only a home-screen web app hides the bars. Added an iPhone-only tip on the start screen, a full-bleed 180px `apple-touch-icon` (the old icon had transparent corners, which iOS fills black), `apple-mobile-web-app-title`, and an Android install button when Chrome offers one. Offline cache moves to v7.
- 2026-09-29: `browser-reef.mjs` failed 1 of 3 runs here at a shelter step ("Timed out: hearts === 2"). On unchanged `master` it failed 2 of 3 phone runs at the neighbouring step ("2 !== 3"). This change does not touch reef, shelter, or keyboard code. Left for its own investigation.
