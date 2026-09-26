/** The schedule, folded away under the card until it is asked for. */
export class SchedulePanel {
  constructor(els) {
    this.els = els;
  }

  bind() {
    this.els.get('schedule-toggle').addEventListener('click', () => this.show(!this.isOpen()));
  }

  isOpen() {
    return !this.els.get('schedule').hidden;
  }

  show(open) {
    const box = this.els.get('schedule');
    box.hidden = !open;
    this.els.get('card').classList.toggle('expanded', open);
    this.els.get('schedule-toggle').setAttribute('aria-expanded', String(open));
    if (open) box.querySelector('.now')?.scrollIntoView({ block: 'nearest' });
  }
}
