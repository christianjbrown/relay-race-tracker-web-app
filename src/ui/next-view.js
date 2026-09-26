import { escapeHtml } from './escape-html.js';
import { COLOURS } from './theme.js';

/** The next thing on the timeline, and when. Before the start, that is the first segment. */
export class NextView {
  constructor(els, words, formats, badges, describer, schedule) {
    this.els = els;
    this.words = words;
    this.formats = formats;
    this.badges = badges;
    this.describer = describer;
    this.schedule = schedule;
  }

  /** `arrival`, when known, is when the next thing really starts: the vehicle arriving, the runner coming in. */
  render(now, act, arrival) {
    const next = this.next(act);
    const el = this.els.get('next');
    el.hidden = !next;
    if (!next) return;
    el.style.setProperty('--dot', COLOURS[next.kind]);
    // Otherwise a late leg can push it past its planned time, and then
    // there is no honest time to give.
    const t = arrival ? `~${escapeHtml(this.formats.when(arrival, now))}`
      : next.start > now ? escapeHtml(this.formats.when(next.start, now)) : null;
    el.innerHTML = this.words.nextUp(`${this.badges[next.kind]} ${escapeHtml(this.words.kinds[next.kind])}`, t)
      + `<span class="next-where">${escapeHtml(this.describer.describe(next))}</span>`;
  }

  next({ seg, state }) {
    if (state === 'before') return this.schedule.first;
    if (state === 'finished') return null;
    // Waiting, the next thing is the leg itself, when the runner arrives.
    return state === 'waiting' ? seg : this.schedule.after(seg);
  }
}
