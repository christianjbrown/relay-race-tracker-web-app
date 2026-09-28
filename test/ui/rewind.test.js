// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { Elements } from '../../src/ui/dom.js';
import { Rewind } from '../../src/ui/rewind.js';
import { at, makeRelay } from '../fixtures/relay.js';

describe('Rewind', () => {
  const make = () => {
    document.body.innerHTML = '<div id="rewind" hidden><label id="rewind-label"></label><input id="rewind-range" type="range"><span id="rewind-time"></span><button id="rewind-live" hidden></button></div>';
    const { schedule } = makeRelay(); // 0 to 345 minutes after T0
    const words = { rewind: 'Rewind', rewindEnd: 'Back to the finish' };
    const formats = { dayTime: (d) => `at ${d.toISOString()}` };
    const rewind = new Rewind(new Elements(document), words, formats, schedule);
    rewind.bind();
    const heard = vi.fn();
    rewind.listen(heard);
    const get = (id) => document.getElementById(id);
    return { rewind, heard, get };
  };
  const slide = (get, value) => {
    get('rewind-range').value = String(value);
    get('rewind-range').dispatchEvent(new Event('input'));
  };

  it('starts at the end, showing the present, with its words in place', () => {
    const { rewind, get } = make();
    expect(rewind.time).toBeNull();
    expect(get('rewind-range').value).toBe('1000');
    expect(get('rewind-label').textContent).toBe('Rewind');
    expect(get('rewind-live').textContent).toBe('Back to the finish');
  });

  it('comes up the first time the relay is shown finished, and not before', () => {
    const { rewind, get } = make();
    rewind.render({ state: 'running' });
    expect(get('rewind').hidden).toBe(true);
    rewind.render({ state: 'finished' });
    expect(get('rewind').hidden).toBe(false);
    get('rewind').hidden = true;
    rewind.render({ state: 'finished' });
    expect(get('rewind').hidden).toBe(true);
  });

  it('picks a moment across the whole timeline, to the minute, and says when', () => {
    const { rewind, heard, get } = make();
    slide(get, 500);
    expect(rewind.time).toEqual(at(173));
    expect(get('rewind-time').textContent).toBe(`at ${at(173).toISOString()}`);
    expect(get('rewind-live').hidden).toBe(false);
    expect(heard).toHaveBeenCalledTimes(1);
    expect(rewind.timeAt(0)).toEqual(at(0));
    expect(rewind.timeAt(1000)).toEqual(at(345));
  });

  it('goes back to the present from the button', () => {
    const { rewind, heard, get } = make();
    slide(get, 200);
    get('rewind-live').click();
    expect(rewind.time).toBeNull();
    expect(get('rewind-range').value).toBe('1000');
    expect(get('rewind-time').textContent).toBe('');
    expect(get('rewind-live').hidden).toBe(true);
    expect(heard).toHaveBeenCalledTimes(2);
  });
});
