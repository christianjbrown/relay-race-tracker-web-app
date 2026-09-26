import { alongPath, lerp, shareOf } from './geo.js';

/**
 * Where the runner probably is when the trackers cannot say: time divided
 * equally along whatever is going on - the leg on the course, the drive on
 * the road - or at the stop. Each kind of segment has its own guesser,
 * `{ at(seg, t) }`, where t is the share of the segment's time gone by.
 */
export class Estimator {
  constructor(schedule, course, guessers) {
    this.schedule = schedule;
    this.course = course;
    this.guessers = guessers;
  }

  at(now) {
    const guess = (p) => ({ lat: p.lat, lng: p.lng, time: now, estimated: true });
    const seg = this.schedule.at(now);
    if (!seg) return guess(this.course.at(now < this.schedule.first.start ? 0 : this.course.lastIndex));
    const guesser = this.guessers[seg.kind];
    if (!guesser) throw new Error(`No way to place a "${seg.kind}" segment.`);
    return guess(guesser.at(seg, shareOf(seg, now)));
  }
}

export class RunGuess {
  constructor(course) {
    this.course = course;
  }

  at(seg, t) {
    const [a, b] = seg.span;
    return this.course.at(this.course.indexAtKm(lerp(this.course.km[a], this.course.km[b], t)));
  }
}

export class DriveGuess {
  constructor(router) {
    this.router = router;
  }

  at(seg, t) {
    return alongPath(this.router.get(seg.from, seg.to) ?? [seg.from, seg.to], t);
  }
}

export class StopGuess {
  at(seg) {
    return seg.at;
  }
}
