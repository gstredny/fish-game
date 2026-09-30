// Animals of the bottom: the abyssal sea floor, pitch black, cold and muddy, with hot vents.
// Same shape and tone as species-deep.js. `glow: true` marks animals that shimmer or shine. Only the tube worm does here,
// and its glow is the heat of the vent water, not light the worm makes.
export const BOTTOM_SPECIES = {
  amphipod: {
    name: "Amphipod", plural: "amphipods", hello: "This is an amphipod!",
    facts: ["Amphipods look like little shrimp. They clean up the sea floor by eating dead animals that sink down.",
      "In deep trenches, some amphipods grow huge. The supergiant amphipod can be longer than a ruler!"],
    eats: "Marine snow, and dead animals that sink to the sea floor",
    eatenBy: "Snailfish, rattails, and lots of other animals of the sea floor",
    say: "Amphipods are little shrimp-like cleaners of the sea floor. They eat marine snow and dead animals, and snailfish and rattails eat them.",
    lines: ["Amphipods clean up the sea floor.", "The biggest amphipod is longer than a ruler!", "Snailfish and rattails eat amphipods."]
  },
  snailfish: {
    name: "Snailfish", plural: "snailfish", hello: "This is a snailfish!",
    facts: ["A snailfish has a soft, jelly-like body and no scales. Even so, it lives in the cold dark under a huge weight of water.",
      "A snailfish was filmed more than 8 kilometres down, off Japan. It is the deepest fish ever filmed."],
    eats: "Amphipods, and other little animals of the sea floor",
    eatenBy: "Rattails, deep-sea lizardfish, and other big fish, we think",
    say: "A snailfish is soft like jelly and has no scales. One was filmed more than 8 kilometres down, the deepest fish ever seen on film.",
    lines: ["Snailfish are soft like jelly.", "Snailfish have no scales.", "One snailfish was filmed 8 kilometres down!"]
  },
  rattail: {
    name: "Rattail", plural: "rattails", hello: "This is a rattail!",
    facts: ["A rattail has a big head and a long, thin tail that tapers to a point, like a rat's tail.",
      "Rattails are some of the most common fish on the deep sea floor. They find food by smell."],
    eats: "Snailfish, amphipods, and dead animals on the sea floor",
    eatenBy: "Deep-sea lizardfish, sleeper sharks, and other big hunters",
    say: "A rattail has a big head and a long, thin tail. It is one of the most common fish on the sea floor, and it finds food by smell.",
    lines: ["Rattails have a long, thin tail.", "Rattails find food by smell.", "There are lots of rattails down here."]
  },
  lizardfish: {
    name: "Deep-sea lizardfish", plural: "deep-sea lizardfish", hello: "This is a deep-sea lizardfish!",
    facts: ["A deep-sea lizardfish lies flat on the mud and waits. When a fish swims by, it darts out and snaps it up!",
      "Its mouth is full of sharp teeth. It even has teeth on its tongue!"],
    eats: "Fish, like rattails, and squid",
    eatenBy: "Sleeper sharks, and maybe other big fish",
    say: "A deep-sea lizardfish lies flat on the mud and waits, with a mouth full of teeth. When a rattail swims by, snap!",
    lines: ["Deep-sea lizardfish lie flat on the mud.", "A lizardfish waits, then snaps!", "A lizardfish has teeth on its tongue!"]
  },
  sleepershark: {
    name: "Sleeper shark", plural: "sleeper sharks", hello: "This is a sleeper shark!",
    facts: ["Sleeper sharks are big, and they swim very slowly in the cold, dark water.",
      "The Greenland shark is a sleeper shark. It may live 400 years, longer than any other animal with a backbone!"],
    eats: "Fish, like deep-sea lizardfish and rattails, and squid and octopus",
    eatenBy: "Nothing here hunts a grown sleeper shark. Only killer whales are known to catch one",
    say: "Sleeper sharks are big, slow hunters, and the Greenland shark may live 400 years. Nothing here hunts a grown sleeper shark.",
    lines: ["Sleeper sharks swim very slowly.", "A Greenland shark may live 400 years!", "Nothing here hunts a grown sleeper shark."]
  },
  fangtooth: {
    name: "Fangtooth", plural: "fangtooth", hello: "This is a fangtooth!",
    facts: ["A fangtooth is a small fish, but it has the biggest teeth for its size of any fish!",
      "Its lower fangs are so long that they slide into two pockets beside its brain when it shuts its mouth."],
    eats: "Fish, shrimp and squid of the deep",
    eatenBy: "Tuna, marlin, and other big fish",
    say: "A fangtooth is small, but it has the biggest teeth for its size of any fish. Its fangs are so long that its head has pockets to hold them.",
    lines: ["A fangtooth has huge teeth!", "Its fangs slide into pockets in its head.", "Fangtooth catch fish, shrimp and squid."]
  },
  seapig: {
    name: "Sea pig", plural: "sea pigs", hello: "This is a sea pig!",
    facts: ["A sea pig is a sea cucumber. It walks on the mud on little legs!",
      "It scoops up the mud and eats the bits of food in it. Sometimes sea pigs gather in big herds."],
    eats: "Mud, and the bits of marine snow and dead animals in it",
    eatenBy: "Nobody knows for sure. Sea pigs live far down, where it is hard to look",
    say: "A sea pig is a sea cucumber that walks on little legs. It eats the mud for the bits of food in it, and sometimes sea pigs gather in herds.",
    lines: ["A sea pig is a sea cucumber!", "Sea pigs walk on little legs.", "Sea pigs eat mud."]
  },
  tripodfish: {
    name: "Tripod fish", plural: "tripod fish", hello: "This is a tripod fish!",
    facts: ["A tripod fish stands on three long, stiff fins, like a tripod. They hold it up off the mud.",
      "It stands still, facing the current, and waits for food to drift by."],
    eats: "Tiny shrimp-like animals, like copepods, that drift by",
    eatenBy: "Bigger fish of the deep, we think",
    say: "The tripod fish stands on three long, stiff fins and faces the current. It waits for tiny animals to drift into its reach.",
    lines: ["A tripod fish stands on three fins!", "A tripod fish faces the current.", "Tripod fish wait for food to drift by."]
  },
  giantisopod: {
    name: "Giant isopod", plural: "giant isopods", hello: "This is a giant isopod!",
    facts: ["A giant isopod is a cousin of the pill bug. It can grow as long as a ruler, or longer!",
      "One giant isopod in an aquarium in Japan lived for five years without eating."],
    eats: "Dead animals that sink to the sea floor, like fish, squid and even whales",
    eatenBy: "Some sharks and big fish. Its hard shell helps keep it safe",
    say: "A giant isopod is a cousin of the pill bug, as long as a ruler or more. It cleans up dead animals on the sea floor, and it can go for years without food.",
    lines: ["Giant isopods are cousins of pill bugs.", "A giant isopod can be as long as a ruler!", "One giant isopod went five years without eating!"]
  },
  tubeworm: {
    name: "Tube worm", plural: "tube worms", hello: "This is a tube worm!", glow: true,
    facts: ["A grown tube worm has no mouth and no stomach! Tiny bacteria inside it make its food from the chemicals in the hot water. That is food without sunlight.",
      "Water pours out of a hot vent hotter than boiling. The shimmer around it is heat, not light, and the worm makes no light."],
    eats: "Nothing. Bacteria inside it make its food from the chemicals in the vent water",
    eatenBy: "Vent crabs, and some fish that live around the vent",
    say: "A tube worm has no mouth and no stomach. Bacteria inside it make its food from the chemicals in the hot vent water, so it needs no sunlight.",
    lines: ["Tube worms have no mouth!", "Bacteria make food for tube worms.", "Vent water is hotter than boiling!"]
  },
  dumbooctopus: {
    name: "Dumbo octopus", plural: "dumbo octopuses", hello: "This is a dumbo octopus!",
    facts: ["A dumbo octopus swims by flapping two fins that look like ears. Its name comes from Dumbo, the flying elephant in the film.",
      "It lives deeper than any other octopus. It swallows its food whole."],
    eats: "Little animals on the sea floor, like worms and amphipods",
    eatenBy: "Very few hunters. Some sharks may catch one",
    say: "A dumbo octopus flaps its ear-like fins to swim. It lives deeper than any other octopus, and it swallows its food whole.",
    lines: ["Dumbo octopuses flap ear-like fins!", "Dumbo octopuses live very deep.", "A dumbo octopus swallows food whole."]
  }
};
