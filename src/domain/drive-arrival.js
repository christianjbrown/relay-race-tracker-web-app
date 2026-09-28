import { kmApart } from './geo.js';

/**
 * A drive lasts as long as the vehicle takes, not as long as the timeline
 * gave it. One that left late is still a drive: until the vehicle gets
 * where it was going, the rest or free time after it has not started. One
 * that gets there early is over, and the rest or free time after it has
 * begun. Once the vehicle has been seen to arrive it stays arrived, so
 * going out again - to dinner, say - does not put the runner back on the
 * road. A page that opens after that never saw the arrival, so an overrun
 * is only believed for a short while past the drive's planned end.
 */
export class DriveArrival {
  constructor(schedule, states, tuning) {
    this.schedule = schedule;
    this.states = states;
    this.tuning = tuning;
    this.arrived = new Set();
  }

  /**
   * The drive, overrunning, while the vehicle has not reached this stop; the
   * stop after a drive the vehicle has already finished; otherwise null.
   */
  check(planned, ctx) {
    if (planned.kind === 'drive') return this.early(planned, ctx);
    if (planned.kind === 'run') return null;
    const drive = this.schedule.before(planned);
    if (drive?.kind !== 'drive' || !ctx.vehicle || this.arrived.has(drive)) return null;
    if (ctx.now - drive.end >= this.tuning.maxDriveOverrunMs) return null;
    return this.reached(drive, ctx.vehicle) ? null : this.states.of(drive, 'overrun');
  }

  /** The rest or free time after a drive whose vehicle is already there, or null. */
  early(drive, { vehicle }) {
    const stop = this.schedule.after(drive);
    if (!stop || stop.kind === 'run' || stop.kind === 'drive') return null;
    if (!this.arrived.has(drive) && !(vehicle && this.reached(drive, vehicle))) return null;
    return this.states.of(stop, 'planned');
  }

  /** Whether the vehicle is where the drive was going, remembering it if so. */
  reached(drive, vehicle) {
    const away = kmApart(vehicle, drive.to);
    const there = away <= this.tuning.atDoorKm || (away <= this.tuning.arrivedKm && vehicle.parked);
    if (there) this.arrived.add(drive);
    return there;
  }
}
