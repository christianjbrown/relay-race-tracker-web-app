// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { SchedulePanel } from '../../src/ui/schedule-panel.js';
import { Elements } from '../../src/ui/dom.js';

function makePanel() {
  document.body.innerHTML = `
    <section id="card"></section>
    <button id="schedule-toggle" aria-expanded="false"></button>
    <div id="schedule" hidden><li class="now"></li></div>
  `;
  const els = new Elements(document);
  return { panel: new SchedulePanel(els), els };
}

describe('SchedulePanel', () => {
  it('starts closed', () => {
    const { panel } = makePanel();
    expect(panel.isOpen()).toBe(false);
  });

  it('opens, expands the card and scrolls the current item into view', () => {
    const { panel, els } = makePanel();
    const now = els.get('schedule').querySelector('.now');
    let scrolled = false;
    now.scrollIntoView = () => { scrolled = true; };
    panel.show(true);
    expect(panel.isOpen()).toBe(true);
    expect(els.get('card').classList.contains('expanded')).toBe(true);
    expect(els.get('schedule-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(scrolled).toBe(true);
  });

  it('does nothing to scroll when there is no current item', () => {
    const { panel, els } = makePanel();
    els.get('schedule').querySelector('.now').remove();
    expect(() => panel.show(true)).not.toThrow();
  });

  it('closes and collapses the card', () => {
    const { panel, els } = makePanel();
    panel.show(true);
    panel.show(false);
    expect(panel.isOpen()).toBe(false);
    expect(els.get('card').classList.contains('expanded')).toBe(false);
    expect(els.get('schedule-toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles open state on a click of the toggle button', () => {
    const { panel, els } = makePanel();
    panel.bind();
    els.get('schedule-toggle').click();
    expect(panel.isOpen()).toBe(true);
    els.get('schedule-toggle').click();
    expect(panel.isOpen()).toBe(false);
  });
});
