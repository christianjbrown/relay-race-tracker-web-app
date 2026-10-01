// What the live page and the rewind share: they draw the same things from different sources.
import { Activity } from '../domain/activity.js';
import { DriveArrival } from '../domain/drive-arrival.js';
import { DriveGuess, Estimator, RunGuess, StopGuess } from '../domain/estimator.js';
import { HandoverWait } from '../domain/handover-wait.js';
import { Journey } from '../domain/journey.js';
import { DrivePieces, RunPieces, StopPieces } from '../domain/journey-pieces.js';
import { LateFinish } from '../domain/late-finish.js';
import { LegProgress } from '../domain/leg-progress.js';
import { RelayEnd } from '../domain/relay-end.js';
import { Painter } from '../maps/google/painter.js';

export function buildDrawing({ maps, map, theme, config, timeline, router, describer }) {
  const { schedule, course, states } = timeline;
  const { tuning } = config;
  const estimator = new Estimator(schedule, course, { run: new RunGuess(course), drive: new DriveGuess(router), sleep: new StopGuess(), free: new StopGuess() });
  const journey = new Journey(schedule, {
    run: new RunPieces(course),
    drive: new DrivePieces(course, router, tuning),
    sleep: new StopPieces(describer),
    free: new StopPieces(describer),
  });
  const painter = new Painter(maps, map, theme, config.colours);
  const ending = new RelayEnd(new Activity(schedule, states, {
    waits: new HandoverWait(schedule, course, states, tuning),
    legs: new LegProgress(schedule, course, states, tuning),
    arrivals: new DriveArrival(schedule, states, tuning),
    lateFinish: new LateFinish(schedule, states),
  }, tuning), schedule, states, tuning);
  return { estimator, journey, painter, ending };
}
