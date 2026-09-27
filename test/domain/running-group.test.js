import { describe, expect, it } from 'vitest';
import { RunningGroup } from '../../src/domain/running-group.js';

const now = new Date('2027-05-15T10:00:00Z');
const fix = { lat: 1, lng: 2, time: new Date('2027-05-15T09:55:00Z') };
const group = new RunningGroup({ staleMs: 15 * 60 * 1000 });

describe('RunningGroup', () => {
  it.each(['drive', 'sleep', 'free'])('shows the runner tracker while ours is on a %s', (kind) => {
    expect(group.where({ kind, state: 'planned' }, fix, now)).toBe(fix);
  });

  it('shows the runner coming in while ours waits to take over', () => {
    expect(group.where({ kind: 'run', state: 'waiting' }, fix, now)).toBe(fix);
  });

  it('shows nothing while ours is on a leg with the tracker', () => {
    expect(group.where({ kind: 'run', state: 'running' }, fix, now)).toBeNull();
  });

  it.each(['before', 'finished'])('shows nothing %s the relay', (state) => {
    expect(group.where({ kind: null, state }, fix, now)).toBeNull();
  });

  it('shows nothing without a fix', () => {
    expect(group.where({ kind: 'sleep', state: 'planned' }, null, now)).toBeNull();
  });

  it('shows nothing when the fix is stale', () => {
    const old = { ...fix, time: new Date('2027-05-15T09:40:00Z') };
    expect(group.where({ kind: 'sleep', state: 'planned' }, old, now)).toBeNull();
  });
});
