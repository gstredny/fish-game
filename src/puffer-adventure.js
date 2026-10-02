import { paintPufferAdventure } from "./puffer-paint.js";
import { createPufferSwim, puffPuffer, resizePufferSwim, swimPuffer } from "./puffer-swim.js";
import { PUFFER_LINES } from "./puffer-lines.js";

// The short line at the top of the screen after each thing that happens in the swim.
const NOTES = {
  warning: "Grouper coming — get ready to Puff!",
  defended: "The grouper is leaving! Swim to shelter!",
  practise: "Puff near the grouper first, then reach shelter!",
  retry: "That was a close bump!",
  won: "Safe in the shelter!"
};

// The puffer scene owns its controls and narration; the ordinary swim is never passed in.
export function createPufferAdventure({ input, clearInput, backToBook, showControls, voice, sound }) {
  const ui = document.querySelector("#puffer-ui");
  const dialog = document.querySelector("#puffer-dialog");
  const puffButton = document.querySelector("#puffer-puff");
  const pauseButton = document.querySelector("#puffer-pause");
  const instruction = document.querySelector("#puffer-instruction");
  let active = false, state;
  for (const id of ["puffer-back", "puffer-dialog-back"]) document.querySelector(`#${id}`).addEventListener("click", backToBook);
  pauseButton.addEventListener("click", pause);
  puffButton.addEventListener("click", event => { if (!event.detail) puff(); });
  puffButton.addEventListener("pointerdown", event => { if (event.button === 0) puff(); });
  document.querySelector("#puffer-go").addEventListener("click", start);

  function renderControls() {
    const playing = state.phase === "playing";
    showControls(playing);
    puffButton.hidden = !playing;
    puffButton.setAttribute("aria-pressed", String(state.puffLeft > 0));
    pauseButton.hidden = !playing;
    dialog.hidden = playing;
    const content = {
      intro: ["Be a pufferfish", PUFFER_LINES.intro, "Let's swim!"],
      paused: ["Take a little break", "Your pufferfish is waiting here.", "Keep swimming"],
      retry: ["One more try?", PUFFER_LINES.retry, "Try again"],
      won: ["Safe in the shelter!", "Your puff sent the grouper away.", "Play again"]
    }[state.phase];
    if (!content) return;
    document.querySelector("#puffer-title").textContent = content[0];
    document.querySelector("#puffer-text").textContent = content[1];
    document.querySelector("#puffer-go").textContent = content[2];
  }

  function start() {
    if (!active || state.phase === "playing") return;
    if (state.phase === "retry" || state.phase === "won") state = createPufferSwim(state.width, state.height);
    state.phase = "playing";
    clearInput();
    instruction.textContent = state.defended ? "Swim to the rock shelter!" : "Swim to shelter. Puff when the grouper comes close!";
    renderControls();
  }

  function pause() {
    if (!active || state.phase !== "playing") return;
    state.phase = "paused";
    clearInput();
    voice.stop();
    renderControls();
  }

  function puff() {
    if (active && puffPuffer(state)) sound.play("grow");
  }

  return {
    get state() { return state; },
    get active() { return active; },
    enter(width, height) {
      active = true;
      state = createPufferSwim(width, height);
      clearInput();
      ui.hidden = false;
      instruction.textContent = "You're a pufferfish!";
      renderControls();
      voice.say(PUFFER_LINES.intro);
    },
    leave() {
      active = false;
      ui.hidden = dialog.hidden = puffButton.hidden = true;
      clearInput();
      voice.stop();
    },
    resize(width, height) {
      if (active) resizePufferSwim(state, width, height);
    },
    pause,
    keyDown(event) {
      if ((event.key === "Enter" || event.key === " ") && event.target?.closest?.("button, a")) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
      if (event.key === "Escape" || event.key.toLowerCase() === "p") {
        if (!event.repeat) state.phase === "paused" ? start() : pause();
        return;
      }
      if (event.key === " ") {
        if (!event.repeat) puff();
        return;
      }
      if (state.phase === "playing") input.keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    },
    frame(context, seconds, width, height) {
      swimPuffer(state, seconds, input);
      for (const event of state.events.splice(0)) {
        instruction.textContent = NOTES[event];
        voice.say(PUFFER_LINES[event]);
        if (event === "retry" || event === "won") {
          clearInput();
          if (event === "won") sound.play("won");
        }
      }
      renderControls();
      paintPufferAdventure(context, state, width, height);
    }
  };
}
