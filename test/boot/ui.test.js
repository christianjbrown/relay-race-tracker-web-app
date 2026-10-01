// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { buildCard, buildCelebration } from '../../src/boot/ui.js';
import { BODY, assemble } from '../fakes/page.js';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = BODY;
});

describe('buildUi', () => {
  it('makes the card and the parts around it, ready to render from the clock alone', async () => {
    const p = await assemble(undefined, { withMap: false });
    const { ui, clock, timeline } = p;
    for (const key of ['els', 'describer', 'badges', 'birthday', 'schedulePanel', 'streetView', 'celebration', 'rewind', 'card', 'badgeChoice']) {
      expect(ui[key]).toBeTruthy();
    }
    ui.card.render(clock.now(), null, timeline.plannedActivity.at(clock.now()));
    expect(document.getElementById('headline').textContent).not.toBe('');
  });
});

describe('buildCard', () => {
  it('builds a card from the parts it is given', async () => {
    const p = await assemble(undefined, { withMap: false });
    const { ui, config, language, timeline } = p;
    const card = buildCard(ui.els, {
      words: language.words, formats: language.formats, badges: ui.badges, describer: ui.describer,
      schedule: timeline.schedule, course: timeline.course, config, birthday: ui.birthday,
      streetView: ui.streetView, celebration: ui.celebration, rewind: ui.rewind,
    });
    expect(typeof card.render).toBe('function');
  });
});

describe('buildCelebration', () => {
  it('binds the celebration to the page', async () => {
    const p = await assemble(undefined, { withMap: false });
    const celebration = buildCelebration(p.win, p.ui.els, {
      words: p.language.words, formats: p.language.formats, schedule: p.timeline.schedule, config: p.config,
    });
    expect(typeof celebration.bind).toBe('function');
  });
});
