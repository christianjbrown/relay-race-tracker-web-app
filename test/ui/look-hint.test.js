// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { Elements } from '../../src/ui/dom.js';
import { LookHint } from '../../src/ui/look-hint.js';

describe('LookHint', () => {
  const words = { lookAround: 'Tap Sam on the map to look around in Street View' };
  const make = (url) => {
    document.body.innerHTML = '<p id="look" hidden></p>';
    const streetView = { of: vi.fn(() => url) };
    return { hint: new LookHint(new Elements(document), words, streetView), streetView, el: document.getElementById('look') };
  };

  it('shows the hint while the runner\'s face opens Street View', () => {
    const { hint, streetView, el } = make('https://street.view');
    const fix = { lat: 1, lng: 2 };
    const act = { kind: 'run' };
    hint.render(fix, act);
    expect(streetView.of).toHaveBeenCalledWith(act, fix);
    expect(el.hidden).toBe(false);
    expect(el.textContent).toBe(words.lookAround);
  });

  it('hides it when there is nothing to look at', () => {
    const { hint, el } = make(null);
    hint.render(null, { kind: 'sleep' });
    expect(el.hidden).toBe(true);
  });
});
