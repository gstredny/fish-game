// What the fact cards and the voice say. Written for five- and six-year-olds: short, true,
// and about who eats whom. `lines` are the one-liners spoken when you meet an animal again.
export const SPECIES = {
  plankton: {
    name: "Plankton", plural: "plankton", hello: "This is plankton!",
    facts: ["Plankton are tiny living things that drift in the sea. Most are too small to see!",
      "Plant plankton make lots of the air we breathe."],
    eats: "Sunlight! Plant plankton make food from it, like trees do",
    eatenBy: "Sardines, mackerel, manta rays, and even giant blue whales",
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
    eatenBy: "Big sharks and orcas",
    say: "Tuna eat fish, like mackerel, and squid. Big sharks and orcas eat tuna.",
    lines: ["Tuna are super fast!", "Tuna eat squid and fish."]
  },
  shark: {
    name: "Great white shark", plural: "sharks", hello: "This is a great white shark!",
    facts: ["Great white sharks are the biggest hunting fish in the sea.",
      "They have about 300 teeth, and they grow new ones all the time!"],
    eats: "Big fish like tuna, seals, and even other sharks",
    eatenBy: "Almost nothing! Only orcas hunt them",
    say: "Great whites eat big fish, like tuna, and seals. Only orcas hunt great white sharks.",
    lines: ["Great whites have about 300 teeth!", "Only orcas hunt great white sharks."]
  },
  orca: {
    name: "Orca", plural: "orcas", hello: "This is an orca! Some people call it a killer whale.",
    facts: ["Orcas are black and white. They are the biggest dolphins in the world!",
      "Orcas live and hunt together in families called pods."],
    eats: "Fish, seals, and even great white sharks",
    eatenBy: "Nothing! Orcas are at the top of the food chain",
    say: "Orcas eat fish, seals, and even great white sharks. Nothing hunts orcas!",
    lines: ["Orcas are the biggest dolphins!", "Orcas live in families called pods.", "Nothing hunts orcas!"]
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
  },
  dolphin: {
    name: "Dolphin", plural: "dolphins", hello: "This is a dolphin!",
    facts: ["A dolphin is not a fish. It breathes air through a blowhole on top of its head.",
      "Dolphins talk to each other with clicks and whistles."],
    eats: "Fish, like sardines and mackerel, and squid",
    eatenBy: "Big sharks and orcas",
    say: "Dolphins eat fish and squid. They swim up to the top to breathe air!",
    lines: ["Dolphins breathe through a blowhole!", "Dolphins talk with clicks and whistles."]
  },
  jellyfish: {
    name: "Jellyfish", plural: "jellyfish", hello: "This is a jellyfish!",
    facts: ["A jellyfish is not a fish! It has no brain, no heart and no bones.",
      "Its long tentacles can sting, so look, but don't touch!"],
    eats: "Plankton, fish eggs and tiny fish",
    eatenBy: "Sea turtles and some fish",
    say: "Jellyfish catch tiny plankton with their stinging tentacles. Sea turtles love to eat jellyfish!",
    lines: ["Jellyfish have no brain!", "Look, but don't touch! Jellyfish sting.", "Sea turtles eat jellyfish."]
  },
  pufferfish: {
    name: "Pufferfish", plural: "pufferfish", hello: "This is a pufferfish!",
    facts: ["When a pufferfish is scared, it gulps water and puffs up into a big spiky ball!",
      "Being big and spiky makes it very hard to eat."],
    eats: "Crabs, clams, snails and sea urchins",
    eatenBy: "Hardly anything! Only a few sharks try",
    say: "Pufferfish crunch crabs and clams with their strong teeth. Swim close, and watch it puff up!",
    lines: ["Pufferfish puff up when they're scared!", "Pufferfish crunch crabs with strong teeth."]
  },
  bluewhale: {
    name: "Blue whale", plural: "blue whales", hello: "This is a blue whale!",
    facts: ["The blue whale is the biggest animal that has ever lived, even bigger than the dinosaurs!",
      "A blue whale is as long as two school buses."],
    eats: "Krill: tiny, shrimp-like plankton. Millions every day!",
    eatenBy: "Almost nothing! Only orcas, once in a while",
    say: "The biggest animal in the world eats some of the tiniest! Blue whales gulp up tiny krill.",
    lines: ["Blue whales are the biggest animals ever!", "Blue whales eat tiny krill."]
  },
  manta: {
    name: "Manta ray", plural: "manta rays", hello: "This is a manta ray!",
    facts: ["Manta rays flap their wide fins like wings. They look like they're flying underwater!",
      "A big manta ray is wider than a car."],
    eats: "Plankton! It swims with its mouth wide open to scoop it up",
    eatenBy: "Big sharks and orcas",
    say: "Manta rays swim with their mouths wide open to scoop up tiny plankton.",
    lines: ["Manta rays fly through the water!", "Manta rays eat plankton."]
  },
  lobster: {
    name: "Lobster", plural: "lobsters", hello: "This is a lobster!",
    facts: ["A lobster has a hard shell, ten legs and two big claws.",
      "Lobsters can zoom backwards by flapping their tails!"],
    eats: "Crabs, clams, snails and sea urchins",
    eatenBy: "Big fish, octopuses and seals",
    say: "Lobsters walk along the sea floor and eat crabs, clams and sea urchins.",
    lines: ["Lobsters swim backwards!", "A lobster has ten legs."]
  },
  urchin: {
    name: "Sea urchin", plural: "sea urchins", hello: "This is a sea urchin!",
    facts: ["A sea urchin is a spiky ball. Its spikes keep it safe.",
      "It walks very slowly on hundreds of tiny tube feet."],
    eats: "Seaweed, like kelp",
    eatenBy: "Sea otters, lobsters, crabs and pufferfish",
    say: "Sea urchins munch on seaweed. Sea otters, lobsters and pufferfish eat sea urchins.",
    lines: ["Sea urchins are spiky!", "Sea urchins eat seaweed."]
  }
};

export const FOOD_CHAIN = ["plankton", "sardine", "mackerel", "squid", "tuna", "shark", "orca"];
export const SEA_FRIEND_KINDS = ["turtle", "dolphin", "jellyfish", "pufferfish", "manta", "bluewhale", "parrotfish",
  "seahorse", "octopus", "starfish", "crab", "lobster", "urchin", "clownfish"];
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
  return `You're a${stage ? "" : " little"} ${name}${stage ? " now" : ""}! ${capital(SPECIES[you].plural)} eat ${SPECIES[food].plural}. Watch out for ${SPECIES[hunter].plural}!`;
}

export function hurtLine(hunterKind, stage) {
  return `Watch out! ${capital(SPECIES[hunterKind].plural)} eat ${SPECIES[FOOD_CHAIN[stage + 1]].plural}!`;
}

function capital(text) {
  return text[0].toUpperCase() + text.slice(1);
}

// "Find out more" on a card: a web search for kids' facts, with Google's SafeSearch switched on.
export function searchLink(kind) {
  return `https://www.google.com/search?safe=active&q=${encodeURIComponent(`${SPECIES[kind].name} facts for kids`)}`;
}
