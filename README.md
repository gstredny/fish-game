# Little Fish, Big Ocean

A bright, simple fish-eats-fish ocean game for young children. Swim toward food, avoid larger fish, and grow from a tiny sprat into a great white shark. Once you become a shark, you can keep exploring the reef.

Every shark milestone earns one coral colony. Choose **Plant your coral**, then tap or click open water (or press Enter to plant ahead). The coral and any unplanted rewards are saved on this device across new swims and reloads. Three clownfish live around each colony and retreat when predators approach. Sprats and coral fish can shelter inside the marked circle; larger forms cannot. Each new swim starts beside your reef. If browser storage is unavailable, the reef lasts for the current visit and the game says so.

The idea was inspired by memories of school computer games. [*Odell Down Under*](https://www.computinghistory.org.uk/det/62803/Odell-Down-Under/) is a likely match: it lets players take different roles in an ocean food chain, including a shark. [*Fishy*](https://www.jayisgames.com/review/fishy.php) and [*Feeding Frenzy*](https://www.ea.com/games/feeding-frenzy/feeding-frenzy) have a similar eat-and-grow loop. This game uses original code and drawn graphics.

## Play on a Mac

From this folder, run:

```sh
python3 -m http.server 8778
```

Open [http://localhost:8778](http://localhost:8778). Move the mouse to swim, or use the arrow or WASD keys. Press `P` or `Esc` to pause. No packages or build step are needed.

## Play on a phone

On a phone the game plays sideways; upright, it asks you to turn the phone. Touch and hold where you want your fish to swim. To add it to a phone's home screen and play offline, host this folder on an HTTPS website, visit it once, then choose **Add to Home Screen** in Safari or **Install app** in Chrome. The local Mac server is useful for testing, but a phone install needs an HTTPS address.

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
node tools/browser-sideways.mjs       # sideways phone: fish follows the finger, snacks, turn prompt, panels fit
node tools/browser-autoplay.mjs       # seek-food controller plays to the shark
node tools/browser-reef.mjs           # earn, plant, reload, shelter; desktop + phone
```
