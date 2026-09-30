// "Watch a video" on a fact card: one short, kid-friendly video per animal, played inside the game
// in YouTube's privacy-enhanced player. Each was checked to be public and allowed in other sites;
// an animal without one keeps the kid-safe web search instead.
export const VIDEOS = {
  plankton: { id: "6-6Vb7HOebw", title: "Why Are Plankton So Crucial to Life on Earth?", channel: "BBC Earth Kids" },
  sardine: { id: "XRSS7z6IbL8", title: "Why do fish school?", channel: "Monterey Bay Aquarium" },
  mackerel: { id: "H3dUfqnoZmY", title: "This Video Is Wholly Mackerel!", channel: "Monterey Bay Aquarium" },
  squid: { id: "uiT79Lfxwps", title: "What Is Squid Ink?", channel: "SciShow Kids" },
  tuna: { id: "fIW8Vvfbojc", title: "Bluefin Tuna in the Open Sea exhibit", channel: "Monterey Bay Aquarium" },
  shark: { id: "64HZet6ei8k", title: "Meet the Animals: Great White Shark", channel: "Little Fox" },
  orca: { id: "4YOvkXNZ16I", title: "Amazing Orcas! Fascinating Killer Whale Facts for Kids", channel: "Ranger Rick" },
  turtle: { id: "I8LHR7KN1tY", title: "All About Sea Turtles", channel: "WWF Wild Classroom" },
  dolphin: { id: "45F2kH144zY", title: "All About Dolphins for Kids", channel: "Free School" },
  jellyfish: { id: "s-GgRlFIRkg", title: "Alien Jelly", channel: "Nat Geo Kids" },
  pufferfish: { id: "dg9YdYLf3Zs", title: "A Puffed Up … Porcupine", channel: "Nat Geo Kids" },
  manta: { id: "s0DQL-bHegQ", title: "Manta Ray Mania", channel: "Nat Geo Kids" },
  bluewhale: { id: "GSmBYqmz4Y4", title: "Blue Whales: The Biggest Animal EVER!", channel: "SciShow Kids" },
  parrotfish: { id: "o-blz2ghKOU", title: "Feeding Humphead Parrotfish", channel: "BBC Earth" },
  penguin: { id: "T8Wp2yWH_3E", title: "Meet 3 Peculiar Penguins", channel: "SciShow Kids" },
  otter: { id: "Keqh3W9tL8I", title: "Adorable Sea Otter Pups 🦦", channel: "Andy's Amazing Adventures" },
  seal: { id: "9VYdEFws5Es", title: "How Does A Seal Pup Learn to Swim?", channel: "Andy's Amazing Adventures" },
  narwhal: { id: "CJbmSsSxf_A", title: "Narwhals: Unicorns of the Sea!", channel: "SciShow Kids" },
  whaleshark: { id: "4krR7Hqbon4", title: "A Day In The Life Of A Whale Shark 🦈", channel: "Nat Geo Kids" },
  seahorse: { id: "OI9Nf4H6GSk", title: "SEAHORSE 🌊 🐴 Facts for Kids", channel: "Scholastic" },
  octopus: { id: "XyDNTfmFmJw", title: "The Outrageous Octopus!", channel: "SciShow Kids" },
  starfish: { id: "saIulKP-B_w", title: "Kids' Corner: Sea Stars", channel: "National Geographic-Lindblad Expeditions" },
  crab: { id: "xB74swq2LlI", title: "Christmas Crab 🦀", channel: "Nat Geo Kids" },
  hermitcrab: { id: "zpjklLt1qWk", title: "Hermit Crabs LINE UP To Swap Shells!", channel: "BBC Earth Kids" },
  lobster: { id: "VM3KKWreTls", title: "Why Are These Lobsters Doing The Conga?", channel: "Nature on PBS" },
  urchin: { id: "QXgLz5O0EZw", title: "Andy and the Sea Urchins", channel: "Andy's Amazing Adventures" },
  stingray: { id: "RSkMQKFOIz4", title: "Pelagic Stingrays in the Open Sea Exhibit", channel: "Monterey Bay Aquarium" },
  eel: { id: "wskmVwQb9VQ", title: "Mediterranean Moray Eel and Cleaner Shrimp", channel: "NatGeo MENA" },
  clownfish: { id: "hwtLABCaZbs", title: "Ocean Clown", channel: "Nat Geo Kids" }
};

export function videoEmbed(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3`;
}
