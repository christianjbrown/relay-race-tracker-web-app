// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { loadSiteData } from '../../src/boot/site-data.js';
import { buildTracking } from '../../src/boot/tracking.js';
import { makeFetch, makeWin } from '../fakes/page.js';

describe('buildTracking', () => {
  it('builds a poller over the Chronorace feed, with the handover spotter and the pace', async () => {
    const fetch = makeFetch();
    const win = makeWin({ fetch });
    const { config } = await loadSiteData(win);
    const tracking = buildTracking(win, config);
    expect(Object.keys(tracking).sort()).toEqual(['handovers', 'pace', 'poller']);
    expect(typeof tracking.poller.poll).toBe('function');
  });
});
