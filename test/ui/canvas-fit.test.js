import { describe, expect, it, vi } from 'vitest';
import { CanvasFit } from '../../src/ui/canvas-fit.js';

describe('CanvasFit', () => {
  const ctx = () => ({ setTransform: vi.fn() });

  it('sizes the canvas in device pixels and draws in CSS pixels', () => {
    const canvas = { clientWidth: 375, clientHeight: 812 };
    const c = ctx();
    const fit = new CanvasFit(canvas, { devicePixelRatio: 2 });
    expect(fit.fit(c)).toBe(true);
    expect([canvas.width, canvas.height]).toEqual([750, 1624]);
    expect([fit.width, fit.height]).toEqual([375, 812]);
    expect(c.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('leaves the canvas alone until the size it is shown at changes', () => {
    const canvas = { clientWidth: 300, clientHeight: 600 };
    const c = ctx();
    const fit = new CanvasFit(canvas, { devicePixelRatio: 1 });
    fit.fit(c);
    expect(fit.fit(c)).toBe(false);
    canvas.clientHeight = 500;
    expect(fit.fit(c)).toBe(true);
    canvas.clientWidth = 400;
    expect(fit.fit(c)).toBe(true);
    expect(c.setTransform).toHaveBeenCalledTimes(3);
  });

  it('falls back on the window before the canvas is laid out, and on a pixel ratio of one', () => {
    const canvas = { clientWidth: 0, clientHeight: 0 };
    const fit = new CanvasFit(canvas, { innerWidth: 400, innerHeight: 800 });
    fit.fit(ctx());
    expect([canvas.width, canvas.height]).toEqual([400, 800]);
  });
});
