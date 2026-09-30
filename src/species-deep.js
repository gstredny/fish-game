// Animals of the deep: the twilight zone, where sunlight fades and animals make their own light.
// Same shape and tone as species.js. `glow: true` marks animals that make light of their own.
export const DEEP_SPECIES = {
  marinesnow: {
    name: "Marine snow", plural: "marine snow", hello: "This is marine snow!", glow: true,
    facts: ["Marine snow is not really snow! It is bits of dead plankton, animal poop and slime, drifting down from the sunny water.",
      "It is the main food in the deep. Some flakes even glow, because tiny glowing bacteria live on them."],
    eats: "Nothing. It is not alive",
    eatenBy: "Deep-sea shrimp, vampire squid, and lots of other animals of the deep",
    say: "Marine snow is bits of dead plankton, poop and slime, drifting down from the sunny water. It is the main food in the deep.",
    lines: ["Marine snow drifts down from above.", "Marine snow is food for the deep.", "Some marine snow glows!"]
  },
  deepshrimp: {
    name: "Deep-sea shrimp", plural: "deep-sea shrimp", hello: "This is a deep-sea shrimp!", glow: true,
    facts: ["Some deep-sea shrimp squirt out a cloud of glowing blue light when a hunter comes. Then they dart away in the dark!",
      "Many deep-sea shrimp are red. No red light reaches the deep, so a red shrimp looks black and is hard to see."],
    eats: "Marine snow, and other bits of food that drift down",
    eatenBy: "Lanternfish, viperfish, and lots of other fish and squid",
    say: "Deep-sea shrimp eat marine snow. Some squirt out a glowing cloud, then dart away from hunters like lanternfish.",
    lines: ["Deep-sea shrimp eat marine snow.", "Some deep-sea shrimp squirt glowing clouds!", "A red shrimp looks black in the deep."]
  },
  lanternfish: {
    name: "Lanternfish", plural: "lanternfish", hello: "This is a lanternfish!", glow: true,
    facts: ["Lanternfish are among the most common fish in the world. Rows of little lights on their sides and bellies shine like lanterns!",
      "Every night, lanternfish swim up toward the surface to eat. Before sunrise they swim back down. It is the biggest animal migration on Earth."],
    eats: "Tiny animals, like deep-sea shrimp",
    eatenBy: "Viperfish, giant squid, tuna and lots of other hunters",
    say: "Every night, lanternfish swim up to eat, then back down before it gets light. Viperfish and giant squid hunt them.",
    lines: ["Lanternfish have little lights!", "Lanternfish swim up every night.", "There are so many lanternfish!"]
  },
  viperfish: {
    name: "Viperfish", plural: "viperfish", hello: "This is a viperfish!", glow: true,
    facts: ["A viperfish has teeth so long that they don't fit inside its mouth! They stick out like needles.",
      "On its back fin, a viperfish has a long thread with a glowing light on the end. The light works like a fishing lure."],
    eats: "Fish, like lanternfish, and shrimp",
    eatenBy: "Giant squid, sperm whales and other big hunters",
    say: "A viperfish waves a glowing lure in the dark. When a little fish comes close, snap! The needle teeth close.",
    lines: ["Viperfish have very long teeth.", "A viperfish has a light on its back fin.", "Viperfish eat lanternfish."]
  },
  giantsquid: {
    name: "Giant squid", plural: "giant squid", hello: "This is a giant squid!",
    facts: ["Giant squid have some of the biggest eyes of any animal. Each one is as big as a dinner plate!",
      "Nobody took a picture of a live giant squid in the sea until 2004. They are very hard to find."],
    eats: "Fish, like viperfish, and other squid",
    eatenBy: "Mostly sperm whales",
    say: "The giant squid has eyes as big as dinner plates. They may help it spot a sperm whale, its main hunter, from far away.",
    lines: ["Giant squid have eyes as big as dinner plates.", "Nobody saw a live giant squid until 2004.", "Sperm whales hunt giant squid."]
  },
  spermwhale: {
    name: "Sperm whale", plural: "sperm whales", hello: "This is a sperm whale!",
    facts: ["The sperm whale is the biggest hunter with teeth. It dives more than a kilometre down, and holds its breath for over an hour.",
      "Sperm whales hunt giant squid in the dark. Some have round scars from the suckers of big squid."],
    eats: "Giant squid, and other squid and fish",
    eatenBy: "Nothing hunts a grown sperm whale. Orcas may go after the calves",
    say: "The sperm whale dives deep in the dark and holds its breath for over an hour to hunt giant squid. Nothing hunts a grown sperm whale.",
    lines: ["Sperm whales hold their breath for over an hour.", "Sperm whales hunt giant squid.", "Some sperm whales have squid sucker scars."]
  },
  hatchetfish: {
    name: "Hatchetfish", plural: "hatchetfish", hello: "This is a hatchetfish!", glow: true,
    facts: ["A hatchetfish is thin and deep, shaped like a little axe. Its silver sides work like mirrors.",
      "Little lights on its belly shine down. They match the dim light from above, so a hunter looking up can't see its shadow."],
    eats: "Tiny animals of the deep, like little shrimp",
    eatenBy: "Bigger fish and squid of the deep",
    say: "A hatchetfish has mirror sides and little lights on its belly. The lights hide its shadow from hunters looking up.",
    lines: ["Hatchetfish have mirror sides.", "Hatchetfish hide their shadow with light!", "Hatchetfish look like little axes."]
  },
  barreleye: {
    name: "Barreleye", plural: "barreleyes", hello: "This is a barreleye!",
    facts: ["A barreleye has a see-through head! You can look right into it, like a bubble.",
      "Its green eyes are tubes inside its head. They point up to watch for food, and they can turn to look forward."],
    eats: "Tiny drifting animals, like little shrimp and jellies",
    eatenBy: "Bigger hunters of the deep, we think. Barreleyes are hard to find",
    say: "The barreleye has a see-through head. Its eyes are tubes that look up through it, and they can swing forward to look at food.",
    lines: ["A barreleye has a see-through head!", "Barreleye eyes look up.", "Barreleye eyes can turn to look forward."]
  },
  vampiresquid: {
    name: "Vampire squid", plural: "vampire squid", hello: "This is a vampire squid!", glow: true,
    facts: ["The vampire squid does not drink blood! It catches bits of marine snow on a long, sticky thread.",
      "Instead of squirting ink, it squirts a cloud of glowing blobs from the tips of its arms, then slips away."],
    eats: "Marine snow, which it catches on a sticky thread",
    eatenBy: "Big fish and whales of the deep",
    say: "The vampire squid is not really a vampire. It catches marine snow on a sticky thread, and squirts glowing blobs when it is scared.",
    lines: ["Vampire squid don't drink blood.", "Vampire squid eat marine snow.", "Vampire squid squirt glowing blobs!"]
  },
  combjelly: {
    name: "Comb jelly", plural: "comb jellies", hello: "This is a comb jelly!", glow: true,
    facts: ["A comb jelly swims by beating rows of tiny hairs, like little combs. Light bounces off them and shimmers like a rainbow.",
      "Comb jellies are not jellyfish, and they don't sting. Many can also make their own blue light, and glow in the dark."],
    eats: "Tiny animals that drift in the sea",
    eatenBy: "Some fish, and other comb jellies",
    say: "A comb jelly swims with rows of tiny beating hairs that shimmer like a rainbow. Many can also glow blue in the dark.",
    lines: ["Comb jellies shimmer like rainbows.", "Comb jellies swim with tiny hairs.", "Many comb jellies glow blue."]
  },
  oarfish: {
    name: "Oarfish", plural: "oarfish", hello: "This is an oarfish!",
    facts: ["The oarfish is the longest bony fish in the world. It can be over 8 metres long!",
      "Sailors long ago told tales of sea serpents. Some of those tales may have been about oarfish."],
    eats: "Little shrimp-like krill, small fish and squid",
    eatenBy: "Nobody knows for sure. Oarfish are very hard to find",
    say: "The oarfish is the longest bony fish, over 8 metres long. Old sailors' stories of sea serpents may have been about oarfish.",
    lines: ["Oarfish are the longest bony fish!", "Oarfish have a red crest.", "Old sea serpent stories may be about oarfish."]
  }
};
