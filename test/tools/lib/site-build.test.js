import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOCALES } from '../../../src/i18n/locales/index.js';
import { nodeCanvas } from '../../../tools/lib/canvas.js';
import { nodeFiles } from '../../../tools/lib/node-files.js';
import { OgCard } from '../../../tools/lib/og-card.js';
import { SiteBuild } from '../../../tools/lib/site-build.js';
import { Icons, Sticker } from '../../../tools/lib/sticker.js';

const repoRoot = path.join(import.meta.dirname, '..', '..', '..');
const exampleSite = path.join(repoRoot, 'example-site');
const canvas = nodeCanvas();

async function tempDir() {
  return mkdtemp(path.join(os.tmpdir(), 'site-build-'));
}

async function copySite(dir) {
  const site = path.join(dir, 'site');
  await cp(exampleSite, site, { recursive: true });
  return site;
}

function build(log = vi.fn()) {
  const stickerMake = vi.fn((photo) => new Sticker(canvas).make(photo));
  const images = { canvas, sticker: { make: stickerMake }, icons: new Icons(canvas), card: new OgCard(canvas) };
  return { build: new SiteBuild({ files: nodeFiles, images, locales: LOCALES, root: repoRoot, log }), stickerMake, log };
}

describe('SiteBuild', () => {
  let dir;

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it('builds a full site: page, og-card, icons, data and assets', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    const out = path.join(dir, 'out');
    const { build: b, log } = build();
    await b.run({ site, out });

    const html = await readFile(path.join(out, 'index.html'), 'utf8');
    expect(html).toContain('<title>Where is Sam? · Wo ist Sam? – Example Coast Relay 2027</title>');
    expect(html).toContain('<link rel="canonical" href="https://www.example.com/">');
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="de"');
    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('og:image');
    expect(html).toContain('<style>:root { --run: #EB6834;');
    expect(html.indexOf('<style>:root')).toBeGreaterThan(html.indexOf('href="style.css"'));

    const cardImg = await canvas.loadImage(await readFile(path.join(out, 'og-card.png')));
    expect(cardImg.width).toBe(1200);
    expect(cardImg.height).toBe(630);

    const avatarImg = await canvas.loadImage(await readFile(path.join(out, 'avatar.png')));
    expect(avatarImg.width).toBe(256);
    const faviconImg = await canvas.loadImage(await readFile(path.join(out, 'favicon.png')));
    expect(faviconImg.width).toBe(64);
    const appleImg = await canvas.loadImage(await readFile(path.join(out, 'apple-touch-icon.png')));
    expect(appleImg.width).toBe(180);

    await readFile(path.join(out, 'data', 'config.json'), 'utf8');
    await readFile(path.join(out, 'data', 'schedule.json'), 'utf8');
    await readFile(path.join(out, 'data', 'route.json'), 'utf8');
    await readFile(path.join(out, 'style.css'), 'utf8');
    await readFile(path.join(out, 'src', 'main.js'), 'utf8');
    await readFile(path.join(out, 'robots.txt'), 'utf8');
    await expect(readFile(path.join(out, '.nojekyll'), 'utf8')).resolves.toBe('');
    await expect(readFile(path.join(out, 'CNAME'), 'utf8')).rejects.toThrow();

    expect(log).toHaveBeenCalledWith(expect.stringContaining('Built'));
  });

  it('copies CNAME when the site has one', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await writeFile(path.join(site, 'CNAME'), 'example.com');
    const out = path.join(dir, 'out');
    await build().build.run({ site, out });
    expect(await readFile(path.join(out, 'CNAME'), 'utf8')).toBe('example.com');
  });

  it('omits hreflang for a single language', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    const config = JSON.parse(await readFile(path.join(site, 'config.json'), 'utf8'));
    config.languages = ['en'];
    await writeFile(path.join(site, 'config.json'), JSON.stringify(config));
    const out = path.join(dir, 'out');
    await build().build.run({ site, out });
    const html = await readFile(path.join(out, 'index.html'), 'utf8');
    expect(html).not.toContain('hreflang');
  });

  it('omits noindex when the site is indexable', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    const config = JSON.parse(await readFile(path.join(site, 'config.json'), 'utf8'));
    config.site.indexable = true;
    await writeFile(path.join(site, 'config.json'), JSON.stringify(config));
    const out = path.join(dir, 'out');
    await build().build.run({ site, out });
    const html = await readFile(path.join(out, 'index.html'), 'utf8');
    expect(html).not.toContain('noindex');
  });

  it('uses avatar.png as-is when present, without making a sticker', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await cp(path.join(site, 'photo.png'), path.join(site, 'avatar.png'));
    await rm(path.join(site, 'photo.png'));
    const out = path.join(dir, 'out');
    const { build: b, stickerMake } = build();
    await b.run({ site, out });
    expect(stickerMake).not.toHaveBeenCalled();
  });

  it('finds photo.jpg when photo.png is absent', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await cp(path.join(site, 'photo.png'), path.join(site, 'photo.jpg'));
    await rm(path.join(site, 'photo.png'));
    const out = path.join(dir, 'out');
    const { build: b, stickerMake } = build();
    await b.run({ site, out });
    expect(stickerMake).toHaveBeenCalledTimes(1);
  });

  it('throws when the site needs a photo and has none', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await rm(path.join(site, 'photo.png'));
    const out = path.join(dir, 'out');
    await expect(build().build.run({ site, out })).rejects.toThrow('needs a photo of the runner');
  });

  it('throws when config.json is missing', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await rm(path.join(site, 'config.json'));
    const out = path.join(dir, 'out');
    await expect(build().build.run({ site, out })).rejects.toThrow(/config\.json is missing/);
  });

  it('throws when config.json is not valid JSON', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await writeFile(path.join(site, 'config.json'), '{ not json');
    const out = path.join(dir, 'out');
    await expect(build().build.run({ site, out })).rejects.toThrow(/config\.json is not valid JSON/);
  });

  it('throws when route.json is missing', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await rm(path.join(site, 'route.json'));
    const out = path.join(dir, 'out');
    await expect(build().build.run({ site, out })).rejects.toThrow(/route\.json is missing/);
  });

  it('throws when route.json has no polylines', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await writeFile(path.join(site, 'route.json'), JSON.stringify({ name: 'x', polylines: [] }));
    const out = path.join(dir, 'out');
    await expect(build().build.run({ site, out })).rejects.toThrow(/has no "polylines"/);
  });

  it('refuses to build into the site folder', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await expect(build().build.run({ site, out: site })).rejects.toThrow('Refusing to build');
  });

  it('refuses to build into the app root', async () => {
    dir = await tempDir();
    const site = await copySite(dir);
    await expect(build().build.run({ site, out: repoRoot })).rejects.toThrow('Refusing to build');
  });
});
