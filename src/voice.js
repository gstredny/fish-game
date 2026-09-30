// Reads facts aloud. Every line the game knows ahead of time is a recording in voice/ (made with
// tools/make-voice.py), so the voice is warm and the same on every phone, and works offline.
// Anything without a recording falls back to the device's own voice.
// iPhone lets a page make sound only after a tap, so the first tap wakes both up silently.
export const VOICE_KEY = "little-fish-voice-v1";

// A tiny silent WAV, played from the first tap so later clips may play on iPhone.
const SILENCE = "data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
// Novelty and robotic voices some phones list first.
const ODD = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|rocko|shelley|flo\b|eddy|reed|sandy/i;
const WARM = /natural|neural|enhanced|premium|samantha|\bava\b|allison|susan|google us english|aria|jenny/i;

// The friendliest English voice the device has.
export function pickVoice(voices) {
  const score = option => (WARM.test(option.name) ? 4 : 0) + (/^en[-_]US/i.test(option.lang) ? 2 : 0) +
    (option.localService ? 1 : 0);
  return voices.filter(option => /^en/i.test(option.lang) && !ODD.test(option.name))
    .sort((first, second) => score(second) - score(first))[0] ?? null;
}

// Recorded clips, played one at a time through a single audio element (iPhone unlocks one element).
export function createClips(base = "voice/", Player = globalThis.Audio, load = globalThis.fetch) {
  if (!Player || !load) return null;
  let clips = {};
  let playing = false;
  let ticket = 0;
  let failed = null;
  load(`${base}manifest.json`).then(response => response.ok ? response.json() : {})
    .then(manifest => { clips = manifest?.clips ?? {}; }).catch(() => {});
  const audio = new Player();
  audio.preload = "auto";
  const fail = () => {
    playing = false;
    const retry = failed;
    failed = null;
    retry?.();
  };
  audio.addEventListener?.("ended", () => { playing = false; failed = null; });
  audio.addEventListener?.("error", () => { if (playing) fail(); });
  return {
    has: text => Object.hasOwn(clips, text),
    get busy() { return playing; },
    // `fallback` runs if the clip can't play (missing file, blocked sound).
    play(text, fallback) {
      const mine = ++ticket;
      failed = fallback;
      playing = true;
      audio.src = base + clips[text];
      Promise.resolve(audio.play?.()).catch(() => { if (mine === ticket && playing) fail(); });
    },
    stop() {
      ticket++;
      failed = null;
      if (!playing) return;
      playing = false;
      audio.pause?.();
    },
    unlock() {
      audio.src = SILENCE;
      Promise.resolve(audio.play?.()).catch(() => {});
    }
  };
}

export function createVoice(storage = globalThis.localStorage, synth = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance, clips = createClips()) {
  let muted = false;
  try { muted = storage.getItem(VOICE_KEY) === "off"; } catch {}
  let voice = null;
  const findVoice = () => { voice = pickVoice(synth?.getVoices?.() ?? []); };
  findVoice();
  synth?.addEventListener?.("voiceschanged", findVoice);
  const speaks = Boolean(synth && Utterance);
  const busy = () => Boolean(synth?.speaking || synth?.pending || clips?.busy);
  const speak = text => {
    if (!speaks) return;
    const line = new Utterance(text);
    if (voice) line.voice = voice;
    line.lang = voice?.lang || "en-US";
    line.rate = 0.92;
    line.pitch = 1.1;
    synth.speak(line);
  };
  let unlocked = false;
  return {
    available: speaks || Boolean(clips),
    get muted() { return muted; },
    // A polite line waits its turn: it is skipped while something else is being said.
    // A forced line (the card's "hear it again" button) speaks even when the voice is off.
    say(text, { polite = false, force = false } = {}) {
      const recorded = Boolean(clips?.has(text));
      if ((muted && !force) || !(recorded || speaks) || (polite && busy())) return false;
      this.stop();
      if (recorded) clips.play(text, () => speak(text));
      else speak(text);
      return true;
    },
    stop() {
      clips?.stop();
      if (synth?.speaking || synth?.pending) synth.cancel();
    },
    // A silent line from the first tap, so lines said later (after a drawing is saved, say) are heard.
    unlock() {
      if (unlocked) return;
      unlocked = true;
      clips?.unlock();
      if (!speaks) return;
      const line = new Utterance(" ");
      line.volume = 0;
      synth.speak(line);
    },
    setMuted(value) {
      muted = value;
      if (muted) this.stop();
      try { storage.setItem(VOICE_KEY, muted ? "off" : "on"); } catch {}
    }
  };
}
