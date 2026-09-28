import { describe, expect, it } from 'vitest';
import { resolveTuning } from '../../src/config/tuning.js';
import { Convoy } from '../../src/domain/convoy.js';
import { at, offCourse } from '../fixtures/relay.js';

const fix = (i, minutes, id, km = 0) => ({ ...offCourse(i, km), time: at(minutes), ...(id ? { id } : {}) });

describe('Convoy', () => {
  const tuning = resolveTuning();

  it('takes in a tracker that moves along beside the leader, and keeps it when they stop together', () => {
    const c = new Convoy(tuning);
    c.observe(fix(10, 0), [fix(10, 0, 'b', 0.05)]);
    expect(c.has('b')).toBe(false);
    c.observe(fix(20, 1), [fix(20, 1, 'b', 0.05)]);
    expect(c.has('b')).toBe(true);
    c.observe(fix(20, 2), [fix(20, 2, 'b', 0.05)]);
    expect(c.has('b')).toBe(true);
  });

  it('lets a tracker go once it is no longer beside the leader', () => {
    const c = new Convoy(tuning);
    c.observe(fix(10, 0), [fix(10, 0, 'b')]);
    c.observe(fix(20, 1), [fix(20, 1, 'b')]);
    c.observe(fix(30, 2), [fix(20, 2, 'b')]);
    expect(c.has('b')).toBe(false);
  });

  it('never takes in a tracker that stood still where the leader arrived', () => {
    const c = new Convoy(tuning);
    c.observe(fix(10, 0), [fix(20, 0, 'b')]);
    c.observe(fix(20, 1), [fix(20, 1, 'b')]);
    c.observe(fix(20, 2), [fix(20, 2, 'b')]);
    expect(c.has('b')).toBe(false);
  });

  it('needs the tracker beside the leader on the poll before, not only now', () => {
    const c = new Convoy(tuning);
    c.observe(fix(10, 0), [fix(30, 0, 'b')]);
    c.observe(fix(20, 1), [fix(20, 1, 'b')]);
    expect(c.has('b')).toBe(false);
  });
});
