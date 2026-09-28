import { describe, expect, it } from 'vitest';
import { FireworksShow } from '../../src/ui/fireworks-show.js';

const make = () => {
  const show = new FireworksShow(['#a', '#b'], () => 0.5);
  show.resize(400, 800);
  return show;
};
const play = (show, until, step = 16, from = 0) => {
  for (let t = from; t <= until; t += step) show.tick(t);
};

describe('FireworksShow', () => {
  it('launches a rocket from the bottom at once, then one every 450 ms', () => {
    const show = make();
    show.tick(0);
    expect(show.launched).toBe(1);
    expect(show.rockets[0].y).toBeCloseTo(800, 0);
    play(show, 1000, 16, 16);
    expect(show.launched).toBe(3);
  });

  it('bursts a rocket at the top of its climb into a ring of sparks in its colour', () => {
    const show = make();
    play(show, 1200);
    expect(show.sparks.length).toBeGreaterThanOrEqual(70);
    expect(new Set(show.sparks.map((s) => s.colour))).toEqual(new Set(['#b']));
    // It climbed about 440 px (to 45% down a 800 px screen) in about 1.1 s.
    expect(show.sparks[0].py).toBeLessThan(400);
  });

  it('lets sparks burn out', () => {
    const show = make();
    play(show, 1200);
    const first = show.sparks[0];
    play(show, 3200, 16, 1216);
    expect(show.sparks).not.toContain(first);
  });

  it('takes a long gap between frames as a short step', () => {
    const show = make();
    show.tick(0);
    const y = show.rockets[0].y;
    show.tick(10000);
    // 50 ms of climbing at about 1 px/ms, not ten seconds of it.
    expect(y - show.rockets[0].y).toBeLessThan(60);
  });

  it('starts again from nothing', () => {
    const show = make();
    play(show, 1200);
    show.reset();
    expect([show.rockets, show.sparks, show.launched, show.started]).toEqual([[], [], 0, null]);
  });
});
