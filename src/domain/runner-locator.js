/**
 * The runner is wherever the tracker they are with says: the runner
 * tracker's while they are on a leg, the vehicle's otherwise, including
 * while they wait to take over. Once the relay is over they stay on the
 * finish line: the trackers get switched off or packed into a vehicle home,
 * and the runner's face would go with them.
 */
export class RunnerLocator {
  constructor(schedule, course) {
    this.schedule = schedule;
    this.course = course;
  }

  /** `live` is { runner, vehicle }, each a fix or null. */
  where(act, live) {
    if (act.state === 'finished') return { ...this.course.at(this.course.lastIndex), finished: true };
    if (act.state === 'before') return this.schedule.first.kind === 'run' ? live.runner : live.vehicle;
    if (act.state === 'waiting') return live.vehicle;
    return act.kind === 'run' ? live.runner : live.vehicle;
  }
}
