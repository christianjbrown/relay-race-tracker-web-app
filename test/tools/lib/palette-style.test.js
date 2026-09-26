import { describe, expect, it } from 'vitest';
import { resolveColours } from '../../../src/config/colours.js';
import { paletteStyle } from '../../../tools/lib/palette-style.js';

describe('paletteStyle', () => {
  it('writes every colour as a custom property on the root', () => {
    expect(paletteStyle(resolveColours({ run: '#112233', accent: '#445566' })))
      .toBe('  <style>:root { --run: #112233; --drive: #E87BA4; --sleep: #5F4D8C; --free: #A9A79C; --accent: #445566; }</style>');
  });
});
