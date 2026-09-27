/**
 * The rest of the team out on the course while ours is off it. The runner
 * tracker goes on with whoever is running, so while ours rests, rides in
 * the vehicle, has free time or waits to take over, it still shows how far
 * the relay has got.
 */
export class RunningGroup {
  constructor(tuning) {
    this.tuning = tuning;
  }

  /** The runner tracker's fix while ours is off the course and the fix is fresh, or null. */
  where(act, fix, now) {
    const offCourse = ['drive', 'sleep', 'free'].includes(act.kind) || act.state === 'waiting';
    return offCourse && fix && now - fix.time <= this.tuning.staleMs ? fix : null;
  }
}
