# Ideas: make the ocean feel alive for a five-year-old
Date: 2026-09-29
Status: Backlog — George picks; nothing here is started

Each idea is one slice: one visible change a child would notice, testable with the browser scripts.
Ordered by how much a young player would feel it, cheapest first within each band.

## Big feel, small cost
1. **Sound and buzz.** A soft "nom" on each bite, a rising chime on growth, a low "bonk" on a hit, a bubbly
   ambient loop. All can be synthesised with the Web Audio API (no files, works offline). Add a mute button.
   `navigator.vibrate` on a hit for Android. Sound is half the fun for this age.
2. **Grow with every bite, not just at level-up.** Scale the player 1.0 → 1.15 across a stage, and open the
   mouth for a few frames on each bite. Feeding Frenzy does this; it makes the "I'm getting bigger" feeling
   continuous instead of four sudden jumps.
3. **Teeth and sparkles.** Predators get a visible toothy grin and a slit eye; snacks get a soft glow. Colour
   and expression are read faster than size by a five-year-old. Pairs with the size fix in task 002.
4. **A finger target ring.** Draw a small ring where the finger is and a faint line from the fish to it, so the
   child sees "the fish goes where I point".
5. **Safe start countdown.** "Ready… swim!" with a two-second blink of safety (also in task 002 as the fix).

## Bigger changes, worth a slice each
6. **An ocean with a top and a bottom.** Right now the world is infinite in every direction and the sand and
   surface are painted stickers that never move. Bound the world vertically: sunlight and plankton near the
   surface, reef fish in the middle, sharks in the dark deep. Add vertical parallax. Children build a mental
   map ("sharks live down there") and the sand becomes a place, not a backdrop. This is the Odell Down Under feel.
7. **Chunkier phone view.** Zoom the camera about 1.3× on screens narrower than 500 px so a sprat is not a
   16 px dot, and keep more creatures on screen (task 002 item 7).
8. **Sharks that look like sharks.** Dorsal fin, white belly, crescent tail. Tuna get a pointed nose and yellow
   finlets, parrotfish a beak. Distinct silhouettes also make the size rule easier to read.
9. **A real threat you can see coming.** Replace the cosmetic chase with a telegraphed lunge: a shark turns
   toward you, pauses half a second, then dashes. Fair, readable, and a little thrilling.
10. **After the crown: a feast, not a traffic jam.** Once you are the shark, spawn every kind of fish, count
    fish eaten, and remember the best count in `localStorage`. Gives a reason to keep playing after the win.
11. **Growth ladder on the win screen.** A row of the five forms with the ones you have been lit up. Children
    love seeing the chain they climbed.
12. **Gentler failure.** Option: a hit costs your snack progress instead of a heart, and there is no game over
    until the third hit in one stage. Fewer tears, same tension. Product call.

## Last mile for the phone
13. **Host it on GitHub Pages.** The repo is public at `github.com/gstredny/fish-game`; enabling Pages on the
    `master` branch gives the HTTPS address needed for Add to Home Screen. One setting, then the service worker
    already makes it work offline. Publishing is George's call.
