import { clamp, kmApart } from './geo.js';

/**
 * How a leg the runner tracker is following is going. The times are a
 * guide: a leg can run long, and it is not over until the tracker reaches
 * its end - or the vehicle waiting to collect the runner, which is the
 * surest handover point of all.
 */
export class LegProgress {
  constructor(schedule, course, states, tuning) {
    this.schedule = schedule;
    this.course = course;
    this.states = states;
    this.tuning = tuning;
  }

  /** The state of this leg, the next segment once it is handed over, or null to fall back on the clock. */
  check(leg, { now, runner, vehicleWaiting }) {
    const [a, b] = leg.span;
    const at = this.position(leg, runner);
    const late = now >= leg.end;
    const within = (end) => clamp(at, a, end);

    const meet = vehicleWaiting && !leg.finish ? this.vehicleWaiting(leg, vehicleWaiting) : null;
    if (meet !== null) {
      // Met by either measure: along the course, or straight across,
      // because the course can wind round a car park to reach the vehicle.
      const ahead = this.course.between(at, meet);
      const apart = Math.abs(ahead) > this.tuning.meetKm && kmApart(runner, vehicleWaiting) > this.tuning.meetKm;
      if (!apart) return this.handedOver(leg);
      // A vehicle the runner has already gone past is not waiting for them.
      if (ahead > 0) return this.states.of(leg, late ? 'overrun' : 'running', { reached: within(meet), at, end: meet });
    }
    if (late) {
      return this.passedEnd(leg, at) ? null : this.states.of(leg, 'overrun', { reached: within(b), at, end: b });
    }
    // Well past the end before time: somebody else is carrying it.
    if (this.course.between(b, at) > this.tuning.earlyHandoverKm && this.schedule.after(leg)) return this.handedOver(leg);
    return this.states.of(leg, 'running', { reached: within(b), at, end: b });
  }

  handedOver(leg) {
    const next = this.schedule.after(leg);
    return next ? this.states.of(next, 'planned') : null;
  }

  /** Where the runner is on the course, looking only around this leg. */
  position(leg, runner) {
    const [a, b] = leg.span;
    return this.course.nearestIndex(runner, leg.searchFrom, Math.min(this.course.lastIndex, b + (b - a)));
  }

  /**
   * Where on the course the vehicle is waiting to collect the runner at the
   * end of this leg, or null. Near the start of the leg it is dropping them
   * off, and anywhere else it is not a handover at all.
   */
  vehicleWaiting(leg, vehicle) {
    const [a, b] = leg.span;
    const km = this.course.km[b];
    const from = Math.max(a, this.course.indexAtKm(km - this.tuning.vehicleBeforeEndKm));
    const to = this.course.indexAtKm(km + this.tuning.vehicleAfterEndKm);
    const i = this.course.nearestIndex(vehicle, from, to);
    return kmApart(vehicle, this.course.at(i)) <= this.tuning.vehicleOnCourseKm ? i : null;
  }

  /** Whether the runner is close enough to this leg's end to call it handed over. */
  passedEnd(leg, at) {
    const zone = leg.finish ? this.tuning.finishLineKm : this.tuning.handoverZoneKm;
    return this.course.between(leg.span[1], at) >= -zone;
  }
}
