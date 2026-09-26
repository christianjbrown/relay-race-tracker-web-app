import { describe, expect, it } from 'vitest';
import { chooseTheme, KINDS, THEMES } from '../../src/ui/theme.js';

describe('theme constants', () => {
  it('lists each segment kind', () => {
    expect(KINDS).toEqual(['run', 'drive', 'sleep', 'free']);
  });

  it('freezes the constants', () => {
    expect(Object.isFrozen(KINDS)).toBe(true);
    expect(Object.isFrozen(THEMES)).toBe(true);
  });
});

describe('chooseTheme', () => {
  it('picks the light theme when asked for it', () => {
    const root = { dataset: {} };
    const theme = chooseTheme('?theme=light', root);
    expect(theme).toBe(THEMES.light);
    expect(root.dataset.theme).toBe('light');
  });

  it('defaults to dark with no query', () => {
    const root = { dataset: {} };
    const theme = chooseTheme('', root);
    expect(theme).toBe(THEMES.dark);
    expect(root.dataset.theme).toBe('dark');
  });

  it('falls back to dark for an unknown theme name', () => {
    const root = { dataset: {} };
    const theme = chooseTheme('?theme=purple', root);
    expect(theme).toBe(THEMES.dark);
  });
});
