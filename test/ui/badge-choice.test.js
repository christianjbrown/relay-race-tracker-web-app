import { describe, expect, it } from 'vitest';
import { BadgeChoice } from '../../src/ui/badge-choice.js';

const choice = new BadgeChoice();

describe('BadgeChoice', () => {
  it('shows the finish flag once the relay is over', () => {
    expect(choice.of({ kind: null, state: 'finished' })).toBe('finished');
  });

  it('shows the vehicle while the runner waits in it to take over', () => {
    expect(choice.of({ kind: 'run', state: 'waiting' })).toBe('drive');
  });

  it('shows no badge before the start', () => {
    expect(choice.of({ kind: null, state: 'before' })).toBeNull();
  });

  it('shows what the runner is doing in any other state', () => {
    expect(choice.of({ kind: 'sleep', state: 'planned' })).toBe('sleep');
    expect(choice.of({ kind: 'run', state: 'running' })).toBe('run');
  });
});
