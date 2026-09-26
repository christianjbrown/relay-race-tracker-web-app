import { describe, expect, it } from 'vitest';
import { PageClock } from '../../src/services/page-clock.js';

describe('PageClock', () => {
  const real = Date.parse('2026-01-01T00:00:00Z');
  const now = () => real;

  it('tells the real time without ?at=', () => {
    expect(PageClock.fromSearch('', 'Europe/Brussels', now).now()).toEqual(new Date(real));
    expect(new PageClock(now).now()).toEqual(new Date(real));
  });

  it('previews the moment ?at= names, in the event\'s time zone', () => {
    const clock = PageClock.fromSearch('?at=2027-05-15T04:30', 'Europe/Brussels', now);
    expect(clock.now()).toEqual(new Date('2027-05-15T02:30:00Z'));
  });

  it('keeps moving from the previewed moment', () => {
    let t = real;
    const clock = PageClock.fromSearch('?at=2027-05-15T04:30', 'Europe/Brussels', () => t);
    t += 60000;
    expect(clock.now()).toEqual(new Date('2027-05-15T02:31:00Z'));
  });

  it('ignores an ?at= that is not a time', () => {
    expect(PageClock.fromSearch('?at=later', 'Europe/Brussels', now).now()).toEqual(new Date(real));
  });
});
