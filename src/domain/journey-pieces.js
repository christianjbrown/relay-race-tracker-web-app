import { lerp, nearestOnPath, roundToKm, shareOf } from './geo.js';

/** A leg, on the course: done up to where the runner has reached, the rest faded. */
export class RunPieces {
  constructor(course) {
    this.course = course;
  }

  pieces(seg, i, { now, act, done, todo }) {
    const [a, b] = seg.span;
    if (done || todo) return [{ kind: 'run', path: this.course.slice(a, b), faded: todo }];
    const km = this.course.km;
    const reached = act.reached ?? this.course.indexAtKm(lerp(km[a], km[b], shareOf(seg, now)));
    return [
      { kind: 'run', path: this.course.slice(a, reached), faded: false },
      { kind: 'run', path: this.course.slice(reached, act.end ?? b), faded: true },
    ];
  }
}

/** A drive, on the road Google finds, reshaped by the live vehicle while it is going on. */
export class DrivePieces {
  constructor(course, router, tuning) {
    this.course = course;
    this.router = router;
    this.tuning = tuning;
  }

  pieces(seg, i, { act, vehicle, nowAt, segs, done, todo }) {
    if (!done && !todo && vehicle) return this.soFar(seg, vehicle);
    // The drive straight after the leg going on starts where that leg
    // really ends: at the vehicle, when it is waiting somewhere else.
    const current = segs[nowAt];
    const moved = i === nowAt + 1 && act.end != null && current?.kind === 'run' && act.end !== current.span[1];
    const from = moved ? { ...seg.from, ...this.course.at(act.end) } : seg.from;
    const road = this.router.get(from, seg.to);
    return [{ kind: 'drive', path: road ?? [from, seg.to], faded: todo }];
  }

  /** The drive going on now: behind the vehicle is done, ahead of it still to come. */
  soFar(seg, vehicle) {
    const road = this.router.get(seg.from, seg.to) ?? [seg.from, seg.to];
    const near = nearestOnPath(road, vehicle);
    if (near.km <= this.tuning.detourKm) {
      return [
        { kind: 'drive', path: [...road.slice(0, near.index + 1), vehicle], faded: false },
        { kind: 'drive', path: [vehicle, ...road.slice(near.index + 1)], faded: true },
      ];
    }
    // Off the guessed road: route through where the vehicle really is. A
    // short straight piece joins the rounded point to the vehicle itself.
    const via = roundToKm(vehicle);
    const behind = this.router.get(seg.from, via);
    // The same live trip the arrival estimate uses, so one request serves both.
    const ahead = this.router.trip(via, seg.to, { live: true })?.path;
    return [
      { kind: 'drive', path: behind ? [...behind, vehicle] : [seg.from, vehicle], faded: false },
      { kind: 'drive', path: ahead ? [vehicle, ...ahead] : [vehicle, seg.to], faded: true },
    ];
  }
}

/** A rest or free time: a dot at the place, with its name. */
export class StopPieces {
  constructor(describer) {
    this.describer = describer;
  }

  pieces(seg, i, { todo }) {
    return [{ kind: seg.kind, spot: seg.at, faded: todo, title: this.describer.describe(seg) }];
  }
}
