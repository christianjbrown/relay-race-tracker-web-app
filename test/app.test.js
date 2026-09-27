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
    incoming: { place: vi.fn(() => null), arrival: vi.fn(() => 'handover-info') },
    projection: { of: vi.fn((fix) => fix) },
    locator: { where: vi.fn(() => ({ lat: 1, lng: 2 })) },
    journey: { pieces: vi.fn(() => ['piece']) },
    eta: { estimate: vi.fn(() => 'eta-info') },
    course: { km: [0, 1, 2, 3] },
    painter: { paint: vi.fn() },
    card: { render: vi.fn() },
    runnerMarker: { update: vi.fn() },
    badgeChoice: { of: vi.fn(() => 'badge') },
    vehicleMarker: { update: vi.fn() },
    group: { where: vi.fn(() => null) },
    groupMarker: { update: vi.fn() },
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

    it('counts the vehicle as parked on the first poll when the team is gathered round it', () => {
      const vehicle = { lat: 1, lng: 1, time: new Date('2027-05-15T09:59:00Z') };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => vehicle), liveRunner: vi.fn(() => null), live: {}, fillGuesses: vi.fn() },
        handovers: { parked: vi.fn(() => true), still: null },
      });
      app.now();
      expect(deps.activity.at.mock.calls[0][1].vehicle).toEqual({ ...vehicle, parked: true });
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

  describe('a quiet runner tracker', () => {
    const real = { lat: 1, lng: 1, time: new Date('2027-05-15T09:40:00Z') };
    const projected = { lat: 2, lng: 2, time: new Date('2027-05-15T10:00:00Z'), projected: { since: real.time, kmh: 10 } };
    const quiet = () => makeApp({
      poller: { poll: vi.fn(), liveVehicle: vi.fn(() => null), liveRunner: vi.fn(() => real), live: { runner: real, vehicle: 'v' }, fillGuesses: vi.fn() },
      activity: { at: vi.fn(() => ({ kind: 'run', state: 'running', index: 4, at: 2 })) },
      projection: { of: vi.fn(() => projected) },
    });

    it('is carried on at the pace the page has seen', () => {
      const { app, deps } = quiet();
      app.now();
      expect(deps.projection.of).toHaveBeenCalledWith(real, expect.any(Date), 10);
      expect(deps.activity.at.mock.calls[0][1].runner).toBe(projected);
    });

    it('puts the runner where the projection says', () => {
      const { app, deps } = quiet();
      app.where();
      expect(deps.locator.where).toHaveBeenCalledWith(expect.anything(), { runner: projected, vehicle: 'v' });
    });

    it('does not time the pace from a projected position', () => {
      const { app, deps } = quiet();
      app.render();
      expect(deps.pace.observe).not.toHaveBeenCalled();
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

    it('puts the badge the choice gives for the activity on the runner', () => {
      const act = { kind: 'sleep', state: 'planned', index: 0, at: null };
      const { app, deps } = makeApp({ activity: { at: vi.fn(() => act) } });
      app.render();
      expect(deps.badgeChoice.of).toHaveBeenCalledWith(act);
      expect(deps.runnerMarker.update).toHaveBeenCalledWith(expect.anything(), 'badge', false);
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

    it('shows the rest of the team where the group says, from the runner tracker', () => {
      const runnerFix = { lat: 5, lng: 6, time: new Date('2027-05-15T09:59:00Z') };
      const { app, deps } = makeApp({
        activity: { at: vi.fn(() => ({ kind: 'sleep', state: 'planned', index: 1 })) },
        group: { where: vi.fn(() => runnerFix) },
      });
      deps.poller.liveRunner.mockReturnValue(runnerFix);
      app.render();
      expect(deps.group.where).toHaveBeenCalledWith(expect.objectContaining({ kind: 'sleep' }), runnerFix, deps.clock.now());
      expect(deps.groupMarker.update).toHaveBeenCalledWith(runnerFix);
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

    it('times the runner coming in while driving to a leg', () => {
      const runner = { time: new Date('2027-05-15T09:59:00Z') };
      const place = { leg: 'the-leg', index: 4, at: 2 };
      const { app, deps } = makeApp({
        poller: { poll: vi.fn(), liveVehicle: vi.fn(() => null), liveRunner: vi.fn(() => runner), live: {}, fillGuesses: vi.fn() },
        activity: { at: vi.fn(() => ({ kind: 'drive', state: 'planned', index: 3, at: null })) },
        incoming: { place: vi.fn(() => place), arrival: vi.fn(() => 'handover-info') },
      });
      app.render();
      expect(deps.pace.follow).toHaveBeenCalledWith('4:incoming');
      expect(deps.pace.observe).toHaveBeenCalledWith(runner.time.getTime(), 2);
      expect(deps.incoming.arrival).toHaveBeenCalledWith(place, 10);
      expect(deps.card.render.mock.calls[0][5]).toBe('handover-info');
    });

    it('has no handover time when no runner is coming in', () => {
      const { app, deps } = makeApp();
      app.render();
      expect(deps.incoming.arrival).not.toHaveBeenCalled();
      expect(deps.card.render.mock.calls[0][5]).toBeNull();
    });

    it('has no trip when not driving', () => {
      const { app, deps } = makeApp();
      app.render();
      expect(deps.card.render.mock.calls[0][3]).toBeNull();
    });

    it('refreshes an attached sheet', () => {
      const { app } = makeApp();
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
