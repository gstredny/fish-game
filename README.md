# Little Fish, Big Ocean

A bright, simple fish-eats-fish ocean game for young children. Swim toward food, avoid larger fish, and grow from a tiny sprat into a great white shark. Once you become a shark, you can keep exploring the reef.

The idea was inspired by memories of school computer games. [*Odell Down Under*](https://www.computinghistory.org.uk/det/62803/Odell-Down-Under/) is a likely match: it lets players take different roles in an ocean food chain, including a shark. [*Fishy*](https://www.jayisgames.com/review/fishy.php) and [*Feeding Frenzy*](https://www.ea.com/games/feeding-frenzy/feeding-frenzy) have a similar eat-and-grow loop. This game uses original code and drawn graphics.

## Play on a Mac

From this folder, run:

```sh
python3 -m http.server 8778
```

Open [http://localhost:8778](http://localhost:8778). Move the mouse to swim, or use the arrow or WASD keys. Press `P` or `Esc` to pause. No packages or build step are needed.

## Play on a phone

The game supports touch and portrait screens. Touch and hold in the direction you want to swim. To add it to a phone's home screen and play offline, host this folder on an HTTPS website, visit it once, then choose **Add to Home Screen** in Safari or **Install app** in Chrome. The local Mac server is useful for testing, but a phone install needs an HTTPS address.

## Check the rules

```sh
npm test
```

## Check it in a browser

With the local server running, start a headless Chrome and let the scripts play the game. Screenshots land in `screenshots/`.

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9444 --user-data-dir=/tmp/fish-chrome about:blank &
node tools/browser-play.mjs desktop   # real keyboard input, box-pattern swim
node tools/browser-play.mjs phone     # 390×844 touch input
node tools/browser-autoplay.mjs       # seek-food controller plays to the shark
```
