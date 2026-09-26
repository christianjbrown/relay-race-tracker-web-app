import { COLOURS, KINDS } from './theme.js';

/** The card's fixed words, in the reader's language, and the legend. */
export class CardLabels {
  constructor(els, words, lang, theme) {
    this.els = els;
    this.words = words;
    this.lang = lang;
    this.theme = theme;
  }

  render() {
    const w = this.words;
    this.els.doc.documentElement.lang = this.lang;
    this.els.doc.title = w.title;
    this.els.get('map').setAttribute('aria-label', w.mapLabel);
    this.els.get('centre').textContent = w.follow;
    this.els.get('overview').textContent = w.overview;
    this.els.get('schedule-toggle').textContent = w.schedule;
    this.els.get('toggle').setAttribute('aria-label', w.sheet);
    this.els.get('headline').textContent = w.headline.finding;

    const legend = this.els.get('legend');
    legend.replaceChildren(
      ...KINDS.map((kind) => this.dot(COLOURS[kind], w.kinds[kind])),
      this.dot(this.theme.course, w.course),
    );
    const planned = this.dot('transparent', w.planned);
    planned.className = 'planned';
    legend.appendChild(planned);
  }

  dot(colour, text) {
    const el = this.els.create('li');
    el.style.setProperty('--dot', colour);
    el.textContent = text;
    return el;
  }
}
