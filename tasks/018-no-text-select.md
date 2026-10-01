# Holding an arrow must not pop up Copy / Look Up

Date: 2026-09-30
Status: done; live on GitHub Pages (333ea04). George holding an arrow on his phone is the last check

George: "Whenever you use the arrows, this thing comes up because it's like trying to highlight
stuff. Can you remove that so if you play like a normal game?" (screenshot: blue selection handles
on "1 coral · hide inside when small", Copy / Look Up / Translate / Search Web bar over the water)

## Intent contract

Today: `.pad` is `user-select: none` + `-webkit-touch-callout: none`, but iPhone Safari's hold
gesture then selects the nearest text that is still selectable (the reef bar, hint, HUD).

After: the `body` rule carries `user-select: none`, `-webkit-user-select: none` and
`-webkit-touch-callout: none`, so nothing on the page can be selected. There are no text inputs,
so nothing is lost. Cache `little-fish-v24` so phones fetch the new `style.css`.

## Done criteria

- [x] `tests/no-text-select.test.js` fails before the CSS change, passes after.
- [x] `npm test`: 111 passed, 0 failed, 0 skipped.
- [x] Pages deploy succeeds; live `sw.js` is `little-fish-v24` and live `style.css` has the body rule.
- [ ] George holds an arrow on his phone: no handles, no Copy bar. (His phone; cannot be run here.)

## Attempt log (append-only)

- Root cause from the screenshot + CSS: the handles sit on the reef-bar text, not the pad. The pad's
  own no-select rules were already there (style.css `.pad`), so a pad-only fix was never enough.
- One change: body-wide no-select. Test seen failing ("body rule is missing user-select: none"), then
  111/111 after. Fallback if the phone still shows it: `touchstart` `preventDefault()` on the pad.
- Committed and pushed 333ea04. Pages run 36804007724: completed, success. Live `sw.js`:
  `const CACHE = "little-fish-v24";`. Live `style.css` body rule has `user-select: none`,
  `-webkit-user-select: none`, `-webkit-touch-callout: none` (curl with a cache-busting query).
