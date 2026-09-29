// Reads facts aloud with the device's own voice, which works offline on phones.
// iPhone lets a page speak only after a tap, so the first line comes from the Dive in button.
export const VOICE_KEY = "little-fish-voice-v1";

export function createVoice(storage = globalThis.localStorage, synth = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance) {
  let muted = false;
  try { muted = storage.getItem(VOICE_KEY) === "off"; } catch {}
  let voice = null;
  const pickVoice = () => {
    const voices = synth?.getVoices?.() ?? [];
    voice = voices.find(option => /^en[-_]US/i.test(option.lang) && option.localService) ||
      voices.find(option => /^en/i.test(option.lang)) || null;
  };
  pickVoice();
  synth?.addEventListener?.("voiceschanged", pickVoice);
  const busy = () => Boolean(synth?.speaking || synth?.pending);
  return {
    available: Boolean(synth && Utterance),
    get muted() { return muted; },
    // A polite line waits its turn: it is skipped while something else is being said.
    // A forced line (the card's "hear it again" button) speaks even when the voice is off.
    say(text, { polite = false, force = false } = {}) {
      if ((muted && !force) || !synth || !Utterance || (polite && busy())) return false;
      if (busy()) synth.cancel();
      const line = new Utterance(text);
      if (voice) line.voice = voice;
      line.lang = voice?.lang || "en-US";
      line.rate = 0.92;
      line.pitch = 1.1;
      synth.speak(line);
      return true;
    },
    stop() {
      if (busy()) synth.cancel();
    },
    setMuted(value) {
      muted = value;
      if (muted) this.stop();
      try { storage.setItem(VOICE_KEY, muted ? "off" : "on"); } catch {}
    }
  };
}
