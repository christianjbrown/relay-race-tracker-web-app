import { lngScale } from './geo.js';

const KM_PER_DEGREE = 111.2;

/** The relay course, and where along it a position or a distance falls. */
export class Course {
  constructor(points) {
    if (points.length < 2) throw new Error('The course needs at least two points.');
    this.points = points;
    this.cosLat = lngScale(points[0].lat);
    this.km = [0];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const d = Math.hypot(b.lat - a.lat, (b.lng - a.lng) * this.cosLat) * KM_PER_DEGREE;
      this.km.push(this.km[i - 1] + d);
    }
  }

  get lastIndex() { return this.points.length - 1; }

  get totalKm() { return this.km[this.lastIndex]; }

  /**
   * Index of the course point nearest to a position, between `from` and
   * `to`. The course doubles back on itself in places, and a leg can only
   * continue from where the last one ended.
   */
  nearestIndex(pos, from = 0, to = this.lastIndex) {
    let best = from;
    let bestD = Infinity;
    for (let i = from; i <= to; i++) {
      const p = this.points[i];
      const dy = p.lat - pos.lat;
      const dx = (p.lng - pos.lng) * this.cosLat;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  /** The first point at least this far along the course. */
  indexAtKm(km) {
    let lo = 0;
    let hi = this.lastIndex;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.km[mid] < km) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** Distance along the course from point a to point b, negative when b is behind a. */
  between(a, b) {
    return this.km[b] - this.km[a];
  }

  slice(a, b) {
    return this.points.slice(Math.min(a, b), Math.max(a, b) + 1);
  }

  at(i) {
    const p = this.points[i];
    return { lat: p.lat, lng: p.lng };
  }
}
