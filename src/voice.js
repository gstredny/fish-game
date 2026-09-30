// Reads facts aloud. Every line the game knows ahead of time is a recording in voice/ (made with
// tools/make-voice.py), so the voice is warm and the same on every phone, and works offline.
// A recording that can't play is never read by the device's robot voice instead: it plays through
// Web Audio, or not at all. Only a line with no recording at all falls back to the device's voice.
// iPhone lets a page make sound only after a tap, so each tap wakes the audio element up silently.
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
// If the phone refuses that element, the clip plays through `audioContext()` (the sound effects'
// Web Audio, which stays awake once a tap has woken it) until a later tap wakes the element again.
export function createClips(base = "voice/", Player = globalThis.Audio, load = globalThis.fetch, audioContext = () => null) {
  if (!Player || !load) return null;
  let clips = {};
  let loaded = false;
  let playing = false;
  let current = null;
  let source = null;
  let awake = false;
  let blocked = false;
  let ticket = 0;
  // Which line the element is playing (0 while it plays the silence from a tap), and which line has
  // already gone to Web Audio, so an "ended" or "error" only ever speaks for its own line.
  let onElement = 0;
  let fellBack = 0;
  const ready = load(`${base}manifest.json`).then(response => response.ok ? response.json() : {})
    .then(manifest => { clips = manifest?.clips ?? {}; }).catch(() => {}).then(() => { loaded = true; });
  const audio = new Player();
  audio.preload = "auto";
  const finish = mine => { if (mine === ticket) playing = false; };
  const quietSource = () => {
    const old = source;
    source = null;
    try { old?.stop(); } catch {}
  };
  // iPhone puts Web Audio to sleep for calls and app switches: ask it to wake, but a line it can't
  // play now ends, rather than keeping the voice busy or playing late.
  const wake = context => context.state === "running" ? null : Promise.race([
    Promise.resolve(context.resume?.()).catch(() => {}), new Promise(resolve => setTimeout(resolve, 400))]);
  const viaWebAudio = (text, mine) => {
    if (fellBack === mine) return;
    fellBack = mine;
    const context = audioContext();
    if (!context || context.state === "closed") return finish(mine);
    let buffer;
    Promise.resolve(load(base + clips[text])).then(response => response.arrayBuffer())
      .then(bytes => new Promise((resolve, reject) => context.decodeAudioData(bytes, resolve, reject)))
      .then(decoded => { buffer = decoded; return wake(context); })
      .then(() => {
        if (mine !== ticket || !playing) return;
        if (context.state !== "running") return finish(mine);
        const node = context.createBufferSource();
        node.buffer = buffer;
        node.connect(context.destination);
        node.onended = () => {
          if (source === node) source = null;
          finish(mine);
        };
        source = node;
        node.start();
      }).catch(() => finish(mine));
  };
  audio.addEventListener?.("ended", () => finish(onElement));
  audio.addEventListener?.("error", () => { if (playing && onElement === ticket) viaWebAudio(current, ticket); });
  return {
    has: text => Object.prototype.hasOwnProperty.call(clips, text),
    // False until the list of recordings has arrived (or failed to).
    get loaded() { return loaded; },
    // True once the list has arrived empty (or failed to load): every line needs the device's voice.
    get empty() { return loaded && Object.keys(clips).length === 0; },
    ready,
    get busy() { return playing; },
    play(text) {
      const mine = ++ticket;
      quietSource();
      playing = true;
      current = text;
      if (blocked) return viaWebAudio(text, mine);
      onElement = mine;
      audio.src = base + clips[text];
      Promise.resolve(audio.play?.()).then(() => { if (mine === ticket) awake = true; }).catch(error => {
        // A line cut off by the next one (or by stop) just ends.
        if (mine !== ticket || !playing) return;
        if (error?.name === "NotAllowedError") blocked = true;
        viaWebAudio(text, mine);
      });
    },
    stop() {
      ticket++;
      current = null;
      quietSource();
      if (!playing) return;
      playing = false;
      audio.pause?.();
    },
    // From a tap: wakes the element, and wakes it again after the phone refused it. An element
    // already playing a line is already awake; swapping in silence would cut its line off.
    unlock() {
      if ((awake && !blocked) || playing) return;
      onElement = 0;
      audio.src = SILENCE;
      Promise.resolve(audio.play?.()).then(() => { awake = true; blocked = false; }).catch(() => {});
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
  let waiting = null;
  const busy = () => Boolean(waiting || synth?.speaking || synth?.pending || clips?.busy);
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
      if ((muted && !force) || (polite && busy())) return false;
      // Just after the game opens, the list of recordings may still be on its way: the line waits
      // for it rather than being read by the device's voice.
      if (clips?.loaded === false) {
        this.stop();
        waiting = text;
        clips.ready.then(() => { if (waiting === text) this.say(text, { force }); });
        return true;
      }
      const recorded = Boolean(clips?.has(text));
      if (!(recorded || speaks)) return false;
      this.stop();
      if (recorded) clips.play(text);
      else speak(text);
      return true;
    },
    stop() {
      waiting = null;
      clips?.stop();
      if (synth?.speaking || synth?.pending) synth.cancel();
    },
    // Runs on every tap. The device's voice is woken (with one silent line) only when there are no
    // recordings: with recordings, it stays out of the way of the audio element.
    unlock() {
      clips?.unlock();
      if (unlocked || !speaks || (clips && !clips.empty)) return;
      unlocked = true;
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
