// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { StatusView } from '../../src/ui/status-view.js';
import { Elements } from '../../src/ui/dom.js';
import { makeBadges } from '../../src/ui/badges.js';
import { Birthday } from '../../src/ui/birthday.js';
import { LOCALES } from '../../src/i18n/locales/index.js';
import { Formats } from '../../src/i18n/formats.js';
import { SegmentDescriber } from '../../src/i18n/segment-describer.js';
import { makeRelay, at } from '../fixtures/relay.js';

function makeView(monthDay) {
  document.body.innerHTML = '<h1 id="headline"></h1><p id="detail"></p><p id="birthday" hidden></p>';
  const els = new Elements(document);
  const words = LOCALES.en.words({ name: 'Sam', vehicle: 'bus' });
  const formats = new Formats('en-GB', 'Europe/Brussels', words);
  const badges = makeBadges('🏃', 'bus');
  const describer = new SegmentDescriber(words, formats, 'en');
  const birthday = new Birthday(monthDay, formats);
  return { view: new StatusView(els, words, badges, describer, birthday), els, words, badges };
}

describe('StatusView', () => {
  it('shows the before-start headline with no detail', () => {
    const { view, els, words } = makeView(null);
    const { schedule, states } = makeRelay();
    view.render(at(-10), states.outside(at(-10)));
    expect(els.get('headline').textContent).toBe(words.headline.before);
    expect(els.get('detail').hidden).toBe(true);
    expect(schedule).toBeTruthy();
  });

  it('shows the finished headline with the finish badge', () => {
    const { view, els, words, badges } = makeView(null);
    const { states } = makeRelay();
    view.render(at(1000), states.outside(at(1000)));
    expect(els.get('headline').textContent).toBe(`${words.headline.after} ${badges.finished}`);
  });

  it('shows the waiting headline and detail', () => {
    const { view, els, words, badges } = makeView(null);
    const { schedule, states } = makeRelay();
    const seg = schedule.segments[4];
    const act = states.of(seg, 'waiting', {});
    view.render(at(235), act);
    expect(els.get('headline').textContent).toBe(`${words.headline.waiting} ${badges.drive}`);
    expect(els.get('detail').textContent).toBe(words.waitingDetail('Leg 2 · Town B → Town C · 11.1 km'));
    expect(els.get('detail').hidden).toBe(false);
  });

  it('shows a running leg\'s headline and detail', () => {
    const { view, els, words, badges } = makeView(null);
    const { schedule, states } = makeRelay();
    const seg = schedule.segments[0];
    const act = states.of(seg, 'running', {});
    view.render(at(10), act);
    expect(els.get('headline').textContent).toBe(`${words.headline.run} ${badges.run}`);
    expect(els.get('detail').textContent).toBe('Leg 1 · Start → Town A · 11.1 km');
  });

  it('shows a drive headline using the drive kind', () => {
    const { view, els, words, badges } = makeView(null);
    const { schedule, states } = makeRelay();
    const seg = schedule.segments[1];
    const act = states.of(seg, 'planned', {});
    view.render(at(70), act);
    expect(els.get('headline').textContent).toBe(`${words.headline.drive} ${badges.drive}`);
  });

  it('shows the birthday banner on the runner\'s birthday', () => {
    const { view, els, words } = makeView('05-15');
    const { states } = makeRelay();
    view.render(new Date('2027-05-15T09:00:00+02:00'), states.outside(new Date('2027-05-15T09:00:00+02:00')));
    expect(els.get('birthday').hidden).toBe(false);
    expect(els.get('birthday').textContent).toBe(`🎂 ${words.birthday} 🎉`);
  });

  it('hides the birthday banner on any other day', () => {
    const { view, els } = makeView('05-15');
    const { states } = makeRelay();
    view.render(new Date('2027-05-16T09:00:00+02:00'), states.outside(new Date('2027-05-16T09:00:00+02:00')));
    expect(els.get('birthday').hidden).toBe(true);
  });
});
