import { kmApart } from './geo.js';

const HOUR = 3600 * 1000;

/**
 * The runner's next leg, when it is due or the vehicle has just brought
 * them to it. The runners before can be behind: until one reaches ours,
 * ours is waiting to take over, however late that makes the start. And a
 * runner who reaches ours before the clock says starts the leg early.
 */
export class HandoverWait {
  constructor(schedule, course, states, tuning) {
    this.schedule = schedule;
    this.course = course;
    this.states = states;
    this.tuning = tuning;
  }

  /**
   * { state } while waiting; { leg } when the leg has started before its
   * time; null when neither applies.
   */
  check({ planned, now, runner, vehicle, paceKmh }) {
    const upcoming = this.upcoming(planned);
    if (!upcoming || !runner) return null;
    const stop = vehicle?.parked ? this.vehicleAtStart(upcoming, vehicle) : null;
    const handover = stop ?? upcoming.span[0];
    const at = this.course.nearestIndex(runner, upcoming.searchFrom, upcoming.span[1]);
    const gap = this.course.between(at, handover);
    const met = stop !== null
      ? gap <= this.tuning.meetKm || kmApart(runner, vehicle) <= this.tuning.meetKm
      : gap <= this.tuning.legStartKm || kmApart(runner, this.course.at(handover)) <= this.tuning.legStartKm;
    if (!met && (planned === upcoming || stop !== null)) {
      const eta = new Date(now.getTime() + (Math.max(0, gap) / paceKmh) * HOUR);
      return { state: this.states.of(upcoming, 'waiting', { reached: upcoming.span[0], at, wait: { handover, eta } }) };
    }
    return met && planned !== upcoming ? { leg: upcoming } : null;
  }

  /** The leg that is due now, or the one the drive going on now leads to. */
  upcoming(planned) {
    if (planned?.kind === 'run') return planned;
    const following = planned?.kind === 'drive' ? this.schedule.after(planned) : null;
    return following?.kind === 'run' ? following : null;
  }

  /** Where on the course the parked vehicle has put the runner down for this leg, or null. */
  vehicleAtStart(leg, vehicle) {
    const a = leg.span[0];
    const km = this.course.km[a];
    const from = Math.max(leg.searchFrom, this.course.indexAtKm(km - this.tuning.vehicleNearStartKm));
    const to = this.course.indexAtKm(km + this.tuning.vehicleNearStartKm);
    const i = this.course.nearestIndex(vehicle, from, to);
    return kmApart(this.course.at(i), vehicle) <= this.tuning.vehicleOnCourseKm ? i : null;
  }
}
