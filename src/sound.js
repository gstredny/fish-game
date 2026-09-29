// Little sound effects, made on the fly with the Web Audio API: no sound files, works offline.
// Phones only allow sound after a tap, so unlock() runs on the first touch, click or key.
// On iPhone the ring/silent switch and the volume buttons control these sounds.

const NOTES = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5, G4: 392, E4: 329.63, C4: 261.63 };

// Which sounds this frame's events call for. Winning or losing replaces the grow or bump
// that caused it, and several snacks in one frame make one "nom".
export function cuesFor(events, previousPhase, phase) {
  const cues = new Set();
  for (const event of events) {
    if (event.type === "eat") cues.add("eat");
    if (event.type === "grow") cues.add("grow");
    if (event.type === "hurt") cues.add("hurt");
  }
  if (phase !== previousPhase && phase === "won") {
    cues.delete("grow");
    cues.add("won");
  }
  if (phase !== previousPhase && phase === "gameover") {
    cues.delete("hurt");
    cues.add("gameover");
  }
  return [...cues];
}

export function createSound(AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext) {
  let context = null;
  let volume = null;
  let lastPhase = null;

  function tone({ from, to = from, start = 0, length = 0.12, type = "sine", gain = 0.5 }) {
    const at = context.currentTime + start;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, at);
    if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(to, at + length);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(envelope).connect(volume);
    oscillator.start(at);
    oscillator.stop(at + length + 0.02);
  }

  const CUES = {
    // A bubbly "nom": two quick drops in pitch.
    eat() {
      tone({ from: 720, to: 320, length: 0.09 });
      tone({ from: 560, to: 260, start: 0.07, length: 0.08, gain: 0.35 });
    },
    // A rising chime.
    grow() {
      [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((note, index) =>
        tone({ from: note, start: index * 0.09, length: 0.22, type: "triangle", gain: 0.4 }));
    },
    // A soft low "bonk".
    hurt() {
      tone({ from: 220, to: 90, length: 0.22, type: "triangle", gain: 0.7 });
    },
    // A little fanfare for becoming the shark.
    won() {
      [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.G5, NOTES.C6, NOTES.E6].forEach((note, index) =>
        tone({ from: note, start: index * 0.11, length: index === 6 ? 0.6 : 0.2, type: "triangle", gain: 0.4 }));
    },
    // A gentle "oh well", not a sad trombone.
    gameover() {
      [NOTES.G4, NOTES.E4, NOTES.C4].forEach((note, index) =>
        tone({ from: note, start: index * 0.18, length: 0.3, type: "triangle", gain: 0.4 }));
    }
  };

  return {
    get ready() { return context?.state === "running"; },
    // Call from a tap, click or key press; phones keep sound off until then.
    unlock() {
      if (!AudioContextClass) return;
      try {
        if (!context) {
          context = new AudioContextClass();
          volume = context.createGain();
          volume.gain.value = 0.35;
          volume.connect(context.destination);
        }
        if (context.state !== "running") context.resume();
      } catch {
        context = null;
      }
    },
    play(cue) {
      if (context?.state !== "running" || !CUES[cue]) return false;
      CUES[cue]();
      return true;
    },
    // Reads (but does not use up) this frame's game events and plays what they call for.
    listen(world) {
      const cues = lastPhase === null ? [] : cuesFor(world.events, lastPhase, world.phase);
      lastPhase = world.phase;
      for (const cue of cues) this.play(cue);
      return cues;
    }
  };
}
