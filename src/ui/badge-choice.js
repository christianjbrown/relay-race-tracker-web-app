// The badge for a state that is not the segment's own kind; null for none.
const BY_STATE = Object.freeze({ finished: 'finished', waiting: 'drive', before: null });

/**
 * Which badge the runner's face wears: the flag once they have finished,
 * the vehicle while they wait in it to take over, none before the start,
 * and otherwise whatever they are doing.
 */
export class BadgeChoice {
  /** A key of the badges ('run', 'drive', 'finished', ...), or null for none. */
  of(act) {
    return act.state in BY_STATE ? BY_STATE[act.state] : act.kind;
  }
}
