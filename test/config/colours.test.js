import { describe, expect, it } from 'vitest';
import { DEFAULT_COLOURS, resolveColours } from '../../src/config/colours.js';

describe('resolveColours', () => {
  it('gives the defaults, with the accent following running', () => {
    expect(resolveColours()).toEqual({ ...DEFAULT_COLOURS, accent: DEFAULT_COLOURS.run });
    expect(Object.isFrozen(resolveColours())).toBe(true);
  });

  it('takes the site\'s own, and an accent of its own', () => {
    expect(resolveColours({ run: '#112233' })).toMatchObject({ run: '#112233', accent: '#112233', drive: DEFAULT_COLOURS.drive });
    expect(resolveColours({ run: '#112233', accent: '#abcdef' }).accent).toBe('#abcdef');
  });

  it('refuses unknown colours and anything not written as #rrggbb', () => {
    expect(() => resolveColours({ swim: '#000000' })).toThrow('Unknown colour: swim. The colours are run, drive, sleep, free, accent.');
    expect(() => resolveColours({ run: 'orange' })).toThrow('Colour run must be written as "#rrggbb".');
    expect(() => resolveColours({ accent: '#fff' })).toThrow('Colour accent must be');
    expect(() => resolveColours({ drive: 5 })).toThrow('Colour drive must be');
  });
});
