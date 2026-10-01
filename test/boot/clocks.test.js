// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { buildClocks } from '../../src/boot/clocks.js';
import { config, makeWin } from '../fakes/page.js';

describe('buildClocks', () => {
  it('gives a page clock that follows ?at= and a real clock that does not', () => {
    const win = makeWin({ search: '?at=2027-05-15T14:00' });
    const { clock, realClock } = buildClocks(win, { timezone: config.timezone });
    expect(clock.now().toISOString().slice(0, 10)).toBe('2027-05-15');
    expect(Math.abs(realClock.now().getTime() - Date.now())).toBeLessThan(1000);
  });

  it('reads the real time through the window it was given', () => {
    const win = { ...makeWin(), Date: class extends Date { static now() { return 0; } } };
    const { realClock } = buildClocks(win, { timezone: config.timezone });
    expect(realClock.now().getTime()).toBe(0);
  });
});
