import { kmApart } from './geo.js';

/**
 * A drive that left late is still a drive: until the vehicle gets where it
 * was going, the rest or free time after it has not started. Once the
 * vehicle has been seen to arrive it stays arrived, so going out again -
 * to dinner, say - does not put the runner back on the road. A page that
 * opens after that never saw the arrival, so an overrun is only believed
 * for a short while past the drive's planned end.
 */
export class DriveArrival {
  constructor(schedule, states, tuning) {
    this.schedule = schedule;
    this.states = states;
    this.tuning = tuning;
    this.arrived = new Set();
  }

  /** The drive, overrunning, while the vehicle has not reached this stop; otherwise null. */
  check(planned, { now, vehicle }) {
    if (planned.kind === 'run' || planned.kind === 'drive') return null;
    const drive = this.schedule.before(planned);
    if (drive?.kind !== 'drive' || !vehicle || this.arrived.has(drive)) return null;
    if (now - drive.end >= this.tuning.maxDriveOverrunMs) return null;
    const away = kmApart(vehicle, drive.to);
    const there = away <= this.tuning.atDoorKm || (away <= this.tuning.arrivedKm && vehicle.parked);
    if (!there) return this.states.of(drive, 'overrun');
    this.arrived.add(drive);
    return null;
  }
}
