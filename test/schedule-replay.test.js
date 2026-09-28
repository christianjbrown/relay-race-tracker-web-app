import { describe, expect, it, vi } from 'vitest';
import { ScheduleReplay } from '../src/schedule-replay.js';

describe('ScheduleReplay', () => {
  const t = new Date('2027-05-15T10:00:00Z');
  const act = { kind: 'run', state: 'planned' };
  const make = () => {
    const deps = {
      rewind: { time: t },
      activity: { at: vi.fn(() => act) },
      estimator: { at: vi.fn(() => ({ lat: 1, lng: 2, time: t, estimated: true })) },
      streetView: { of: vi.fn(() => 'https://street.view') },
      journey: { pieces: vi.fn(() => ['piece']) },
      painter: { paint: vi.fn() },
      card: { render: vi.fn() },
      runnerMarker: { update: vi.fn() },
      badgeChoice: { of: vi.fn(() => 'run') },
      vehicleMarker: { update: vi.fn() },
      groupMarker: { update: vi.fn() },
      birthday: { on: vi.fn(() => false) },
    };
    return { replay: new ScheduleReplay(deps), deps };
  };
  const fix = { lat: 1, lng: 2, time: t, estimated: true, replayed: true };

  it('puts the runner where the timeline had them at the rewind\'s moment, marked as a replay', () => {
    const { replay, deps } = make();
    expect(replay.where()).toEqual(fix);
    expect(deps.estimator.at).toHaveBeenCalledWith(t);
  });

  it('draws the moment from the timeline alone: no vehicle, no running group, no trackers', () => {
    const { replay, deps } = make();
    replay.render();
    expect(deps.activity.at).toHaveBeenCalledWith(t);
    expect(deps.runnerMarker.update).toHaveBeenCalledWith(fix, 'run', false);
    expect(deps.birthday.on).toHaveBeenCalledWith(t);
    expect(deps.vehicleMarker.update).toHaveBeenCalledWith(null);
    expect(deps.groupMarker.update).toHaveBeenCalledWith(null);
    expect(deps.journey.pieces).toHaveBeenCalledWith(t, act, null);
    expect(deps.painter.paint).toHaveBeenCalledWith(['piece']);
    expect(deps.card.render).toHaveBeenCalledWith(t, fix, act);
  });

  it('looks around in Street View where the timeline had them', () => {
    const { replay, deps } = make();
    expect(replay.lookAround()).toBe('https://street.view');
    expect(deps.streetView.of).toHaveBeenCalledWith(act, fix);
  });
});
