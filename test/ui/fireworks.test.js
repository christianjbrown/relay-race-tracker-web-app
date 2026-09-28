import { describe, expect, it, vi } from 'vitest';
import { Fireworks } from '../../src/ui/fireworks.js';

function setUp({ reduce = false, ratio = 2 } = {}) {
  const ctx = {
    setTransform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
  };
  const canvas = { getContext: vi.fn(() => ctx) };
  const frames = [];
  const win = {
    matchMedia: vi.fn(() => ({ matches: reduce })),
    devicePixelRatio: ratio,
    innerWidth: 400,
    innerHeight: 800,
    requestAnimationFrame: vi.fn((f) => frames.push(f)),
  };
  const fireworks = new Fireworks(canvas, win, ['#a', '#b'], () => 0.5);
  // Runs queued frames at `step` ms apart until `until` ms, or none are left.
  const run = (until, step = 16) => {
    let t = 0;
    while (frames.length && t <= until) {
      frames.shift()(t);
      t += step;
    }
  };
  return { fireworks, ctx, canvas, win, frames, run };
}

describe('Fireworks', () => {
  it('stays still for somebody who asked for less motion', () => {
    const { fireworks, win, canvas } = setUp({ reduce: true });
    fireworks.start();
    expect(fireworks.running).toBe(false);
    expect(canvas.getContext).not.toHaveBeenCalled();
    expect(win.requestAnimationFrame).not.toHaveBeenCalled();
    fireworks.stop();
  });

  it('sizes the canvas to the screen at its pixel ratio, and starts only once', () => {
    const { fireworks, canvas, ctx, win, run } = setUp();
    fireworks.start();
    fireworks.start();
    expect(win.requestAnimationFrame).toHaveBeenCalledTimes(1);
    run(0);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(1600);
    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('follows the size the canvas is shown at, and only resizes when it changes', () => {
    const { fireworks, canvas, ctx, run } = setUp({ ratio: 0 });
    canvas.clientWidth = 300;
    canvas.clientHeight = 600;
    fireworks.start();
    run(32);
    expect(canvas.width).toBe(300);
    expect(ctx.setTransform).toHaveBeenCalledTimes(1);
    canvas.clientWidth = 600;
    canvas.clientHeight = 300;
    run(100);
    expect([canvas.width, canvas.height]).toEqual([600, 300]);
    expect(ctx.setTransform).toHaveBeenCalledTimes(2);
  });

  it('launches rockets that burst into sparks in the given colours', () => {
    const { fireworks, ctx, run } = setUp();
    fireworks.start();
    run(3000);
    expect(fireworks.launched).toBeGreaterThan(1);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(['#a', '#b']).toContain(ctx.strokeStyle);
  });

  it('ends the show by itself once the last sparks fade', () => {
    const { fireworks, frames, run } = setUp();
    fireworks.start();
    run(60000, 40);
    expect(fireworks.running).toBe(false);
    expect(frames).toHaveLength(0);
    expect(fireworks.sparks).toHaveLength(0);
  });

  it('draws nothing more once stopped', () => {
    const { fireworks, ctx, frames } = setUp();
    fireworks.start();
    fireworks.stop();
    expect(ctx.clearRect).not.toHaveBeenCalled();
    frames.shift()(0);
    expect(ctx.clearRect).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);
  });
});
