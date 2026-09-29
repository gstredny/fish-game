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

## Draw your own fish

Choose **Draw my fish** to colour a fish-shaped page with eight crayons. Paint outside the lines is trimmed away, so any scribble becomes a tidy fish. That drawing is the fish you play: it grows through every stage and gets a shark fin at the end. Earlier drawings swim around the ocean as other fish, so a family's drawings fill the reef over time. Up to 30 drawings are kept in the browser on this device; nothing is uploaded.

## Sound

Snacks go "nom", growing chimes, a bump goes "bonk", becoming the shark plays a fanfare, and game over plays a gentle tune. The sounds are made by the game itself, so they work offline. They start after the first tap. On iPhone the silent switch and volume buttons control them.

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
```

`tools/browser-sound.mjs` checks that sound stays off until a tap and that each main moment plays its sound. `tools/browser-update.mjs` checks that an update shows on the first open. `tools/browser-check.mjs` checks drawing: it draws a fish, checks the saved drawing stays inside the fish shape, swims to shark form on a computer and a sideways phone, and checks the drawing screens fit. It uses [Playwright](https://playwright.dev) instead of the Chrome above: `npm i --no-save playwright && npx playwright install chromium`, then `node tools/browser-check.mjs screenshots` (or point `PLAYWRIGHT_MODULE` at an installed copy).
