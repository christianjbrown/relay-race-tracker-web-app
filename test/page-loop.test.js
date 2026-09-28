import { describe, expect, it, vi } from 'vitest';
import { PageLoop } from '../src/page-loop.js';

describe('PageLoop', () => {
  const make = () => {
    const trackers = { poll: vi.fn(async () => {}) };
    const screen = { render: vi.fn(), show: vi.fn() };
    const timers = { setInterval: vi.fn() };
    return { loop: new PageLoop(trackers, screen, timers, { pollMs: 5000 }), trackers, screen, timers };
  };

  it('polls on the tuning\'s interval and redraws every thirty seconds', async () => {
    const { loop, trackers, screen, timers } = make();
    loop.run();
    expect(timers.setInterval.mock.calls.map(([, ms]) => ms)).toEqual([5000, 30000]);
    await timers.setInterval.mock.calls[0][0]();
    expect(trackers.poll).toHaveBeenCalled();
    expect(screen.show).toHaveBeenCalled();
    timers.setInterval.mock.calls[1][0]();
    expect(screen.render).toHaveBeenCalled();
  });

  it('shows the page once the trackers have answered', async () => {
    const { loop, trackers, screen } = make();
    let answer;
    trackers.poll.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
    const polled = loop.poll();
    expect(screen.show).not.toHaveBeenCalled();
    answer();
    await polled;
    expect(screen.show).toHaveBeenCalled();
  });
});
