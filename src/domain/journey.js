import { timelinePosition } from './activity-states.js';

/**
 * The runner's whole path, coloured by what they are doing: each leg on the
 * course, each drive on the road, each rest and stretch of free time as a
 * stop. What is done is solid; what is still to come is faded.
 *
 * Each kind of segment has its own builder, `{ pieces(seg, i, ctx) }`, so a
 * new kind is a new builder rather than another branch here.
 */
export class Journey {
  constructor(schedule, builders) {
    this.schedule = schedule;
    this.builders = builders;
  }

  pieces(now, act, vehicle) {
    const segs = this.schedule.segments;
    const nowAt = timelinePosition(act, segs.length);
    return segs.flatMap((seg, i) => {
      const builder = this.builders[seg.kind];
      if (!builder) throw new Error(`No way to draw a "${seg.kind}" segment.`);
      return builder.pieces(seg, i, { now, act, vehicle, nowAt, segs, done: i < nowAt, todo: i > nowAt });
    });
  }
}
