import { clamp, roundToKm } from './geo.js';

/**
 * When the vehicle will get where it is going, from Google's estimate with
 * today's traffic from where it is now, and how much of the drive is behind
 * it. The timeline says when the drive was meant to be; this says when it
 * will actually end.
 */
export class DriveEta {
  constructor(router) {
    this.router = router;
  }

  /** { arrival, share } for this drive, or null while Google has not answered. */
  estimate(seg, vehicle, now) {
    const ahead = this.router.trip(roundToKm(vehicle), seg.to, { live: true });
    if (!ahead) return null;
    const whole = this.router.trip(seg.from, seg.to);
    const share = whole ? clamp(1 - ahead.metres / whole.metres, 0, 1) : null;
    return { arrival: new Date(now.getTime() + ahead.seconds * 1000), share };
  }
}
