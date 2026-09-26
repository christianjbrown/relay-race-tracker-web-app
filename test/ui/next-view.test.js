import { resolveColours } from '../../src/config/colours.js';
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { NextView } from '../../src/ui/next-view.js';
import { Elements } from '../../src/ui/dom.js';
import { makeBadges } from '../../src/ui/badges.js';
import { LOCALES } from '../../src/i18n/locales/index.js';
import { Formats } from '../../src/i18n/formats.js';
import { SegmentDescriber } from '../../src/i18n/segment-describer.js';
import { makeRelay, at } from '../fixtures/relay.js';

// A palette of the site's own, to show the views use what they are given.
const COLOURS = resolveColours({ run: '#123456', drive: '#234567', sleep: '#345678', free: '#456789' });

function makeView() {
  document.body.innerHTML = '<p id="next" hidden></p>';
  const els = new Elements(document);
  const words = LOCALES.en.words({ name: 'Sam', vehicle: 'bus' });
  const formats = new Formats('en-GB', 'Europe/Brussels', words);
  const badges = makeBadges('🏃', 'bus');
  const { schedule, states } = makeRelay();
  const describer = new SegmentDescriber(words, formats, 'en');
  return { view: new NextView(els, words, formats, badges, describer, schedule, COLOURS), els, words, badges, schedule, states };
}

describe('NextView', () => {
  it('shows the first segment before the relay starts, with its planned time', () => {
    const { view, els, words, badges, schedule } = makeView();
    const now = at(-30);
    view.render(now, { seg: null, state: 'before' }, null);
    expect(els.get('next').hidden).toBe(false);
    expect(els.get('next').style.getPropertyValue('--dot')).toBe(COLOURS[schedule.first.kind]);
    expect(els.get('next').innerHTML).toContain(words.kinds.run);
    expect(els.get('next').innerHTML).toContain(badges.run);
    expect(els.get('next').innerHTML).toContain('<span class="next-where">');
  });

  it('hides after the relay finishes, with nothing next', () => {
    const { view, els } = makeView();
    view.render(at(1000), { seg: null, state: 'finished' }, null);
    expect(els.get('next').hidden).toBe(true);
  });

  it('while waiting, the next thing is the leg itself', () => {
    const { view, els, words, schedule } = makeView();
    const seg = schedule.segments[4];
    view.render(at(235), { seg, state: 'waiting' }, null);
    expect(els.get('next').innerHTML).toContain(words.kinds.run);
  });

  it('otherwise the next thing is whatever follows the current segment', () => {
    const { view, els, words, schedule } = makeView();
    const seg = schedule.segments[0];
    view.render(at(10), { seg, state: 'running' }, null);
    // segment after leg 1 is the drive to the hotel
    expect(els.get('next').innerHTML).toContain(words.kinds.drive);
  });

  it('uses an arrival estimate over the planned time when given one', () => {
    const { view, els, schedule } = makeView();
    const seg = schedule.segments[0];
    const arrival = at(250);
    view.render(at(245), { seg, state: 'running' }, arrival);
    expect(els.get('next').innerHTML).toContain('~');
  });

  it('shows nothing for the time when the next segment has already started', () => {
    const { view, els, schedule } = makeView();
    // the drive after leg 1 starts at minute 60; ask after that
    const seg = schedule.segments[0];
    view.render(at(65), { seg, state: 'overrun' }, null);
    expect(els.get('next').innerHTML).toContain('Next: <strong>');
    expect(els.get('next').innerHTML).not.toContain(' at ');
  });
});
