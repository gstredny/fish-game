# Little Fish, Big Ocean

A bright, simple fish-eats-fish ocean game for young children. Swim toward food, avoid larger fish, and grow up a real ocean food chain. Each animal really eats the ones below it. Fish of your own kind swim beside you as a friendly school.

## Places to swim

The start screen asks **Where will you swim?** Each place has its own water, its own food chain and its own animals, so a child keeps meeting new ones. The device remembers the pick, and a place still holding animals this device has never met shows how many are new. The places are in `src/zones.js`:

- **Coral reef**: sunny and warm. Plankton → damselfish → lionfish → grouper → reef shark → tiger shark, with orcas passing by now and then. Clownfish, a moray, a mantis shrimp, coral (an animal!) and a giant clam live on the reef; a whale shark is the rare giant.
- **Open ocean**: deep blue. Plankton → sardine → mackerel → squid → tuna → great white shark → orca. Dolphins, a hammerhead, a narwhal and more swim by; the blue whale is the rare giant.

More places are on the way (see `tasks/013-ocean-zones.md`): a kelp forest, an icy sea, the deep and the very bottom, where it is dark and you see by your own glow.

## Missions and levels

Once you reach the biggest form (the great white shark in the open ocean, the tiger shark on the reef), the game pauses on a mission card, and the voice says it. Each swim gets a different mission from the last:

- eat some of the place's tier-4 animal (tuna, reef sharks), or some of its tier-3 animal (squid, groupers);
- meet some sea friends;
- find the place's giant (an arrow at the screen edge points to it);
- swim away from the top hunter for a while, in places that have one. Orcas are the only animals that hunt great whites, and a bump starts the count over.

Finishing the mission ends the swim with **Mission complete!** and earns a coral colony. The top hunter also turns up now and then once you are big.

The start screen has two levels, and the device remembers the choice:

- **Little swimmer** is the gentle game.
- **Big swimmer** takes more snacks to grow, sends more hunters, and they turn and chase you (always a bit slower than you, so you can get away). You also get less safe time after a bump, and the missions ask for more.

## Learning as you swim

The first time a child meets an animal, the game pauses and a card shows a real photo of it. A voice reads out a fact, what the animal eats, and who eats it. After that, a name tag floats above the animal and the voice says one short line. Growing up and getting bumped are told as food-chain lines too, such as "You're a tuna now! Tuna eat squid. Watch out for sharks!" and "Watch out! Mackerel eat sardines!" The first line of a swim starts with a welcome to the place.

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

The **Ocean book** (on the start and pause screens) keeps every card met on this device, grouped by place, so a second child can hear them all again. An animal that lives in two places shows in both. **Find out more** on a card opens a Google search for "<animal> facts for kids", with SafeSearch on. It shows only when the device is online. The speaker button at the top turns the voice off; the device remembers. The facts are in `src/species.js`; photo credits are in [CREDITS.md](CREDITS.md).

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

Every finished mission earns one coral colony. Choose **Plant your coral**, then tap or click open water (or press Enter to plant ahead). The coral and any unplanted rewards are saved on this device across new swims and reloads. Three clownfish live around each colony and retreat when predators approach. Sardines and mackerel can shelter inside the marked circle; larger forms cannot. Each new swim starts beside your reef. If browser storage is unavailable, the reef lasts for the current visit and the game says so.

The idea was inspired by memories of school computer games. [*Odell Down Under*](https://www.computinghistory.org.uk/det/62803/Odell-Down-Under/) is a likely match: it lets players take different roles in an ocean food chain, including a shark. [*Fishy*](https://www.jayisgames.com/review/fishy.php) and [*Feeding Frenzy*](https://www.ea.com/games/feeding-frenzy/feeding-frenzy) have a similar eat-and-grow loop. This game uses original code and drawn graphics.

## Play on a Mac

From this folder, run:

```sh
python3 -m http.server 8778
```

Open [http://localhost:8778](http://localhost:8778). Move the mouse to swim, or use the arrow or WASD keys. Press `P` or `Esc` to pause. No packages or build step are needed.

## Draw your own fish

Choose **Draw my fish** to colour a fish-shaped page with eight crayons. Paint outside the lines is trimmed away, so any scribble becomes a tidy fish. That drawing is the fish you play: it grows through every stage and gets a shark fin at the end. Earlier drawings swim around the ocean as other fish, so a family's drawings fill the reef over time. Up to 30 drawings are kept in the browser on this device; nothing is uploaded.

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
node tools/browser-zones.mjs          # picking a place, the reef swim and mission, Home, the book by place, swim as a real fish, fits
```

`tools/browser-sound.mjs` checks that sound stays off until a tap and that each main moment plays its sound. `tools/browser-update.mjs` checks that an update shows on the first open. `tools/browser-check.mjs` checks drawing: it draws a fish, checks the saved drawing stays inside the fish shape, swims to shark form on a computer and a sideways phone, and checks the drawing screens fit. It uses [Playwright](https://playwright.dev) instead of the Chrome above: `npm i --no-save playwright && npx playwright install chromium`, then `node tools/browser-check.mjs screenshots` (or point `PLAYWRIGHT_MODULE` at an installed copy).
