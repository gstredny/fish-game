import { SPECIES, growLine } from "./species.js";
import { formKind, hasTopHunter, topTier, ZONES } from "./zones.js";

// Once you're the biggest form, the swim has one mission, different from the last one. Finishing
// it ends the swim and earns a coral colony. Missions are roles; the zone fills in the animals:
// eat the tier-4 kind (tuna in the open ocean), eat the tier-3 kind, meet sea friends, find the
// zone's giant, or stay away from the top hunter, in zones that have one. `need` depends on the
// level; for fleeing it's seconds of staying away.
export const MISSIONS = {
  hunt: { tier: 4, need: { little: 2, big: 4 } },
  snack: { tier: 3, need: { little: 3, big: 5 } },
  friends: { need: { little: 2, big: 4 } },
  find: { need: { little: 1, big: 1 } },
  flee: { need: { little: 10, big: 18 } }
};

export function missionIds(zone) {
  return Object.keys(MISSIONS).filter(id => id !== "flee" || hasTopHunter(zone));
}

export function pickMission(last, zone = ZONES.open, random = Math.random) {
  const ids = missionIds(zone).filter(id => id !== last);
  return ids[Math.floor(random() * ids.length)];
}

export function createMission(id, level, zone = ZONES.open) {
  return { id, zone: zone.id, need: MISSIONS[id].need[level] ?? MISSIONS[id].need.little, have: 0, active: false,
    done: false, seen: new Set(), target: null, wait: 0 };
}

// The animal a mission is about: the snack to eat, the giant to find, the hunter to flee, or the
// poster friend.
export function missionKind(mission) {
  const zone = ZONES[mission.zone];
  const { tier } = MISSIONS[mission.id];
  if (tier) return zone.chain[tier];
  return { friends: zone.friends[0], find: zone.giant, flee: zone.chain[topTier(zone)] }[mission.id];
}

export function missionGoal(mission) {
  const animal = SPECIES[missionKind(mission)];
  const { need } = mission;
  return { hunt: `Eat ${need} ${animal.plural}`, snack: `Eat ${need} ${animal.plural}`,
    friends: `Meet ${need} sea friends`, find: `Find the ${lower(animal.name)}`,
    flee: `Swim away from the ${lower(animal.name)}` }[mission.id];
}

// Said when you become the biggest form: what it eats, who hunts it, and your mission.
export function missionLine(mission) {
  return `${growLine(ZONES[mission.zone], 4)} Your mission: ${lower(missionGoal(mission))}!`;
}

export function missionDone(mission) {
  const animal = SPECIES[missionKind(mission)];
  const { need } = mission;
  return { hunt: `You ate ${need} ${animal.plural}!`, snack: `You ate ${need} ${animal.plural}!`,
    friends: `You met ${need} sea friends!`, find: `You found the ${lower(animal.name)}! ${animal.lines[0]}`,
    flee: `You got away from the ${lower(animal.name)}!` }[mission.id];
}

export function missionDoneLine(mission) {
  return `Mission complete! ${missionDone(mission)}`;
}

// How far along, for missions that count: "1 of 2 tuna!".
export function missionCount(mission) {
  if (!MISSIONS[mission.id].tier && mission.id !== "friends") return null;
  const what = mission.id === "friends" ? "sea friends" : SPECIES[missionKind(mission)].plural;
  return `${mission.have} of ${mission.need} ${what}!`;
}

function lower(text) {
  return text[0].toLowerCase() + text.slice(1);
}
