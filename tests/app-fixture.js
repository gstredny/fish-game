import { readFile } from "node:fs/promises";

const entry = new URL("../src/main.js", import.meta.url);
const source = (await readFile(entry, "utf8")).replace(/from "(\.\/[^"\n]+)"/g,
  (_, path) => `from ${JSON.stringify(new URL(path, entry).href)}`);
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
let fixtureId = 0;

// Every canvas draws into this no-op context.
const noopContext = new Proxy({}, { get: (target, key) => target[key] ?? (String(key).startsWith("create") ?
  () => ({ addColorStop() {} }) : () => {}), set: (target, key, value) => { target[key] = value; return true; } });

function element() {
  const listeners = new Map(), classes = new Set(), children = [];
  return {
    hidden: false, style: { setProperty() {} }, textContent: "", children,
    append: child => children.push(child), prepend: child => children.unshift(child),
    getContext: () => noopContext, getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    classList: { add: name => classes.add(name), remove: name => classes.delete(name),
      toggle: (name, on) => on ? classes.add(name) : classes.delete(name), contains: name => classes.has(name) },
    addEventListener: (event, callback) => listeners.set(event, callback),
    setAttribute() {}, setPointerCapture() {},
    emit: (type, event = {}) => listeners.get(type)?.({ preventDefault() {}, ...event })
  };
}

// Exercises the actual main module and its event bindings with a minimal DOM.
// Canvas calls execute against a no-op context; this is not visual/browser evidence.
// `extraGlobals` adds browser features the game can use, such as a fake speechSynthesis.
export async function openGame(storage, extraGlobals = {}) {
  const nodes = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], element()]));
  const window = Object.assign(element(), { innerWidth: 390, innerHeight: 844, devicePixelRatio: 1 });
  const frames = [];
  const globals = { window, document: Object.assign(element(), {
    querySelector: selector => nodes.get(selector.slice(1)), getElementById: id => nodes.get(id),
    createElement: () => element()
  }), localStorage: storage, navigator: {}, Image: class {}, requestAnimationFrame: callback => frames.push(callback),
  setTimeout: () => 0, clearTimeout() {}, ...extraGlobals };
  const originals = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const close = () => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  };
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  try {
    const hook = `\nexport { world, input };\n// fixture ${++fixtureId}`;
    const game = await import(`data:text/javascript;base64,${Buffer.from(source + hook).toString("base64")}`);
    return { ...game, nodes, window, close, frame: time => frames.shift()(time),
      click: id => nodes.get(id).emit("click"),
      // `target` is the focused element; a button's own click is sent separately, as browsers do.
      key: (key, target) => window.emit("keydown", { key, target }) };
  } catch (error) { close(); throw error; }
}

