// The answers on a "What animal is this?" card: the right animal and two others from the same place,
// picked and shuffled fresh every time, so the buttons never sit still long enough to memorize.
export function pickChoices(kind, pool, random = Math.random) {
  const others = shuffle(pool.filter(other => other !== kind), random).slice(0, 2);
  return shuffle([kind, ...others], random);
}

function shuffle(list, random) {
  const mixed = [...list];
  for (let index = mixed.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [mixed[index], mixed[swap]] = [mixed[swap], mixed[index]];
  }
  return mixed;
}
