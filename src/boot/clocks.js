// The two clocks: the page's own (which a `?at=` preview can move) and the real one.
import { PageClock } from '../services/page-clock.js';

export function buildClocks(win, config) {
  const clock = PageClock.fromSearch(win.location.search, config.timezone, () => win.Date.now());
  const realClock = { now: () => new win.Date(win.Date.now()) };
  return { clock, realClock };
}
