import { describe, expect, it, vi } from 'vitest';
import { MomentSwitch } from '../src/moment-switch.js';

const moment = (name) => ({ render: vi.fn(), where: vi.fn(() => `${name} spot`), lookAround: vi.fn(() => `${name} view`) });

describe('MomentSwitch', () => {
  const make = (time = null) => {
    const live = moment('live');
    const replay = moment('replay');
    const rewind = { time };
    return { screen: new MomentSwitch(live, replay, rewind), live, replay, rewind };
  };

  it('shows the live page while the rewind is on the present', () => {
    const { screen, live, replay } = make();
    screen.render();
    expect(live.render).toHaveBeenCalled();
    expect(replay.render).not.toHaveBeenCalled();
    expect(screen.where()).toBe('live spot');
    expect(screen.lookAround()).toBe('live view');
  });

  it('shows the replay while the rewind is on a moment in the past, and goes back when it returns', () => {
    const { screen, live, replay, rewind } = make(new Date('2027-05-15T10:00:00Z'));
    screen.render();
    expect(replay.render).toHaveBeenCalled();
    expect(live.render).not.toHaveBeenCalled();
    expect(screen.where()).toBe('replay spot');
    expect(screen.lookAround()).toBe('replay view');
    rewind.time = null;
    expect(screen.where()).toBe('live spot');
  });

  it('refreshes the sheet after drawing, once one is attached', () => {
    const { screen } = make();
    expect(() => screen.render()).not.toThrow();
    const sheet = { refresh: vi.fn() };
    screen.attach(null, sheet);
    screen.render();
    expect(sheet.refresh).toHaveBeenCalled();
  });

  it('keeps a following map on the runner, and leaves a map that is not following alone', () => {
    const { screen, live } = make();
    screen.show();
    expect(live.render).toHaveBeenCalled();
    const view = { following: vi.fn(() => true), centre: vi.fn() };
    screen.attach(view, null);
    screen.show();
    expect(view.centre).toHaveBeenCalledTimes(1);
    view.following.mockReturnValue(false);
    screen.show();
    expect(view.centre).toHaveBeenCalledTimes(1);
  });
});
