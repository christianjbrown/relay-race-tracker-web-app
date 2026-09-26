// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { MetaView } from '../../src/ui/meta-view.js';
import { Elements } from '../../src/ui/dom.js';
import { LOCALES } from '../../src/i18n/locales/index.js';
import { Formats } from '../../src/i18n/formats.js';
import { at, fixAt } from '../fixtures/relay.js';

const STALE_MS = 5 * 60 * 1000;

function makeView() {
  document.body.innerHTML = '<p id="meta"></p><ul id="legend"><li class="planned"></li></ul>';
  const els = new Elements(document);
  const words = LOCALES.en.words({ name: 'Sam', vehicle: 'bus' });
  const formats = new Formats('en-GB', 'Europe/Brussels', words);
  return { view: new MetaView(els, words, formats, STALE_MS), els, words };
}

describe('MetaView', () => {
  it('hides the meta line and the planned legend entry once finished', () => {
    const { view, els } = makeView();
    view.render(at(1000), null, { state: 'finished' });
    expect(els.get('meta').hidden).toBe(true);
    expect(els.get('legend').querySelector('.planned').hidden).toBe(true);
  });

  it('shows the meta line and legend entry while still going', () => {
    const { view, els } = makeView();
    view.render(at(10), fixAt(10, at(10)), { state: 'running' });
    expect(els.get('meta').hidden).toBe(false);
    expect(els.get('legend').querySelector('.planned').hidden).toBe(false);
  });

  it('reports no GPS position yet', () => {
    const { view, els, words } = makeView();
    view.render(at(10), null, { state: 'running' });
    expect(els.get('meta').textContent).toBe(words.noFix);
    expect(els.get('meta').classList.contains('stale')).toBe(true);
  });

  it('reports an estimated position', () => {
    const { view, els, words } = makeView();
    const fix = { ...fixAt(10, at(10)), estimated: true };
    view.render(at(10), fix, { state: 'running' });
    expect(els.get('meta').textContent).toBe(words.estimated);
    expect(els.get('meta').classList.contains('stale')).toBe(true);
  });

  it('reports a fresh GPS fix with no stale warning', () => {
    const { view, els, words } = makeView();
    const now = at(10);
    const fix = fixAt(10, now, 1);
    view.render(now, fix, { state: 'running' });
    expect(els.get('meta').textContent).toBe(words.lastFix(formatsAgo(now, fix)));
    expect(els.get('meta').classList.contains('stale')).toBe(false);
  });

  it('reports a stale GPS fix with a warning', () => {
    const { view, els, words } = makeView();
    const now = at(10);
    const fix = fixAt(10, now, 10);
    view.render(now, fix, { state: 'running' });
    expect(els.get('meta').textContent).toBe(`${words.lastFix(formatsAgo(now, fix))} – ${words.stale}`);
    expect(els.get('meta').classList.contains('stale')).toBe(true);
  });
});

function formatsAgo(now, fix) {
  const formats = new Formats('en-GB', 'Europe/Brussels', {});
  return formats.ago(fix.time, now);
}
