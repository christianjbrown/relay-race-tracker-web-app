import { describe, expect, it, vi } from 'vitest';
import { RunnerSpot } from '../../src/ui/runner-spot.js';

describe('RunnerSpot', () => {
  it('has no position until the runner is placed', () => {
    expect(new RunnerSpot().pos).toBeNull();
  });

  it('keeps the position and tells every watcher', () => {
    const spot = new RunnerSpot();
    const a = vi.fn();
    const b = vi.fn();
    spot.watch(a);
    spot.watch(b);

    spot.moveTo({ lat: 1, lng: 2 });

    expect(spot.pos).toEqual({ lat: 1, lng: 2 });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
