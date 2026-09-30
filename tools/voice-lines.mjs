// Prints every line the game can say, as JSON, for tools/make-voice.py.
import { allLines } from "../src/lines.js";

console.log(JSON.stringify(allLines(), null, 1));
