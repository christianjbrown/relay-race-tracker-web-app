import { describe, expect, it, vi } from 'vitest';
import { FireworksPainter } from '../../src/ui/fireworks-painter.js';

const fakeCtx = () => {
  const alphas = [];
  const ctx = { clearRect: vi.fn(), fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(() => alphas.push(ctx.globalAlpha)) };
  return { ctx, alphas };
};

describe('FireworksPainter', () => {
  const show = {
    width: 400,
    height: 800,
    rockets: [{ x: 10, y: 20, colour: '#a' }],
    sparks: [{ px: 1, py: 2, x: 3, y: 4, life: 250, full: 1000, colour: '#b' }],
  };

  it('clears the frame, dots each rocket and streaks each spark as it fades', () => {
    const { ctx, alphas } = fakeCtx();
    new FireworksPainter().paint(ctx, show);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 400, 800);
    expect(ctx.fillRect).toHaveBeenCalledWith(8.5, 18.5, 3, 3);
    expect(ctx.moveTo).toHaveBeenCalledWith(1, 2);
    expect(ctx.lineTo).toHaveBeenCalledWith(3, 4);
    expect(ctx.strokeStyle).toBe('#b');
    expect(alphas).toEqual([0.25]);
    expect(ctx.globalAlpha).toBe(1);
  });
});
