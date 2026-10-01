// The live trackers: Chronorace's feed, who to follow in it and how their fixes are read.
import { Convoy } from '../domain/convoy.js';
import { HandoverSpotter } from '../domain/handover-spotter.js';
import { RunnerPace } from '../domain/runner-pace.js';
import { ChronoraceFeed } from '../services/chronorace-feed.js';
import { TrackerPoller } from '../services/tracker-poller.js';

export function buildTracking(win, config) {
  const { tuning } = config;
  const handovers = new HandoverSpotter(tuning, new Convoy(tuning), new Convoy(tuning));
  const pace = new RunnerPace(tuning);
  const feed = new ChronoraceFeed(config.chronorace.eventId, (...args) => win.fetch(...args));
  const bibs = { runner: config.chronorace.runnerTracker, vehicle: config.chronorace.vehicleTracker };
  return { handovers, pace, poller: new TrackerPoller(feed, bibs, handovers, win.console) };
}
