// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildView } from '../../src/boot/view.js';
import { BODY, assemble } from '../fakes/page.js';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = BODY;
});

describe('buildView', () => {
  it('frames the map around the card and puts the view on the stage', async () => {
    const p = await assemble();
    const screen = { attach: vi.fn(), where: vi.fn() };
    p.stage.screen = screen;
    const { view, sheet, controls } = buildView(p.win, p);
    expect(p.stage.view).toBe(view);
    expect(screen.attach).toHaveBeenCalledWith(view, sheet);
    expect(typeof controls.watchCard).toBe('function');
  });
});
