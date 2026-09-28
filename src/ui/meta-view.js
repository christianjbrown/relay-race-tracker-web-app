/** How fresh the position is: live GPS and how old, projected, estimated, or none yet. */
export class MetaView {
  constructor(els, words, formats, staleMs) {
    this.els = els;
    this.words = words;
    this.formats = formats;
    this.staleMs = staleMs;
  }

  render(now, fix, { state }) {
    // After the finish nothing is live any more, so there is no GPS to
    // report and nothing still to come.
    const over = state === 'finished';
    const meta = this.els.get('meta');
    meta.hidden = over;
    this.els.get('legend').querySelector('.planned').hidden = over;
    if (over) return;
    const stale = Boolean(fix && !fix.estimated && now - fix.time > this.staleMs);
    meta.textContent = this.text(now, fix, stale);
    meta.classList.toggle('stale', stale || !fix || Boolean(!fix.replayed && (fix.estimated || fix.projected)));
  }

  text(now, fix, stale) {
    const w = this.words;
    if (!fix) return w.noFix;
    if (fix.replayed) return w.replaying;
    if (fix.estimated) return w.estimated;
    if (fix.projected) return w.projected(this.formats.when(fix.projected.since, now), this.formats.kmFixed(fix.projected.kmh));
    return w.lastFix(this.formats.ago(fix.time, now)) + (stale ? ` – ${w.stale}` : '');
  }
}
