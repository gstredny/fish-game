# Little Fish, Big Ocean

A bright, simple fish-eats-fish ocean game for young children. Swim toward food, avoid larger fish, and grow up a real ocean food chain: plankton → sardine → mackerel → squid → tuna → great white shark. Each animal really eats the ones below it. Fish of your own kind swim beside you as a friendly school. Once you become a shark, you can keep exploring the reef.

## Learning as you swim

The first time a child meets an animal, the game pauses and a card shows a real photo of it. A voice reads out a fact, what the animal eats, and who eats it. After that, a name tag floats above the animal and the voice says one short line. Growing up and getting bumped are told as food-chain lines too, such as "You're a tuna now! Tuna eat squid. Watch out for sharks!" and "Watch out! Mackerel eat sardines!"

Gentle sea friends drift by as well: a sea turtle and a parrotfish in open water; a seahorse, an octopus, a sea star, a crab and clownfish in their anemone on the sea bed (swim low to meet them). They never eat you and are never eaten.

The **Ocean book** (on the start and pause screens) keeps every card met on this device, so a second child can hear them all again. The speaker button at the top turns the voice off; the device remembers. The voice is the phone's or computer's own and works offline. On iPhone, sound is allowed once **Dive in** is tapped. The facts are in `src/species.js`; photo credits are in [CREDITS.md](CREDITS.md).

Every shark milestone earns one coral colony. Choose **Plant your coral**, then tap or click open water (or press Enter to plant ahead). The coral and any unplanted rewards are saved on this device across new swims and reloads. Three clownfish live around each colony and retreat when predators approach. Sardines and mackerel can shelter inside the marked circle; larger forms cannot. Each new swim starts beside your reef. If browser storage is unavailable, the reef lasts for the current visit and the game says so.

The idea was inspired by memories of school computer games. [*Odell Down Under*](https://www.computinghistory.org.uk/det/62803/Odell-Down-Under/) is a likely match: it lets players take different roles in an ocean food chain, including a shark. [*Fishy*](https://www.jayisgames.com/review/fishy.php) and [*Feeding Frenzy*](https://www.ea.com/games/feeding-frenzy/feeding-frenzy) have a similar eat-and-grow loop. This game uses original code and drawn graphics.

## Play on a Mac

From this folder, run:

```sh
python3 -m http.server 8778
```

Open [http://localhost:8778](http://localhost:8778). Move the mouse to swim, or use the arrow or WASD keys. Press `P` or `Esc` to pause. No packages or build step are needed.

## Play on a phone

Play it at <https://gstredny.github.io/fish-game/>. On a phone the game plays sideways; upright, it asks you to turn the phone. Hold an arrow on the round pad in the bottom-left corner to swim; the fish stays in plain view because your thumb is on the pad, not on the fish.

For full screen and an app icon, add it to the home screen once. On iPhone, tap **Share**, then **Add to Home Screen** (the start screen says so too). On Android, choose **Add to home screen** on the start screen or **Install app** in Chrome's menu. Opened from the icon, it runs full screen and works offline.

## Ocean art

The realistic ocean behind the fish is `art/ocean.webp`, a 360° underwater panorama rendered in Blender, so it wraps
seamlessly as the fish swims. To change it, edit `tools/render-ocean.py`, then re-render (about 25 s on Apple GPUs)
and bump the cache name in `sw.js`:

```sh
blender -b -P tools/render-ocean.py -- art/ocean.webp
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
node tools/browser-autoplay.mjs       # seek-food controller plays to the shark
node tools/browser-reef.mjs           # earn, plant, reload, shelter; desktop + phone
node tools/browser-learn.mjs          # fact cards, voice, Ocean book, sea-bed friends, fits; "zoo" screenshots
```
