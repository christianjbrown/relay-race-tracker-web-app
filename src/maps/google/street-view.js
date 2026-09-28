import { bearing } from '../../domain/geo.js';

const PANO = 'https://www.google.com/maps/@?api=1&map_action=pano';

/**
 * Google Street View where the runner is shown on the course, looking the
 * way the course goes from there. Only while they are out on a leg: at a
 * rest, on the road in the vehicle or waiting to take over there is
 * nothing to look along.
 */
export class StreetView {
  constructor(course, aheadKm = 0.05) {
    this.course = course;
    this.aheadKm = aheadKm;
  }

  /**
   * The Street View address for the runner shown at `fix`, or null when
   * there is none. The tracker's place on the course when there is one,
   * and otherwise the nearest point on the leg to where they are drawn.
   */
  of(act, fix) {
    if (act.kind !== 'run' || act.state === 'waiting' || !fix) return null;
    const at = act.at ?? this.course.nearestIndex(fix, ...act.seg.span);
    const here = this.course.at(at);
    const km = this.course.km[at];
    const ahead = this.course.indexAtKm(km + this.aheadKm);
    // At the very end of the course, face the way it came in.
    const heading = ahead > at
      ? bearing(here, this.course.at(ahead))
      : bearing(this.course.at(this.course.indexAtKm(km - this.aheadKm)), here);
    return `${PANO}&viewpoint=${here.lat.toFixed(6)},${here.lng.toFixed(6)}&heading=${Math.round(heading)}`;
  }
}
