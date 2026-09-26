import { describe, expect, it } from 'vitest';
import { LegFinish } from '../../src/domain/leg-finish.js';
import { at, KM_PER_POINT, makeRelay } from '../fixtures/relay.js';

describe('LegFinish', () => {
  const { schedule, course, states } = makeRelay();
  const leg = schedule.segments[0];
  const pace = (watched, kmh = 10) => ({ watched: () => watched, kmh: () => kmh });

  it('says nothing off a leg, or before the page has watched long enough', () => {
    const finish = new LegFinish(course, pace(true));
    expect(finish.at(at(100), states.of(schedule.segments[2], 'planned'))).toBeNull();
    expect(finish.at(at(10), states.of(leg, 'planned'))).toBeNull();
    expect(finish.at(at(10), states.of(leg, 'waiting', { at: 5 }))).toBeNull();
    expect(new LegFinish(course, pace(false)).at(at(10), states.of(leg, 'running', { at: 5, end: 100 }))).toBeNull();
    expect(finish.at(at(10), states.of(leg, 'running', {}))).toBeNull();
  });

  it('times what is left of the leg at the blended pace', () => {
    const finish = new LegFinish(course, pace(true, 10));
    const running = finish.at(at(10), states.of(leg, 'running', { at: 10, end: 100 }));
    expect(running.getTime()).toBeCloseTo(at(10).getTime() + ((90 * KM_PER_POINT) / 10) * 3600000, -2);
    const overrun = finish.at(at(70), states.of(leg, 'overrun', { at: 90 }));
    expect(overrun.getTime()).toBeCloseTo(at(70).getTime() + ((10 * KM_PER_POINT) / 10) * 3600000, -2);
  });

  it('asks the pace for a blend with the leg\'s own planned pace', () => {
    let asked = null;
    const finish = new LegFinish(course, { watched: () => true, kmh: (planned) => { asked = planned; return 10; } });
    finish.at(at(10), states.of(leg, 'running', { at: 10, end: 100 }));
    expect(asked).toBeCloseTo(100 * KM_PER_POINT, 2);
  });

  it('never gives a finish before now', () => {
    const finish = new LegFinish(course, pace(true, 10));
    expect(finish.at(at(10), states.of(leg, 'running', { at: 110, end: 100 }))).toEqual(at(10));
  });
});
