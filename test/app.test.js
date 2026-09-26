import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/app.js';

function makeApp(overrides = {}) {
  const deps = {
    clock: { now: vi.fn(() => new Date('2027-05-15T10:00:00Z')) },
    poller: {
      poll: vi.fn(async () => {}),
      liveVehicle: vi.fn(() => null),
      liveRunner: vi.fn(() => null),
      live: { some: 'fixes' },
      fillGuesses: vi.fn(),
    },
    estimator: { at: vi.fn(() => ({ guess: true })) },
    activity: { at: vi.fn(() => ({ kind: 'run', state: 'active', index: 0, at: null })) },
    handovers: { parked: vi.fn(() => false), still: false },
    pace: { kmh: vi.fn(() => 10), follow: vi.fn(), observe: vi.fn() },
    legFinish: { at: vi.fn(() => 'finish-info') },
    locator: { where: vi.fn(() => ({ lat: 1, lng: 2 })) },
    journey: { pieces: vi.fn(() => ['piece']) },
    eta: { estimate: vi.fn(() => 'eta-info') },
    course: { km: [0, 1, 2, 3] },
    painter: { paint: vi.fn() },
    card: { render: vi.fn() },
    runnerMarker: { update: vi.fn() },
    vehicleMarker: { update: vi.fn() },
    birthday: { on: vi.fn(() => false) },
    tuning: { pollMs: 5000, staleMs: 60000, jogKmh: 8 },
    timers: { setInterval: vi.fn() },
    ...overrides,
  };
  return { app: new App(deps), deps };
}

describe('App', () => {
  describe('attach', () => {
    it('stores the view and the sheet', () => {
      const { app } = makeApp();
      const view = {};
      const sheet = {};
      app.attach(view, sheet);
      expect(app.view).toBe(view);
      expect(app.sheet).toBe(sheet);
    });
  });

  describe('run', () => {
    it('polls and redraws on their own intervals', async () => {
      const { app, deps } = makeApp();
      app.run();
      expect(deps.timers.setInterval).toHaveBeenCalledTimes(2);
      expect(deps.timers.setInterval.mock.calls[0][1]).toBe(5000);
      expect(deps.timers.setInterval.mock.calls[1][1]).toBe(30000);

      await deps.timers.setInterval.mock.calls[0][0]();
      expect(deps.poller.poll).toHaveBeenCalled();

      deps.timers.setInterval.mock.calls[1][0]();
      expect(deps.card.render).toHaveBeenCalled();
    });
  });

  describe('poll', () => {
    it('polls, renders and recentres a following view', async () => {
      const { app, deps } = makeApp();
      app.attach({ following: () => true, centre: vi.fn() }, null);
      const centre = vi.fn();
      app.view.centre = centre;

      await app.poll();

      expect(deps.poller.poll).toHaveBeenCalled();
      expect(deps.card.render).toHaveBeenCalled();
      expect(centre).toHaveBeenCalled();
    });

    it('does not recentre a view that is not following', async () => {
      const { app } = makeApp();
      const centre = vi.fn();
      app.attach({ following: () => false, centre }, null);

      await app.poll();

      expect(centre).not.toHaveBeenCalled();
    });

    it('works with no view attached at all', async () => {
      const { app } = makeApp();
      await expect(app.poll()).resolves.toBeUndefined();
    });
  });

  describe('now', () => {
    it('uses the clock by default', () => {
      const { app, deps } = makeApp();
      app.now();
      expect(deps.clock.now).toHaveBeenCalled();
    });

    it('uses the given moment instead of the clock when one is passed', () => {
      const { app, deps } = makeApp();
      const moment = new Date('2027-05-15T12:00:00Z');
      app.now(moment);
      expect(deps.activity.at).toHaveBeenCalledWith(moment, expect.anything());
    });

    it('has no vehicle waiting or driving when there is no live vehicle', () => {
      const { app, deps } = makeApp();
      app.now();
      const arg = deps.activity.at.mock.calls[0][1];
      expect(arg.vehicleWaiting).toBeNull();
      expect(arg.vehicle).toBeNull();
    });

    it('treats the vehicle as waiting when handovers say it has parked', () => {
      const vehicle = { lat: 1, lng: 1 };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => vehicle), liveRunner: vi.fn(() => null), live: {}, fillGuesses: vi.fn() },
        handovers: { parked: vi.fn(() => true), still: true },
      });
      app.now();
      const arg = deps.activity.at.mock.calls[0][1];
      expect(arg.vehicleWaiting).toBe(vehicle);
      expect(arg.vehicle).toEqual({ ...vehicle, parked: true });
    });

    it('has a driving (non-waiting) vehicle when handovers say it has not parked', () => {
      const vehicle = { lat: 1, lng: 1 };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => vehicle), liveRunner: vi.fn(() => null), live: {}, fillGuesses: vi.fn() },
        handovers: { parked: vi.fn(() => false), still: false },
      });
      app.now();
      const arg = deps.activity.at.mock.calls[0][1];
      expect(arg.vehicleWaiting).toBeNull();
      expect(arg.vehicle).toEqual({ ...vehicle, parked: false });
    });
  });

  describe('where', () => {
    it('locates the runner from the current activity', () => {
      const { app, deps } = makeApp();
      const result = app.where();
      expect(deps.locator.where).toHaveBeenCalledWith(expect.anything(), deps.poller.live);
      expect(result).toEqual({ lat: 1, lng: 2 });
    });
  });

  describe('render', () => {
    it('fills guesses, paints and renders the card', () => {
      const { app, deps } = makeApp();
      app.render();
      expect(deps.poller.fillGuesses).toHaveBeenCalled();
      expect(deps.painter.paint).toHaveBeenCalledWith(['piece']);
      expect(deps.card.render).toHaveBeenCalled();
    });

    it('maps a finished activity to the finished badge', () => {
      const { app, deps } = makeApp({ activity: { at: vi.fn(() => ({ kind: 'run', state: 'finished', index: 0, at: null })) } });
      app.render();
      expect(deps.runnerMarker.update).toHaveBeenCalledWith(expect.anything(), 'finished', false);
    });

    it('maps a waiting activity to the drive badge', () => {
      const { app, deps } = makeApp({ activity: { at: vi.fn(() => ({ kind: 'run', state: 'waiting', index: 0, at: null })) } });
      app.render();
      expect(deps.runnerMarker.update).toHaveBeenCalledWith(expect.anything(), 'drive', false);
    });

    it('falls back to the activity kind for any other state', () => {
      const { app, deps } = makeApp({ activity: { at: vi.fn(() => ({ kind: 'sleep', state: 'active', index: 0, at: null })) } });
      app.render();
      expect(deps.runnerMarker.update).toHaveBeenCalledWith(expect.anything(), 'sleep', false);
    });

    it('hides the vehicle while the runner is on a leg without it', () => {
      const vehicle = { lat: 1, lng: 1 };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => vehicle), liveRunner: vi.fn(() => null), live: {}, fillGuesses: vi.fn() },
        activity: { at: vi.fn(() => ({ kind: 'run', state: 'active', index: 0, at: null })) },
      });
      app.render();
      expect(deps.vehicleMarker.update).toHaveBeenCalledWith(null);
    });

    it('shows the vehicle when the runner is not mid-leg', () => {
      const vehicle = { lat: 1, lng: 1 };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => vehicle), liveRunner: vi.fn(() => null), live: {}, fillGuesses: vi.fn() },
        activity: { at: vi.fn(() => ({ kind: 'drive', state: 'active', index: 0, at: null })) },
      });
      app.render();
      expect(deps.vehicleMarker.update).toHaveBeenCalledWith(vehicle);
    });

    it('shows the vehicle when the runner is on a leg but waiting for it', () => {
      const vehicle = { lat: 1, lng: 1 };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => vehicle), liveRunner: vi.fn(() => null), live: {}, fillGuesses: vi.fn() },
        activity: { at: vi.fn(() => ({ kind: 'run', state: 'waiting', index: 0, at: null })) },
      });
      app.render();
      expect(deps.vehicleMarker.update).toHaveBeenCalledWith(vehicle);
    });

    it('estimates a trip when driving with a live vehicle', () => {
      const vehicle = { lat: 1, lng: 1 };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => vehicle), liveRunner: vi.fn(() => null), live: {}, fillGuesses: vi.fn() },
        activity: { at: vi.fn(() => ({ kind: 'drive', state: 'active', index: 0, at: null, seg: 'the-drive' })) },
      });
      app.render();
      expect(deps.eta.estimate).toHaveBeenCalledWith('the-drive', vehicle, expect.any(Date));
      expect(deps.card.render.mock.calls[0][3]).toBe('eta-info');
    });

    it('has no trip when driving without a live vehicle', () => {
      const { app, deps } = makeApp({ activity: { at: vi.fn(() => ({ kind: 'drive', state: 'active', index: 0, at: null })) } });
      app.render();
      expect(deps.eta.estimate).not.toHaveBeenCalled();
      expect(deps.card.render.mock.calls[0][3]).toBeNull();
    });

    it('has no trip when not driving', () => {
      const { app, deps } = makeApp();
      app.render();
      expect(deps.card.render.mock.calls[0][3]).toBeNull();
    });

    it('refreshes an attached sheet', () => {
      const { app, deps } = makeApp();
      const sheet = { refresh: vi.fn() };
      app.attach(null, sheet);
      app.render();
      expect(sheet.refresh).toHaveBeenCalled();
    });

    it('does nothing when there is no attached sheet', () => {
      const { app } = makeApp();
      expect(() => app.render()).not.toThrow();
    });
  });

  describe('timePace', () => {
    it('stops following a pace outside a run', () => {
      const { app, deps } = makeApp();
      app.timePace({ kind: 'drive', state: 'active', index: 2, at: null });
      expect(deps.pace.follow).toHaveBeenCalledWith(null);
      expect(deps.pace.observe).not.toHaveBeenCalled();
    });

    it('follows the incoming runner while waiting for a handover', () => {
      const { app, deps } = makeApp();
      app.timePace({ kind: 'run', state: 'waiting', index: 2, at: null });
      expect(deps.pace.follow).toHaveBeenCalledWith('2:incoming');
    });

    it('follows our own runner while running otherwise', () => {
      const { app, deps } = makeApp();
      app.timePace({ kind: 'run', state: 'active', index: 3, at: null });
      expect(deps.pace.follow).toHaveBeenCalledWith('3:ours');
    });

    it('observes a pace fix when the runner has a known position and a live fix', () => {
      const runner = { time: new Date('2027-05-15T10:00:00Z') };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => null), liveRunner: vi.fn(() => runner), live: {}, fillGuesses: vi.fn() },
      });
      app.timePace({ kind: 'run', state: 'active', index: 1, at: 2 });
      expect(deps.pace.observe).toHaveBeenCalledWith(runner.time.getTime(), deps.course.km[2]);
    });

    it('does not observe a pace fix when the runner has no known position on the course', () => {
      const runner = { time: new Date() };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => null), liveRunner: vi.fn(() => runner), live: {}, fillGuesses: vi.fn() },
      });
      app.timePace({ kind: 'run', state: 'active', index: 1, at: null });
      expect(deps.pace.observe).not.toHaveBeenCalled();
    });

    it('does not observe a pace fix when there is no live runner', () => {
      const { app, deps } = makeApp();
      app.timePace({ kind: 'run', state: 'active', index: 1, at: 2 });
      expect(deps.pace.observe).not.toHaveBeenCalled();
    });
  });
});
