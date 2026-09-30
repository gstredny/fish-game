import { CREATURES, FORMS, hunters, LEVELS, SHARK } from "./rules.js";
import { cardSpeech, growLine, hurtLine, KINDS, SPECIES } from "./species.js";
import { createMission, MISSIONS, missionDoneLine, missionLine } from "./missions.js";

export const VOICE_ON = "Voice on!";
export const FIND_THAT_ONE = "Keep swimming to find that one!";

// Every line the game can say. tools/make-voice.py records each one (see README), and
// tests/voice-clips.test.js fails if one has no recording.
export function allLines() {
  const lines = [VOICE_ON, FIND_THAT_ONE];
  for (const kind of KINDS) {
    lines.push(cardSpeech(kind), ...SPECIES[kind].lines.map(line => `${SPECIES[kind].name}! ${line}`));
  }
  for (let stage = 0; stage < SHARK; stage++) lines.push(growLine(stage));
  for (let stage = 0; stage < FORMS.length; stage++) {
    for (const tier of hunters(stage)) lines.push(hurtLine(CREATURES[tier].kind, stage));
  }
  for (const id of Object.keys(MISSIONS)) {
    for (const level of Object.keys(LEVELS)) {
      const mission = createMission(id, level);
      lines.push(missionLine(mission), missionDoneLine(mission));
    }
  }
  return [...new Set(lines)];
}
