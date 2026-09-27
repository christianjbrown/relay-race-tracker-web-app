/**
 * Where the runner's face is on the map, for anything that has to keep out
 * of its way: each watcher is told whenever it moves.
 */
export class RunnerSpot {
  constructor() {
    this.pos = null;
    this.watchers = [];
  }

  watch(fn) {
    this.watchers.push(fn);
  }

  moveTo(pos) {
    this.pos = pos;
    for (const fn of this.watchers) fn();
  }
}
