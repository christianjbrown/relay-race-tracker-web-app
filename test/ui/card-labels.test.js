import { resolveColours } from '../../src/config/colours.js';
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { CardLabels } from '../../src/ui/card-labels.js';
import { Elements } from '../../src/ui/dom.js';
import { KINDS, THEMES } from '../../src/ui/theme.js';
import { LOCALES } from '../../src/i18n/locales/index.js';

// A palette of the site's own, to show the views use what they are given.
const COLOURS = resolveColours({ run: '#123456', drive: '#234567', sleep: '#345678', free: '#456789' });

function cardHtml() {
  return `
    <button id="toggle"></button>
    <h1 id="headline"></h1>
    <div id="map"></div>
    <button id="centre"></button>
    <button id="overview"></button>
    <button id="schedule-toggle"></button>
    <ul id="legend"></ul>
  `;
}

describe('CardLabels', () => {
  it('fills in the page\'s fixed words and the legend', () => {
    document.body.innerHTML = cardHtml();
    const els = new Elements(document);
    const words = LOCALES.en.words({ name: 'Sam', vehicle: 'bus' });
    const labels = new CardLabels(els, words, 'en', THEMES.dark, COLOURS);
    labels.render();

    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe(words.title);
    expect(els.get('map').getAttribute('aria-label')).toBe(words.mapLabel);
    expect(els.get('centre').textContent).toBe(words.follow);
    expect(els.get('overview').textContent).toBe(words.overview);
    expect(els.get('schedule-toggle').textContent).toBe(words.schedule);
    expect(els.get('toggle').getAttribute('aria-label')).toBe(words.sheet);
    expect(els.get('headline').textContent).toBe(words.headline.finding);

    const legend = els.get('legend');
    expect(legend.children).toHaveLength(KINDS.length + 2);
    KINDS.forEach((kind, i) => {
      const li = legend.children[i];
      expect(li.textContent).toBe(words.kinds[kind]);
      expect(li.style.getPropertyValue('--dot')).toBe(COLOURS[kind]);
    });
    const courseDot = legend.children[KINDS.length];
    expect(courseDot.textContent).toBe(words.course);
    expect(courseDot.style.getPropertyValue('--dot')).toBe(THEMES.dark.course);
    const planned = legend.children[KINDS.length + 1];
    expect(planned.textContent).toBe(words.planned);
    expect(planned.className).toBe('planned');
    expect(planned.style.getPropertyValue('--dot')).toBe('transparent');
  });
});
