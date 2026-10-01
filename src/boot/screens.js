// The two ways the page shows a moment: following the runner live, or replaying the schedule.
import { App } from '../app.js';
import { DriveEta } from '../domain/drive-eta.js';
import { IncomingRunner } from '../domain/incoming-runner.js';
import { LegFinish } from '../domain/leg-finish.js';
import { RunnerLocator } from '../domain/runner-locator.js';
import { RunnerProjection } from '../domain/runner-projection.js';
import { RunningGroup } from '../domain/running-group.js';
import { MomentSwitch } from '../moment-switch.js';
import { ScheduleReplay } from '../schedule-replay.js';

export function buildApp(p) {
  const { clock, tracking, drawing, timeline, config, ui, markers, router } = p;
  const { schedule, course } = timeline;
  const { tuning } = config;
  return new App({
    clock,
    poller: tracking.poller,
    estimator: drawing.estimator,
    activity: drawing.ending,
    handovers: tracking.handovers,
    pace: tracking.pace,
    legFinish: new LegFinish(course, tracking.pace),
    incoming: new IncomingRunner(schedule, course, tuning),
    projection: new RunnerProjection(schedule, course, tuning),
    locator: new RunnerLocator(schedule, course),
    streetView: ui.streetView,
    journey: drawing.journey,
    eta: new DriveEta(router),
    course,
    painter: drawing.painter,
    card: ui.card,
    runnerMarker: markers.runnerMarker,
    badgeChoice: ui.badgeChoice,
    vehicleMarker: markers.vehicleMarker,
    group: new RunningGroup(tuning),
    groupMarker: markers.groupMarker,
    birthday: ui.birthday,
    tuning,
  });
}

export function buildReplay({ ui, timeline, drawing, markers }) {
  return new ScheduleReplay({
    rewind: ui.rewind,
    activity: timeline.plannedActivity,
    estimator: drawing.estimator,
    streetView: ui.streetView,
    journey: drawing.journey,
    painter: drawing.painter,
    card: ui.card,
    runnerMarker: markers.runnerMarker,
    badgeChoice: ui.badgeChoice,
    vehicleMarker: markers.vehicleMarker,
    groupMarker: markers.groupMarker,
    birthday: ui.birthday,
  });
}

/** Joins the live page and the replay behind one switch, and has the rewind and the router redraw it. */
export function buildScreen(app, replay, { ui, router }) {
  const screen = new MomentSwitch(app, replay, ui.rewind);
  ui.rewind.listen(() => screen.show());
  router.onReady(() => screen.render());
  return screen;
}
