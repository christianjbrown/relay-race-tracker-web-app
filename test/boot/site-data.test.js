// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { loadSite, loadSiteData, speak } from '../../src/boot/site-data.js';
import { config, makeFetch, makeWin, route, schedule } from '../fakes/page.js';

describe('loadSite', () => {
  it('reads config, schedule and route from the given base', async () => {
    const fetch = makeFetch();
    const site = await loadSite(fetch);
    expect(site.config).toEqual(config);
    expect(site.schedule).toEqual(schedule);
    expect(site.route).toEqual(route);
    expect(fetch).toHaveBeenCalledWith('data/config.json');
  });

  it('throws when a file does not come back ok', async () => {
    const fetch = makeFetch({ siteOk: false, siteStatus: 500 });
    await expect(loadSite(fetch)).rejects.toThrow('data/config.json answered 500');
  });
});

describe('speak', () => {
  it('picks the reader\'s language and builds its words and formats', async () => {
    const win = makeWin();
    const { config: checked } = await loadSiteData(win);
    const language = speak(win, checked);
    expect(language.code).toBe('en');
    expect(language.locale.tag).toBeTruthy();
    expect(language.words.vehicle).toBeTruthy();
    expect(language.formats).toBeTruthy();
  });
});

describe('loadSiteData', () => {
  it('returns the checked config, the schedule segments, the route and the language', async () => {
    const data = await loadSiteData(makeWin());
    expect(data.config.timezone).toBe(config.timezone);
    expect(data.segments.length).toBeGreaterThan(0);
    expect(data.route).toEqual(route);
    expect(data.language.code).toBe('en');
  });

  it('rejects when the site files do not arrive', async () => {
    await expect(loadSiteData(makeWin({ fetch: makeFetch({ siteOk: false }) }))).rejects.toThrow('answered 404');
  });
});
