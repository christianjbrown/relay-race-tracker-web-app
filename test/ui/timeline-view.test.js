import { resolveColours } from '../../src/config/colours.js';
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { TimelineView } from '../../src/ui/timeline-view.js';
import { Elements } from '../../src/ui/dom.js';
import { makeBadges } from '../../src/ui/badges.js';
import { LOCALES } from '../../src/i18n/locales/index.js';
import { Formats } from '../../src/i18n/formats.js';
import { SegmentDescriber } from '../../src/i18n/segment-describer.js';
import { makeRelay } from '../fixtures/relay.js';

// A palette of the site's own, to show the views use what they are given.
const COLOURS = resolveColours({ run: '#123456', drive: '#234567', sleep: '#345678', free: '#456789' });

function makeView() {
  document.body.innerHTML = '<h2 id="schedule-title"></h2><ol id="timeline"></ol>';
  const els = new Elements(document);
  const words = LOCALES.en.words({ name: 'Sam', vehicle: 'bus' });
  const formats = new Formats('en-GB', 'Europe/Brussels', words);
  const badges = makeBadges('🏃', 'bus');
  const { schedule, states } = makeRelay();
  const describer = new SegmentDescriber(words, formats, 'en');
  return { view: new TimelineView(els, words, formats, badges, describer, schedule, COLOURS), els, words, schedule, states, formats };
}

describe('TimelineView', () => {
  it('titles the schedule with the event time zone', () => {
    const { view, els, words, schedule, states, formats } = makeView();
    view.render(states.of(schedule.segments[0], 'running'));
    expect(els.get('schedule-title').textContent).toBe(words.scheduleTitle(formats.zoneName(schedule.first.start)));
  });

  it('lists every segment with its time, kind and place', () => {
    const { view, els, words, schedule, states } = makeView();
    view.render(states.of(schedule.segments[0], 'running'));
    const items = els.get('timeline').children;
    expect(items).toHaveLength(schedule.segments.length);
    const first = items[0];
    expect(first.style.getPropertyValue('--dot')).toBe(COLOURS.run);
    expect(first.querySelector('.what').textContent).toBe(`🏃 ${words.kinds.run}`);
    expect(first.querySelector('.where').textContent).toBe('Leg 1 · Start → Town A · 11.1 km');
  });

  it('marks the current segment as now, earlier ones as past, later ones as neither', () => {
    const { view, els, schedule, states } = makeView();
    view.render(states.of(schedule.segments[2], 'planned'));
    const items = els.get('timeline').children;
    expect(items[0].className).toBe('past');
    expect(items[1].className).toBe('past');
    expect(items[2].className).toBe('now');
    expect(items[3].className).toBe('');
  });

  it('marks nothing as now or past before the relay starts', () => {
    const { view, els, schedule, states } = makeView();
    view.render(states.outside(new Date(schedule.first.start.getTime() - 60000)));
    const items = els.get('timeline').children;
    Array.from(items).forEach((li) => expect(li.className).toBe(''));
  });

  it('marks everything as past once the relay is finished', () => {
    const { view, els, schedule, states } = makeView();
    view.render(states.outside(new Date(schedule.last.end.getTime() + 60000)));
    const items = els.get('timeline').children;
    Array.from(items).forEach((li) => expect(li.className).toBe('past'));
  });
});
