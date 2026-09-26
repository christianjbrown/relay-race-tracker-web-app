/** The card's headline: what the runner is doing, and on which leg or at which stop. */
export class StatusView {
  constructor(els, words, badges, describer, birthday) {
    this.els = els;
    this.words = words;
    this.badges = badges;
    this.describer = describer;
    this.birthday = birthday;
  }

  render(now, { seg, state }) {
    const w = this.words;
    let headline;
    let detail = '';
    if (state === 'before') {
      headline = w.headline.before;
    } else if (state === 'finished') {
      headline = `${w.headline.after} ${this.badges.finished}`;
    } else if (state === 'waiting') {
      headline = `${w.headline.waiting} ${this.badges.drive}`;
      detail = w.waitingDetail(this.describer.describe(seg));
    } else {
      headline = `${w.headline[seg.kind]} ${this.badges[seg.kind]}`;
      detail = this.describer.describe(seg);
    }
    this.els.get('headline').textContent = headline;
    const birthday = this.els.get('birthday');
    birthday.hidden = !this.birthday.on(now);
    birthday.textContent = `🎂 ${w.birthday} 🎉`;
    const el = this.els.get('detail');
    el.textContent = detail;
    el.hidden = !detail;
  }
}
