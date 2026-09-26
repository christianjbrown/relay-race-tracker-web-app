import { describe, expect, it } from 'vitest';
import { isNarrow, NARROW_PX } from '../../src/ui/layout.js';

describe('isNarrow', () => {
  it('is true below the narrow threshold', () => {
    expect(isNarrow({ innerWidth: NARROW_PX - 1 })).toBe(true);
  });

  it('is false at or above the threshold', () => {
    expect(isNarrow({ innerWidth: NARROW_PX })).toBe(false);
    expect(isNarrow({ innerWidth: NARROW_PX + 1 })).toBe(false);
  });
});
