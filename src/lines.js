import { FORMS, hunters, LEVELS, SHARK } from "./rules.js";
import { cardSpeech, growLine, hurtLine, SPECIES } from "./species.js";
import { KINDS, ZONES } from "./zones.js";
import { createMission, missionDoneLine, missionIds, missionLine } from "./missions.js";

export const VOICE_ON = "Voice on!";
export const FIND_THAT_ONE = "Keep swimming to find that one!";
// Asked when a new animal's card opens, before it is named. "Animal" fits all of them; a whale is no fish.
export const WHAT_ANIMAL = "What animal is this?";

// Every line the game can say, in every zone. tools/make-voice.py records each one (see README),
// and tests/voice-clips.test.js fails if one has no recording.
export function allLines() {
  const lines = [VOICE_ON, FIND_THAT_ONE, WHAT_ANIMAL];
  for (const kind of KINDS) {
    lines.push(cardSpeech(kind), ...SPECIES[kind].lines.map(line => `${SPECIES[kind].name}! ${line}`));
  }
  for (const zone of Object.values(ZONES)) {
    for (let stage = 0; stage < SHARK; stage++) lines.push(growLine(zone, stage));
    for (let stage = 0; stage < FORMS.length; stage++) {
      for (const tier of hunters(stage, zone)) lines.push(hurtLine(zone, zone.chain[tier], stage));
    }
    for (const id of missionIds(zone)) {
      for (const level of Object.keys(LEVELS)) {
        const mission = createMission(id, level, zone);
        lines.push(missionLine(mission), missionDoneLine(mission));
      }
    }
  }
  return [...new Set(lines)];
}
