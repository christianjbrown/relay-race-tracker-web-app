const VEHICLE_EMOJI = { bus: '🚌', van: '🚐', car: '🚗' };

/** The emoji for each thing the runner can be doing, with their own for running. */
export function makeBadges(runnerEmoji, vehicle) {
  return Object.freeze({
    run: runnerEmoji,
    drive: VEHICLE_EMOJI[vehicle],
    sleep: '💤',
    free: '🕹️',
    finished: '🏁',
    waiting: '⏳',
  });
}
