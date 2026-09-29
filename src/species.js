// What the fact cards and the voice say. Written for five- and six-year-olds: short, true,
// and about who eats whom. `lines` are the one-liners spoken when you meet an animal again.
export const SPECIES = {
  plankton: {
    name: "Plankton", plural: "plankton", hello: "This is plankton!",
    facts: ["Plankton are tiny living things that drift in the sea. Most are too small to see!",
      "Plant plankton make lots of the air we breathe."],
    eats: "Sunlight! Plant plankton make food from it, like trees do",
    eatenBy: "Sardines, mackerel, and even giant whales",
    say: "Plant plankton make their food from sunlight, like trees. Lots of animals eat plankton, even giant whales!",
    lines: ["Little fish eat plankton.", "Tiny food for little fish."]
  },
  sardine: {
    name: "Sardine", plural: "sardines", hello: "This is a sardine!",
    facts: ["Sardines are small, shiny, silver fish.",
      "They swim together in big groups called schools. Staying together keeps them safe."],
    eats: "Tiny plankton",
    eatenBy: "Mackerel, squid, tuna, sharks, dolphins and seabirds",
    say: "Sardines eat tiny plankton. Mackerel, squid, tuna and sharks eat sardines.",
    lines: ["Sardines swim together in schools.", "Sardines eat plankton."]
  },
  mackerel: {
    name: "Mackerel", plural: "mackerel", hello: "This is a mackerel!",
    facts: ["Mackerel are fast fish with wavy stripes on their backs.", "They swim in big schools, too."],
    eats: "Plankton and little fish, like sardines",
    eatenBy: "Squid, tuna, sharks and dolphins",
    say: "Mackerel eat plankton and little fish, like sardines. Squid, tuna and sharks eat mackerel.",
    lines: ["Mackerel eat little fish.", "Mackerel have wavy stripes."]
  },
  squid: {
    name: "Squid", plural: "squid", hello: "This is a squid!",
    facts: ["A squid is not a fish! It has a soft body and ten arms.", "Squid can squirt ink to hide from danger."],
    eats: "Little fish, like sardines and mackerel",
    eatenBy: "Tuna, sharks, dolphins and whales",
    say: "Squid grab little fish, like sardines and mackerel, with their arms. Tuna and sharks eat squid.",
    lines: ["Squid have ten arms!", "Squid can squirt ink.", "A squid has three hearts!"]
  },
  tuna: {
    name: "Tuna", plural: "tuna", hello: "This is a tuna!",
    facts: ["Tuna are big fish and super-fast swimmers.", "A tuna has to keep swimming to breathe."],
    eats: "Fish, like mackerel, and squid",
    eatenBy: "Big sharks and killer whales",
    say: "Tuna eat fish, like mackerel, and squid. Big sharks eat tuna.",
    lines: ["Tuna are super fast!", "Tuna eat squid and fish."]
  },
  shark: {
    name: "Great white shark", plural: "sharks", hello: "This is a great white shark!",
    facts: ["Great white sharks are the biggest hunting fish in the sea.",
      "They have about 300 teeth, and they grow new ones all the time!"],
    eats: "Big fish like tuna, seals, and even other sharks",
    eatenBy: "Almost nothing! Only killer whales hunt them",
    say: "Great whites eat big fish, like tuna, and seals. Only killer whales hunt great white sharks.",
    lines: ["Great whites have about 300 teeth!", "Sharks are at the top of the food chain."]
  },
  seahorse: {
    name: "Seahorse", plural: "seahorses", hello: "This is a seahorse!",
    facts: ["A seahorse is a fish with a head shaped like a horse. It holds on to seaweed with its curly tail.",
      "Seahorse dads carry the babies in a pouch on their tummy!"],
    eats: "Tiny shrimp and plankton",
    eatenBy: "Crabs and some bigger fish",
    say: "Seahorses slurp up tiny shrimp with their long snouts.",
    lines: ["Seahorses hold on with their curly tails.", "Seahorse dads carry the babies!"]
  },
  turtle: {
    name: "Sea turtle", plural: "sea turtles", hello: "This is a sea turtle!",
    facts: ["Sea turtles have a hard shell and flippers for swimming.",
      "They breathe air, so they swim up to the top to take a breath."],
    eats: "Sea grass, jellyfish or crabs. It depends on the turtle",
    eatenBy: "Big sharks, like tiger sharks",
    say: "Some sea turtles eat sea grass. Some eat jellyfish!",
    lines: ["Sea turtles breathe air!", "Some sea turtles eat jellyfish."]
  },
  octopus: {
    name: "Octopus", plural: "octopuses", hello: "This is an octopus!",
    facts: ["An octopus has eight arms covered in suckers.",
      "It can change color to hide. It has three hearts and blue blood!"],
    eats: "Crabs, clams and shrimp",
    eatenBy: "Sharks, seals and big fish",
    say: "Octopuses love to eat crabs.",
    lines: ["An octopus has eight arms!", "Octopuses can change color."]
  },
  starfish: {
    name: "Sea star", plural: "sea stars", hello: "This is a sea star! Some people call it a starfish.",
    facts: ["A sea star is not a fish. Most sea stars have five arms.",
      "If a sea star loses an arm, it can grow a new one!"],
    eats: "Clams and mussels",
    eatenBy: "Sea otters, crabs and some fish",
    say: "Sea stars eat clams. They push their tummy out of their mouth to eat!",
    lines: ["Sea stars can grow new arms!", "A sea star has no brain!"]
  },
  crab: {
    name: "Crab", plural: "crabs", hello: "This is a crab!",
    facts: ["Crabs walk sideways!", "A crab has ten legs. The front two are big pinching claws."],
    eats: "Almost anything: plants, little animals and leftovers",
    eatenBy: "Octopuses, fish, sea turtles and birds",
    say: "Crabs eat almost anything, even leftovers.",
    lines: ["Crabs walk sideways!", "Crabs pinch with their claws."]
  },
  parrotfish: {
    name: "Parrotfish", plural: "parrotfish", hello: "This is a parrotfish!",
    facts: ["Parrotfish have teeth shaped like a parrot's beak.",
      "They nibble the green fuzz off coral. Their poop comes out as white sand!"],
    eats: "Algae, the green fuzz that grows on coral",
    eatenBy: "Sharks and big fish",
    say: "Parrotfish eat algae that grows on coral. Lots of white beach sand is parrotfish poop!",
    lines: ["Parrotfish poop makes sand!", "Parrotfish have beaks like a parrot."]
  },
  clownfish: {
    name: "Clownfish", plural: "clownfish", hello: "This is a clownfish!",
    facts: ["Clownfish are orange with white stripes.",
      "They live in sea anemones. The anemone stings other fish, but not clownfish!"],
    eats: "Plankton and leftovers from their anemone",
    eatenBy: "Bigger fish, if they leave home",
    say: "Clownfish eat plankton and leftovers from their anemone home.",
    lines: ["Clownfish live in anemones.", "Anemones don't sting clownfish!"]
  }
};

export const FOOD_CHAIN = ["plankton", "sardine", "mackerel", "squid", "tuna", "shark"];
export const SEA_FRIEND_KINDS = ["seahorse", "turtle", "octopus", "starfish", "crab", "parrotfish", "clownfish"];
export const KINDS = [...FOOD_CHAIN, ...SEA_FRIEND_KINDS];

// Spoken when a card opens: its name, first fact, and who eats whom.
export function cardSpeech(kind) {
  const animal = SPECIES[kind];
  return `${animal.hello} ${animal.facts[0]} ${animal.say}`;
}

export function meetLine(kind, random = Math.random) {
  const animal = SPECIES[kind];
  return `${animal.name}! ${animal.lines[Math.floor(random() * animal.lines.length)]}`;
}

// Growing up the food chain: what you eat now, and who still eats you.
export function growLine(stage) {
  const you = FOOD_CHAIN[stage + 1];
  const food = FOOD_CHAIN[stage];
  const hunter = FOOD_CHAIN[stage + 2];
  const name = SPECIES[you].name.toLowerCase();
  if (!hunter) return `You're a ${name}! Sharks are at the top of the food chain!`;
  return `You're a${stage ? "" : " little"} ${name}${stage ? " now" : ""}! ${capital(SPECIES[you].plural)} eat ${SPECIES[food].plural}. Watch out for ${SPECIES[hunter].plural}!`;
}

export function hurtLine(hunterKind, stage) {
  return `Watch out! ${capital(SPECIES[hunterKind].plural)} eat ${SPECIES[FOOD_CHAIN[stage + 1]].plural}!`;
}

function capital(text) {
  return text[0].toUpperCase() + text.slice(1);
}
