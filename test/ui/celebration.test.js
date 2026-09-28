// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { Celebration } from '../../src/ui/celebration.js';
import { Elements } from '../../src/ui/dom.js';

describe('Celebration', () => {
  const make = () => {
    document.body.innerHTML = '<div id="celebration" hidden><h2 id="celebration-title"></h2><p id="celebration-text"></p><button id="celebration-close"></button></div>';
    const message = { title: () => 'Well done, Sam!', text: () => '232.9 km across 3 days', close: () => 'Back' };
    const fireworks = { start: vi.fn(), stop: vi.fn() };
    const c = new Celebration(new Elements(document), message, fireworks);
    c.bind();
    return { c, fireworks, box: document.getElementById('celebration') };
  };

  it('waits for the finish', () => {
    const { c, fireworks, box } = make();
    c.render({ state: 'planned' });
    expect(box.hidden).toBe(true);
    expect(fireworks.start).not.toHaveBeenCalled();
  });

  it('congratulates the team once, with fireworks, and goes away when closed', () => {
    const { c, fireworks, box } = make();
    c.render({ state: 'finished' });
    expect(box.hidden).toBe(false);
    expect(document.getElementById('celebration-title').textContent).toBe('Well done, Sam!');
    expect(document.getElementById('celebration-text').textContent).toBe('232.9 km across 3 days');
    expect(document.getElementById('celebration-close').textContent).toBe('Back');
    expect(fireworks.start).toHaveBeenCalledTimes(1);

    document.getElementById('celebration-close').click();
    expect(box.hidden).toBe(true);
    expect(fireworks.stop).toHaveBeenCalled();

    c.render({ state: 'finished' });
    expect(box.hidden).toBe(true);
    expect(fireworks.start).toHaveBeenCalledTimes(1);
  });
});
