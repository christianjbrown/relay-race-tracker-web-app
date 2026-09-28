import { describe, expect, it, vi } from 'vitest';
import { RelayEnd } from '../../src/domain/relay-end.js';
import { at, fixAt, makeRelay } from '../fixtures/relay.js';

describe('RelayEnd', () => {
  const make = (state) => {
    const { schedule, states, tuning } = makeRelay();
    const inner = { at: vi.fn(() => ({ state })) };
    return { ending: new RelayEnd(inner, schedule, states, tuning), inner };
  };

  it('passes the activity through while the relay is going on', () => {
    const { ending, inner } = make('running');
    const fixes = { runner: fixAt(490, at(340)) };
    expect(ending.at(at(340), fixes)).toEqual({ state: 'running' });
    expect(inner.at).toHaveBeenCalledWith(at(340), fixes);
    expect(ending.over).toBe(false);
  });

  it('is over once finished with the runner tracker fresh, and stays finished whatever the trackers say', () => {
    const { ending, inner } = make('finished');
    ending.at(at(350), { runner: fixAt(500, at(350)) });
    expect(ending.over).toBe(true);
    inner.at.mockReturnValue({ state: 'waiting' });
    expect(ending.at(at(360), { runner: fixAt(300, at(360)) })).toMatchObject({ seg: null, state: 'finished' });
    expect(inner.at).toHaveBeenCalledTimes(1);
  });

  it('does not trust a finish seen only because the runner tracker went quiet', () => {
    const { ending } = make('finished');
    ending.at(at(350), { runner: fixAt(500, at(350), 20) });
    expect(ending.over).toBe(false);
    ending.at(at(350));
    expect(ending.over).toBe(false);
  });

  it('is over without the trackers once the timeline is long past its end', () => {
    const { ending } = make('finished');
    ending.at(at(345 + 30));
    expect(ending.over).toBe(false);
    ending.at(at(345 + 4 * 60));
    expect(ending.over).toBe(true);
  });

  it('takes the relay as over, without asking the trackers, on a page first opened an hour after the end', () => {
    const { ending, inner } = make('waiting');
    expect(ending.at(at(345 + 60), { runner: fixAt(300, at(405)) })).toMatchObject({ seg: null, state: 'finished' });
    expect(inner.at).not.toHaveBeenCalled();
    expect(ending.over).toBe(true);
  });

  it('keeps following a late finish it has watched going on, past the hour', () => {
    const { ending, inner } = make('waiting');
    ending.at(at(345 + 30), { runner: fixAt(400, at(375)) });
    expect(ending.at(at(345 + 90), { runner: fixAt(470, at(435)) })).toEqual({ state: 'waiting' });
    expect(ending.over).toBe(false);
    inner.at.mockReturnValue({ state: 'finished' });
    ending.at(at(345 + 110), { runner: fixAt(500, at(455)) });
    expect(ending.over).toBe(true);
  });
});
