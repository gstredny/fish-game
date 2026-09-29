// Decides which pointer steers the fish: the first finger down keeps control until it lifts,
// so a second finger or a palm cannot stop the swim. A mouse steers on hover.
export function createSteering(input) {
  let owner = null;
  const aim = event => { input.pointer = { x: event.clientX, y: event.clientY }; };
  return {
    down(event) {
      if (owner !== null && owner !== event.pointerId) return false;
      owner = event.pointerId;
      aim(event);
      return true;
    },
    move(event) {
      if (event.pointerType === "mouse" || event.pointerId === owner) aim(event);
    },
    up(event) {
      if (event.pointerId !== owner) return;
      owner = null;
      if (event.pointerType !== "mouse") input.pointer = null;
    },
    leave(event) {
      if (event.pointerType === "mouse") this.clear();
    },
    clear() {
      owner = null;
      input.pointer = null;
    }
  };
}
