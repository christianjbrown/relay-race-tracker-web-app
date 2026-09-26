/**
 * The shape every answer to "what is the runner doing?" takes: the segment,
 * its place in the timeline, its kind and a state. States are 'before' and
 * 'finished' outside the relay; 'running' on a leg the tracker agrees is
 * going on; 'overrun' on a leg or drive whose time is up but which the
 * trackers say is not over; 'waiting' when a leg is due but the runner
 * coming in has not arrived; and 'planned' for everything else.
 *
 * Extras on a leg: `at`, where the runner is on the course; `reached`, that
 * held within the leg, for drawing how much of it is done; `end`, where the
 * leg ends, which a waiting vehicle can move; and `wait`, the handover point
 * and expected time while waiting.
 */
export class ActivityStates {
  constructor(schedule) {
    this.schedule = schedule;
  }

  of(seg, state, extra = {}) {
    return { seg, index: seg ? this.schedule.indexOf(seg) : -1, kind: seg ? seg.kind : null, state, ...extra };
  }

  /** Before the first segment or after the last one. */
  outside(now) {
    return this.of(null, now < this.schedule.first.start ? 'before' : 'finished');
  }
}

/** What the runner is doing by the timeline alone, before there is a course or a tracker. */
export class ClockActivity {
  constructor(schedule, states) {
    this.schedule = schedule;
    this.states = states;
  }

  at(now) {
    const seg = this.schedule.at(now);
    return seg ? this.states.of(seg, 'planned') : this.states.outside(now);
  }
}

/** Where the timeline stands: segments before this index are done, after it still to come. */
export function timelinePosition(act, count) {
  if (act.state === 'before') return -1;
  if (act.state === 'finished') return count;
  return act.index;
}
