import { describe, expect, it } from 'vitest';
import { FONTS, nodeCanvas } from '../../../tools/lib/canvas.js';

describe('nodeCanvas', () => {
  it('gives a canvas maker, an image loader, and the fonts', () => {
    const canvas = nodeCanvas();
    expect(typeof canvas.createCanvas).toBe('function');
    expect(typeof canvas.loadImage).toBe('function');
    expect(canvas.fonts).toBe(FONTS);
    expect(canvas.fonts.regular).toContain('Card latin 400');
    expect(canvas.fonts.bold).toContain('Card latin-ext 700');
  });

  it('registering twice does not re-register', () => {
    nodeCanvas();
    expect(() => nodeCanvas()).not.toThrow();
  });
});
