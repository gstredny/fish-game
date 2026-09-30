import { growLine } from "./species.js";

// Once you're a great white shark, the swim has one mission, different from the last one.
// Finishing it ends the swim and earns a coral colony. `need` depends on the level; for the
// orca it's seconds of staying away.
export const MISSIONS = {
  tuna: { photo: "tuna", eat: "tuna", need: { little: 2, big: 4 }, goal: need => `Eat ${need} tuna`,
    done: need => `You ate ${need} tuna!`, count: (have, need) => `${have} of ${need} tuna!` },
  squid: { photo: "squid", eat: "squid", need: { little: 3, big: 5 }, goal: need => `Eat ${need} squid`,
    done: need => `You ate ${need} squid!`, count: (have, need) => `${have} of ${need} squid!` },
  friends: { photo: "dolphin", need: { little: 2, big: 4 }, goal: need => `Meet ${need} sea friends`,
    done: need => `You met ${need} sea friends!`, count: (have, need) => `${have} of ${need} sea friends!` },
  whale: { photo: "bluewhale", need: { little: 1, big: 1 }, goal: () => "Find the blue whale",
    done: () => "You found the blue whale, the biggest animal ever!" },
  orca: { photo: "orca", need: { little: 10, big: 18 }, goal: () => "Swim away from the orca",
    done: () => "You got away from the orca!" }
};

export function pickMission(last, random = Math.random) {
  const ids = Object.keys(MISSIONS).filter(id => id !== last);
  return ids[Math.floor(random() * ids.length)];
}

export function createMission(id, level) {
  return { id, need: MISSIONS[id].need[level] ?? MISSIONS[id].need.little, have: 0, active: false, done: false,
    seen: new Set(), target: null, wait: 0 };
}

export function missionGoal(mission) {
  return MISSIONS[mission.id].goal(mission.need);
}

// Said when you become a shark: what sharks eat, who hunts them, and your mission.
export function missionLine(mission) {
  return `${growLine(4)} Your mission: ${lower(missionGoal(mission))}!`;
}

export function missionDoneLine(mission) {
  return `Mission complete! ${MISSIONS[mission.id].done(mission.need)}`;
}

export function missionCount(mission) {
  return MISSIONS[mission.id].count?.(mission.have, mission.need) ?? null;
}

function lower(text) {
  return text[0].toLowerCase() + text.slice(1);
}
