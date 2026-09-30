# Say the animal names right

Date: 2026-09-30
Status: done; live on GitHub Pages (426a567). George's ear on the phone is the last check

George: "can we make sure it doesn't misspronounce crucial animal names. The voice doesnt get some
words pronouncing correct"

## Intent contract

Today: Kokoro reads each line through misaki's G2P. A few words come out wrong: rattail (flap t:
"rattle", "Rachel"), narwhal (an "h"), amphipod (an extra "p"), axes (read as plural of axis), man o'
war (a quote mark makes a pause: "man, oh, war").

After: `tools/make-voice.py` spells those words in Kokoro's phonemes (`SAY_AS`, `[word](/phonemes/)`)
and the lines that use them are recorded again. The game text does not change. Adding a word later
re-records only the lines with it (the clip id hashes the spoken form).

## Done criteria

- [x] Audit every word in `node tools/voice-lines.mjs` with misaki: 6 words not in its dictionary,
  every animal name and every two-way word (live, close, wind, axes...) printed and read.
- [x] `make-voice.py ... --prune`: fixed lines recorded again (31, then 18 for rattail as two words).
- [x] Whisper (`openai/whisper-base.en`) transcription of old vs new clips: every rattail line now heard
  as "rat tail(s)"; man o' war heard as one word.
- [x] `npm test`: 110 passed, 0 failed, 0 skipped.
- [x] Pages deploy succeeds; live `sw.js` is `little-fish-v23`.

## Attempt log (append-only)

- misaki audit (scratch `g2p-audit.py`): not in its dictionary: barreleye, blacktip, fangtooth, rattail(s),
  sailors'. Only rattail sounds wrong (`ɹˈæTAl`, T = flap). Names and 277 longer words read by eye: also
  wrong: narwhal `nˈɑɹhwˌɑl`, amphipod `ˈæmpfəpˌɑd`, axes `ˈæksˌiz`, man o' war `mˈæn ˈO” wˈɔɹ`. Heteronyms
  right in context: live (lˈIv adjective, lˈɪv verb), close, wind, use.
- First fix `ɹˈætˌAl`: Whisper heard "Ratail", "ratales", "retails" on some lines. Changed to two words
  `ɹˈæt tˌAl`: all 18 rattail lines heard as "rat tail(s)" or "Rattails". Old clips were heard as
  "rattle", "Rachel", "Radil", "ratchel".
- Narwhal, amphipod and axes: Whisper wrote the right word before and after (its language model fixes
  spelling), so it cannot prove those; the phonemes were checked instead. No audio was played.
- `sw.js` `little-fish-v23`. `npm test` 110 passed, 0 failed, 0 skipped. Committed and pushed 426a567.
- Pages run 36770779163 for 426a567: completed, success. Live `sw.js`: `const CACHE = "little-fish-v23";`.
  Live `voice/manifest.json` maps "Rattail! Rattails find food by smell." to `514de72dde13.mp3`, the new clip.
