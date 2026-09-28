import { describe, expect, it, vi } from 'vitest';
import { Fireworks } from '../../src/ui/fireworks.js';

function setUp({ reduced = false, resized = true } = {}) {
  const ctx = {};
  const canvas = { getContext: vi.fn(() => ctx) };
  const frames = [];
  const win = { requestAnimationFrame: vi.fn((f) => frames.push(f)) };
  const parts = {
    show: { reset: vi.fn(), resize: vi.fn(), tick: vi.fn() },
    painter: { paint: vi.fn(), clear: vi.fn() },
    fit: { fit: vi.fn(() => resized), width: 375, height: 812 },
    motion: { reduced: () => reduced },
  };
  return { fireworks: new Fireworks(canvas, win, parts), ctx, canvas, win, frames, ...parts };
}

describe('Fireworks', () => {
  it('stays still for somebody who asked for less motion', () => {
    const { fireworks, canvas, win } = setUp({ reduced: true });
    fireworks.start();
    expect(fireworks.running).toBe(false);
    expect(canvas.getContext).not.toHaveBeenCalled();
    expect(win.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('starts once, then moves the show on and paints it every frame', () => {
    const { fireworks, frames, show, painter, fit, ctx, win } = setUp();
    fireworks.start();
    fireworks.start();
    expect(win.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(show.reset).toHaveBeenCalledTimes(1);
    frames.shift()(16);
    expect(fit.fit).toHaveBeenCalledWith(ctx);
    expect(show.resize).toHaveBeenCalledWith(375, 812);
    expect(show.tick).toHaveBeenCalledWith(16);
    expect(painter.paint).toHaveBeenCalledWith(ctx, show);
    expect(frames).toHaveLength(1);
  });

  it('only resizes the show when the canvas changed size', () => {
    const { fireworks, frames, show } = setUp({ resized: false });
    fireworks.start();
    frames.shift()(16);
    expect(show.resize).not.toHaveBeenCalled();
    expect(show.tick).toHaveBeenCalled();
  });

  it('keeps going until stopped, then clears the canvas and draws nothing more', () => {
    const { fireworks, frames, show, painter, ctx } = setUp();
    fireworks.start();
    for (let t = 0; t < 100; t++) frames.shift()(t * 16);
    expect(fireworks.running).toBe(true);
    fireworks.stop();
    expect(painter.clear).toHaveBeenCalledWith(ctx, show);
    frames.shift()(2000);
    expect(painter.paint).toHaveBeenCalledTimes(100);
    expect(frames).toHaveLength(0);
  });

  it('does nothing when stopped before it started, and reuses its drawing context when started again', () => {
    const { fireworks, painter, canvas } = setUp();
    fireworks.stop();
    expect(painter.clear).not.toHaveBeenCalled();
    fireworks.start();
    fireworks.stop();
    fireworks.start();
    expect(canvas.getContext).toHaveBeenCalledTimes(1);
  });
});
