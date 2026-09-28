import { describe, expect, it, vi } from 'vitest';
import { RunnerClick } from '../../src/ui/runner-click.js';

describe('RunnerClick', () => {
  it('opens Street View in a new tab when there is somewhere to look', () => {
    const win = { open: vi.fn() };
    const follow = vi.fn();
    new RunnerClick(win, () => 'https://street.view', follow).click();
    expect(win.open).toHaveBeenCalledWith('https://street.view', '_blank', 'noopener');
    expect(follow).not.toHaveBeenCalled();
  });

  it('follows the runner on the map otherwise', () => {
    const win = { open: vi.fn() };
    const follow = vi.fn();
    new RunnerClick(win, () => null, follow).click();
    expect(win.open).not.toHaveBeenCalled();
    expect(follow).toHaveBeenCalled();
  });
});
