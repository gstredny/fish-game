# Little Fish, Big Ocean

A bright, simple fish-eats-fish ocean game for young children. Swim toward food, avoid larger fish, and grow up a real ocean food chain. Each animal really eats the ones below it. Fish of your own kind swim beside you as a friendly school.

## Places to swim

The start screen asks **Where will you swim?** Each place has its own water, its own food chain and its own animals, so a child keeps meeting new ones. The device remembers the pick, and a place still holding animals this device has never met shows how many are new. The places are in `src/zones.js`:

- **Coral reef**: sunny and warm. Plankton → damselfish → lionfish → grouper → reef shark → tiger shark, with orcas passing by now and then. Clownfish, a moray, a mantis shrimp, coral (an animal!) and a giant clam live on the reef; a whale shark is the rare giant.
- **Open ocean**: deep blue. Plankton → sardine → mackerel → squid → tuna → great white shark → orca. Dolphins, a hammerhead, a narwhal and more swim by; the blue whale is the rare giant.
- **The deep**: the twilight zone, nearly dark, with no floor in sight. Marine snow → deep-sea shrimp → lanternfish → viperfish → giant squid → sperm whale, and nothing hunts a grown sperm whale. The water is black except around you (many deep animals make light, and so do you), and the animals that glow (`glow: true` on their card) show as little lights in the dark, so a child swims over to find out what they are. An anglerfish, a hatchetfish, a vampire squid, a comb jelly and a barreleye live here; the oarfish is the rare giant. No free photo of a live vampire squid exists, so its card shows Carl Chun's 1911 scientific drawing instead (the card says so).

- **The bottom**: the abyssal sea floor, pitch black, icy cold and muddy, with a hot vent. Marine snow → amphipod → snailfish → rattail → deep-sea lizardfish → sleeper shark, and nothing here hunts a grown sleeper shark. You see only by your own light; the vent's heat shimmer shows from afar. A fangtooth swims by; sea pigs, a tripod fish, a giant isopod and tube worms live on the mud; the dumbo octopus is the one to find.

More places are on the way (see `tasks/013-ocean-zones.md`): a kelp forest and an icy sea.

## Levels, save spots and the end

The places are levels, in order, like an old Super Nintendo game: 1 Coral reef, 2 Open ocean, 3 The deep,
4 The bottom. A new swimmer has only the reef open; the others show a lock, and tapping one makes the voice
say to finish the one before it. Finishing a mission in a place finishes that level: the win screen says
**Level complete!**, names the next place, and **Next** swims there. Finishing the last level shows the end,
**You did it!**, and the voice says you swam the whole ocean. Every place stays open after that, and a
finished level can be swum again for a new mission. The order is the order of `src/zones.js`; the rules
are in `src/levels.js`.

**Who's swimming?** on the start screen has three save spots. Each keeps its own name, Ocean book, reef,
levels finished, Little/Big swimmer and place to swim on the same phone, and shows the level it is on
("Level 2 of 4", or "Finished! ★"). Picking a spot nobody has swum asks for a name; **Change name** renames
the spot, and **Erase** empties it after a second tap on the page (no browser pop-up). A spot without a
name is called Player 1, 2 or 3. A save from before spots and levels is the first spot's: it keeps its
Ocean book and reef, and starts on level 1. The sound switch stays one per phone.

## Missions

Once you reach the biggest form (the great white shark in the open ocean, the tiger shark on the reef), the game pauses on a mission card, and the voice says it. Each swim gets a different mission from the last:

- eat some of the place's tier-4 animal (tuna, reef sharks), or some of its tier-3 animal (squid, groupers);
- meet some sea friends;
- find the place's giant (an arrow at the screen edge points to it);
- swim away from the top hunter for a while, in places that have one. Orcas are the only animals that hunt great whites, and a bump starts the count over.

Finishing the mission ends the swim with **Mission complete!** and earns a coral colony. The top hunter also turns up now and then once you are big.

The start screen has two ways to play, and each spot remembers its choice:

- **Little swimmer** is the gentle game.
- **Big swimmer** takes more snacks to grow, sends more hunters, and they turn and chase you (always a bit slower than you, so you can get away). You also get less safe time after a bump, and the missions ask for more.

**Home** on the pause, win and game-over screens goes back to the start screen, to pick another place, level or fish.

## Learning as you swim

The first time a child meets an animal, the game pauses and a card shows a real photo of it. First the voice asks "What animal is this?" and the card waits, with no timer, while the child thinks. **Tell me!** then names the animal and the voice reads out a fact, what the animal eats, and who eats it. After that, a name tag floats above the animal and the voice says one short line, one animal at a time with a few seconds between, so a busy ocean does not rattle off names. Growing up and getting bumped are told as food-chain lines too, such as "You're a tuna now! Tuna eat squid. Watch out for sharks!" and "Watch out! Mackerel eat sardines!" The first line of a swim starts with a welcome to the place.

Gentle sea friends come by as well. In open water: a sea turtle, a dolphin, a jellyfish, a pufferfish (swim close and it puffs up), a manta ray, a parrotfish and, once in a while, a huge blue whale. On the sea bed: a seahorse, an octopus, a sea star, a crab, a lobster, a sea urchin and clownfish in their anemone (swim low to meet them). They never eat you and are never eaten.

Twelve harder animals teach bigger ideas:

- In open water:
  - a hammerhead shark, which feels the electricity animals make;
  - a whale shark, the biggest fish, and a filter feeder;
  - a narwhal, whose tusk is a tooth;
  - an anglerfish, with a glowing lure (bioluminescence);
  - a sea otter, which uses a rock as a tool and helps kelp forests grow;
  - a penguin, a bird that flies underwater;
  - a flying fish, which glides to get away;
  - a Portuguese man o' war, a colony of tiny animals and not a jellyfish.
- On the sea bed:
  - a mantis shrimp, with a super-fast punch;
  - a sea cucumber, a cousin of sea stars that breathes through its bottom;
  - a moray eel, a fish with a second set of jaws;
  - a horseshoe crab, which is older than the dinosaurs and has blue blood.

Sea friends this device has never met come first, so a child who has met everyone else soon meets the new ones.

The **Ocean book** (on the start and pause screens) keeps every card this player has met, grouped by place. An animal that lives in two places shows in both. **Find out more** on a card opens a Google search for "<animal> facts for kids", with SafeSearch on. It shows only when the device is online. The speaker button at the top turns the voice off; the device remembers. The facts are in `src/species.js`; photo credits are in [CREDITS.md](CREDITS.md).

## The voice

Every line the game says is recorded ahead of time in `voice/`, in a warm, natural voice. The voice is Kokoro-82M, an open, Apache-2.0 text-to-speech model. It sounds the same on every phone and works offline. On iPhone, sound wakes up with the first tap. A line with no recording falls back to the device's own voice, choosing its friendliest English voice.

After changing any spoken words (facts, lines, missions), record them again. `npm test` fails until you do:

```sh
python3.12 -m venv .venv && .venv/bin/pip install -r tools/voice-requirements.txt   # once; Python 3.10 to 3.12
node tools/voice-lines.mjs > /tmp/lines.json
.venv/bin/python tools/make-voice.py /tmp/lines.json voice --prune
```

The first run downloads the model (about 330 MB). Clips that already exist are reused, so only new or changed lines are recorded (about 1.5 s each). On a network that inspects HTTPS with its own certificate (a work Mac), Python will not trust the download until it sees that certificate: build a bundle from the Mac's keychain and point Python at it for the run:

```sh
cat .venv/lib/python3.12/site-packages/certifi/cacert.pem > /tmp/ca-bundle.pem
security find-certificate -a -p /Library/Keychains/System.keychain >> /tmp/ca-bundle.pem
SSL_CERT_FILE=/tmp/ca-bundle.pem .venv/bin/python tools/make-voice.py /tmp/lines.json voice --prune
``` The voice is `af_heart` at speed 0.9; `--voice` and `--speed` change them. Bump the cache name in `sw.js` afterwards.

If the voice says a word wrong, add it to `SAY_AS` at the top of `tools/make-voice.py`, spelled in Kokoro's own phonemes (misaki's US set). The next run records every line with that word again. Fixed so far: rattail, narwhal, amphipod, axes, man o' war.

Every finished mission earns one coral colony. Choose **Plant your coral**, then tap or click open water (or press Enter to plant ahead). The coral and any unplanted rewards are saved on this device across new swims and reloads. Three clownfish live around each colony and retreat when predators approach. Sardines and mackerel can shelter inside the marked circle; larger forms cannot. Each new swim starts beside your reef. If browser storage is unavailable, the reef lasts for the current visit and the game says so.

The idea was inspired by memories of school computer games. [*Odell Down Under*](https://www.computinghistory.org.uk/det/62803/Odell-Down-Under/) is a likely match: it lets players take different roles in an ocean food chain, including a shark. [*Fishy*](https://www.jayisgames.com/review/fishy.php) and [*Feeding Frenzy*](https://www.ea.com/games/feeding-frenzy/feeding-frenzy) have a similar eat-and-grow loop. This game uses original code and drawn graphics.

## Play on a Mac

From this folder, run:

```sh
python3 -m http.server 8778
```

Open [http://localhost:8778](http://localhost:8778). Move the mouse to swim, or use the arrow or WASD keys. Press `P` or `Esc` to pause. No packages or build step are needed.

All swimmers use the built-in animal artwork. As you grow, your fish changes to the species named by the game.

## Sound

Snacks go "nom", growing chimes, a bump goes "bonk", becoming the shark and finishing its mission play a fanfare, and game over plays a gentle tune. The sounds are made by the game itself, so they work offline. They start after the first tap. The speaker button turns them off along with the voice; on iPhone the silent switch and volume buttons control them too.

## Play on a phone

Play it at <https://gstredny.github.io/fish-game/>. On a phone the game plays sideways; upright, it asks you to turn the phone. Hold an arrow on the round pad in the bottom-left corner to swim; the fish stays in plain view because your thumb is on the pad, not on the fish.

For full screen and an app icon, add it to the home screen once. On iPhone, tap **Share** (in Safari 26, it is under **•••**), then **Add to Home Screen**. The start screen points an arrow at Share and shows these steps as pictures. On Android, choose **Add to home screen** on the start screen or **Install app** in Chrome's menu. Opened from the icon, it runs full screen and works offline.

## Ocean art

The realistic ocean behind the fish is a 360° underwater panorama rendered in Blender, one per place (`art/ocean.webp`
for the open ocean, `art/ocean-reef.webp` for the reef), so it wraps seamlessly as the fish swims. Each place's water,
light and colours are in `ZONES` at the top of `tools/render-ocean.py`. To change one, edit it, re-render (about 25 s on
Apple GPUs) and bump the cache name in `sw.js`:

```sh
blender -b -P tools/render-ocean.py -- art/ocean.webp open
blender -b -P tools/render-ocean.py -- art/ocean-reef.webp reef
blender -b -P tools/render-ocean.py -- art/ocean-deep.webp deep
blender -b -P tools/render-ocean.py -- art/ocean-bottom.webp bottom
```

## Check the rules

```sh
npm test
```

## Check it in a browser

With the local server running, start a headless Chrome and let the scripts play the game. Screenshots land in `screenshots/`.

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9444 --user-data-dir=/tmp/fish-chrome about:blank &
node tools/browser-play.mjs desktop   # real keyboard input, box-pattern swim
node tools/browser-play.mjs phone     # 844×390 sideways touch input
node tools/browser-sideways.mjs       # sideways phone: arrow pad steers, finger on water doesn't, snacks, turn prompt, panels fit
node tools/browser-autoplay.mjs       # seek-food controller plays to the shark and an eat-tuna mission (LEVEL=big for Big swimmer)
node tools/browser-reef.mjs           # earn, plant, reload, shelter; desktop + phone
node tools/browser-learn.mjs          # fact cards, voice, Ocean book, mission card, sea-bed friends, fits; "zoo" screenshots
node tools/browser-zones.mjs          # picking a place, the reef swim and mission, Home, the book by place, built-in species, fits
node tools/browser-levels.mjs         # locked places, a typed name, Level complete and Next, the end screen, Erase asks first, fits
```

`tools/browser-sound.mjs` checks that sound stays off until a tap and that each main moment plays its sound. `tools/browser-update.mjs` checks that an update shows on the first open. `tools/browser-check.mjs` checks that old saved drawings never replace species artwork, that growing changes the swimming animal, and that the start screen fits on a computer and sideways phones. Run `node tools/browser-check.mjs screenshots` with Playwright installed (or set `PLAYWRIGHT_MODULE` to an installed copy). Its browser is muted.
