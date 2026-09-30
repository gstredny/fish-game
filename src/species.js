// What the fact cards and the voice say. Written for five- and six-year-olds: short, true,
// and about who eats whom. `lines` are the one-liners spoken when you meet an animal again.
export const SPECIES = {
  plankton: {
    name: "Plankton", plural: "plankton", hello: "This is plankton!",
    facts: ["Plankton are tiny living things that drift in the sea. Most are too small to see!",
      "Plant plankton make lots of the air we breathe."],
    eats: "Sunlight! Plant plankton make food from it, like trees do",
    eatenBy: "Sardines, mackerel, manta rays, whale sharks, and even giant blue whales",
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
    eatenBy: "Octopuses, sea otters, fish, sea turtles and birds",
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
    say: "Pufferfish crunch crabs and clams with their strong teeth. Look, but don't touch!",
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
    facts: ["A lobster has a hard shell and ten legs. The front two are big claws.",
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
  },
  // Harder ones, for a child who knows the first animals by heart. Each teaches a bigger idea:
  // senses, filter feeding, bioluminescence, tools, colonies, and animals that aren't what they seem.
  hammerhead: {
    name: "Hammerhead shark", plural: "hammerhead sharks", hello: "This is a hammerhead shark!",
    facts: ["A hammerhead's head is wide and flat, like a hammer, with an eye at each end. It can see above and below at the same time!",
      "Every living animal makes a tiny bit of electricity. Hammerheads can feel it, even from animals hiding under the sand."],
    eats: "Stingrays most of all, plus fish, squid and crabs",
    eatenBy: "Bigger sharks and orcas",
    say: "Hammerheads love to eat stingrays. They find them hiding under the sand by feeling their electricity!",
    lines: ["Hammerheads have an eye at each end of their head!", "Hammerheads can feel electricity!",
      "Hammerheads love to eat stingrays."]
  },
  whaleshark: {
    name: "Whale shark", plural: "whale sharks", hello: "This is a whale shark!",
    facts: ["A whale shark is not a whale. It's a shark, and the biggest fish in the whole ocean!",
      "Every whale shark has its own pattern of white spots, just like you have your own fingerprints."],
    eats: "Tiny plankton, fish eggs and little fish, sieved out of the water",
    eatenBy: "Almost nothing once it's grown. Orcas and big sharks may catch young ones",
    say: "Whale sharks are gentle giants. They swim with their huge mouths open and sieve tiny plankton out of the water. Animals that eat like that are called filter feeders.",
    lines: ["Whale sharks are the biggest fish!", "A whale shark is a shark, not a whale!", "Whale sharks are filter feeders."]
  },
  narwhal: {
    name: "Narwhal", plural: "narwhals", hello: "This is a narwhal! Some people call it the unicorn of the sea.",
    facts: ["A narwhal is a small whale that lives in the icy Arctic Ocean, near the North Pole.",
      "Its long, twisty tusk is really a tooth! It grows right out through the narwhal's lip."],
    eats: "Fish, squid and shrimp, under the Arctic ice",
    eatenBy: "Orcas and polar bears",
    say: "A narwhal's tusk is a tooth that can grow longer than a grown-up is tall! Narwhals breathe air, so they come up through cracks in the ice.",
    lines: ["A narwhal's tusk is a tooth!", "Narwhals live near the North Pole.", "Narwhals are the unicorns of the sea!"]
  },
  anglerfish: {
    name: "Anglerfish", plural: "anglerfish", hello: "This is an anglerfish!",
    facts: ["An anglerfish has a fishing rod growing on its head, with a wiggly lure on the end to trick little fish.",
      "Some anglerfish live deep, deep down, where sunlight never reaches. Their lures glow! Tiny living things called bacteria make the light."],
    eats: "Fish and shrimp that swim up to its lure",
    eatenBy: "Sharks and other big fish. Deep down, hardly anything",
    say: "When a little fish swims up to the lure, gulp! Deep-sea anglerfish have lures that glow in the dark. Light made by living things is called bioluminescence.",
    lines: ["Anglerfish have a fishing rod on their head!", "Deep-sea anglerfish have glowing lures.",
      "Light made by living things is called bioluminescence."]
  },
  otter: {
    name: "Sea otter", plural: "sea otters", hello: "This is a sea otter!",
    facts: ["Sea otters have the thickest fur of any animal. It keeps them warm in cold water.",
      "They float on their backs and use a rock like a tool, to crack open shells on their tummy!"],
    eats: "Sea urchins, crabs, clams and snails",
    eatenBy: "Sharks, orcas and eagles",
    say: "Sea otters eat lots of sea urchins, and sea urchins eat kelp. So sea otters help kelp forests grow!",
    lines: ["Sea otters use rocks as tools!", "Sea otters sometimes hold paws when they sleep.",
      "Sea otters help kelp forests grow."]
  },
  penguin: {
    name: "Penguin", plural: "penguins", hello: "This is a penguin!",
    facts: ["A penguin is a bird, but it can't fly in the air. It flies underwater instead, flapping its wings like flippers!",
      "Almost all penguins live in the south of the world. Polar bears live in the far north, so they never meet in the wild!"],
    eats: "Fish, krill and squid",
    eatenBy: "Leopard seals, sea lions, orcas and sharks",
    say: "Penguins dive down to catch fish, krill and squid. They're birds, so they pop back up to breathe air!",
    lines: ["Penguins fly underwater!", "A penguin is a bird that swims!", "Penguins and polar bears never meet."]
  },
  flyingfish: {
    name: "Flying fish", plural: "flying fish", hello: "This is a flying fish!",
    facts: ["When a hungry fish chases it, a flying fish zooms out of the water and glides through the air on its big, wing-like fins!",
      "One glide can go farther than a whole soccer field."],
    eats: "Tiny plankton",
    eatenBy: "Tuna, dolphins, big fish, and seabirds that catch them in the air!",
    say: "Flying fish don't flap like birds. They glide, like a paper airplane, to get away from fish that want to eat them!",
    lines: ["Flying fish glide through the air!", "Flying fish glide to get away!", "A flying fish's fins are like wings."]
  },
  manofwar: {
    name: "Portuguese man o' war", plural: "Portuguese men o' war", hello: "This is a Portuguese man o' war!",
    facts: ["It looks like a jellyfish, but it's not! It's a team of tiny animals stuck together, and each one has its own job.",
      "Its bubble floats on top of the sea, and the wind pushes it along like a sail."],
    eats: "Little fish and baby fish, caught with its stinging tentacles",
    eatenBy: "Sea turtles and some sea slugs",
    say: "A team of tiny animals living together is called a colony. Its long tentacles sting, so look, but don't touch!",
    lines: ["A man o' war is a team of tiny animals!", "The wind pushes a man o' war like a sailboat.",
      "Look, but don't touch! A man o' war stings."]
  },
  mantisshrimp: {
    name: "Mantis shrimp", plural: "mantis shrimp", hello: "This is a mantis shrimp!",
    facts: ["A mantis shrimp punches faster than you can blink! Its punch can crack a crab's shell.",
      "Its eyes can see colors that people can't see at all."],
    eats: "Crabs, snails and clams. It smashes their shells open",
    eatenBy: "Octopuses, big fish and sharks",
    say: "Mantis shrimp have one of the fastest punches of any animal. Smash! They crack open crabs and snails to eat what's inside.",
    lines: ["Mantis shrimp punch super fast!", "Mantis shrimp see colors we can't!", "Mantis shrimp smash shells."]
  },
  seacucumber: {
    name: "Sea cucumber", plural: "sea cucumbers", hello: "This is a sea cucumber!",
    facts: ["A sea cucumber is an animal, not a vegetable! It's a cousin of sea stars and sea urchins.",
      "It breathes through its bottom!"],
    eats: "Tiny bits of food in the sand. It cleans the sea floor as it goes",
    eatenBy: "Sea stars, crabs, fish and sea turtles",
    say: "When some sea cucumbers get scared, they squirt their insides out to scare the hungry animal away. Then they grow new ones!",
    lines: ["Sea cucumbers breathe through their bottoms!", "Sea cucumbers are cousins of sea stars.",
      "Sea cucumbers clean the sea floor."]
  },
  moray: {
    name: "Moray eel", plural: "moray eels", hello: "This is a moray eel!",
    facts: ["A moray eel looks like a snake, but it's a fish! It hides in holes in the reef.",
      "It has a second set of jaws hidden in its throat, to pull its food down."],
    eats: "Fish, octopuses, crabs and shrimp",
    eatenBy: "Groupers, barracudas and sharks",
    say: "Moray eels open and close their mouths all the time. They aren't being grumpy. They're breathing!",
    lines: ["Moray eels are fish, not snakes!", "Moray eels have two sets of jaws!", "Moray eels breathe with their mouths open."]
  },
  horseshoecrab: {
    name: "Horseshoe crab", plural: "horseshoe crabs", hello: "This is a horseshoe crab!",
    facts: ["A horseshoe crab isn't really a crab! It's more like a cousin of spiders and scorpions.",
      "Horseshoe crabs were crawling on the sea floor before there were any dinosaurs!"],
    eats: "Worms, clams and little animals in the sand",
    eatenBy: "Sea turtles and sharks. Shorebirds eat their eggs",
    say: "Horseshoe crabs have blue blood! Doctors use it to check that medicines are safe.",
    lines: ["Horseshoe crabs have blue blood!", "Horseshoe crabs are older than the dinosaurs!",
      "Horseshoe crabs are cousins of spiders."]
  }
};

export const FOOD_CHAIN = ["plankton", "sardine", "mackerel", "squid", "tuna", "shark", "orca"];
export const SEA_FRIEND_KINDS = ["turtle", "dolphin", "jellyfish", "pufferfish", "manta", "bluewhale", "parrotfish",
  "seahorse", "octopus", "starfish", "crab", "lobster", "urchin", "clownfish",
  "hammerhead", "whaleshark", "narwhal", "anglerfish", "otter", "penguin", "flyingfish", "manofwar",
  "mantisshrimp", "seacucumber", "moray", "horseshoecrab"];
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
