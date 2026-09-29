# Realistic ocean behind cartoon fish

Date: 2026-09-29
Status: Done in code and in a headless browser; not yet seen on George's own phone.

## Intent contract

George: "what if you just change the background to a realistic ocean? That shouldn't be a heavy download, should
it? And then the fish stay [cartoon], or would that look weird?" Blender was already installed (from his Pokémon app)
at `~/Applications/Blender.app`; task 004 had only looked in `/Applications`.

- Today: the ocean is drawn in code (flat gradient, drawn light rays, drawn seabed).
- After: a Blender render sits behind the game: blue water with light shafts from the surface, sand with dappled
  sunlight, rocks fading into haze. It is a 360° panorama, so it wraps with no seam as the fish swims, with slow
  parallax. Fish, snacks, seaweed, coral, and bubbles stay cartoon on top. The drawn water still shows until the
  picture loads. The picture is 64 KB and is cached for offline play (`little-fish-v6`).
- Smoke test: `npm test`; `node tools/browser-sideways.mjs`; screenshots at 844×390 and 1440×900.

## Done criteria

- [x] `blender -b -P tools/render-ocean.py -- art/ocean.webp` renders 4800×800 WebP in about 25 s (Blender 5.2.2, M4 Max).
- [x] `npm test` → 32 passed, 0 failed, 0 skipped (offline-list test now also covers `art/`).
- [x] `node tools/browser-sideways.mjs` → all checks pass, errors: none; `browser-reef.mjs` desktop + phone PASS.
- [x] Frozen lineup of every creature tier near the top and bottom of a sideways phone: every snack and fish readable.

## Attempt log

- 2026-09-29: First render was black: a world-wide water volume swallowed the sunlight before it reached the sand.
  Moved the water into a bounded box.
- 2026-09-29: No light shafts: the gap texture on the shadow-casting surface used generated coordinates, so it was
  solid over 400 m. Switched to object coordinates; shafts and dappled sand appeared.
- 2026-09-29: First in-game lineup: near the bright top, plankton and pale anchovies nearly vanished. Lowered exposure
  and tilted the panorama down (latitude max 46° → 36°) to crop the glare; all tiers then readable.
- 2026-09-29: Voronoi caustic lines looked like floor tiles up close; made them thinner and fainter.
