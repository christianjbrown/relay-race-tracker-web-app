import { timelinePosition } from '../domain/activity-states.js';
import { escapeHtml } from './escape-html.js';
import { COLOURS } from './theme.js';

/** The whole schedule, with what is done, what is now and what is still to come. */
export class TimelineView {
  constructor(els, words, formats, badges, describer, schedule) {
    this.els = els;
    this.words = words;
    this.formats = formats;
    this.badges = badges;
    this.describer = describer;
    this.schedule = schedule;
  }

  render(act) {
    const segs = this.schedule.segments;
    const nowAt = timelinePosition(act, segs.length);
    this.els.get('schedule-title').textContent = this.words.scheduleTitle(this.formats.zoneName(this.schedule.first.start));
    this.els.get('timeline').replaceChildren(...segs.map((seg, i) => this.item(seg, i, nowAt)));
  }

  item(seg, i, nowAt) {
    const li = this.els.create('li');
    li.style.setProperty('--dot', COLOURS[seg.kind]);
    if (i === nowAt) li.className = 'now';
    else if (i < nowAt) li.className = 'past';
    const when = `${this.formats.dayTime(seg.start)}–${this.formats.time(seg.end)}`;
    li.innerHTML = `<span class="when">${escapeHtml(when)}</span>`
      + `<span class="what">${this.badges[seg.kind]} ${escapeHtml(this.words.kinds[seg.kind])}</span>`
      + `<span class="where">${escapeHtml(this.describer.describe(seg))}</span>`;
    return li;
  }
}
