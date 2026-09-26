import { createHash } from 'node:crypto';
import path from 'node:path';
import { readSchedule } from '../../src/config/schedule-check.js';
import { readSiteConfig } from '../../src/config/site-config.js';
import { Course } from '../../src/domain/course.js';
import { decodePolyline } from '../../src/domain/geo.js';
import { LegPlacer } from '../../src/domain/leg-placer.js';
import { Schedule } from '../../src/domain/schedule.js';
import { localise } from '../../src/i18n/language.js';
import { escapeHtml } from '../../src/ui/escape-html.js';
import { cardFacts } from './card-facts.js';
import { fillTemplate, PageHead } from './page-head.js';

const PHOTOS = ['photo.png', 'photo.jpg', 'photo.jpeg', 'photo.webp'];

/**
 * Builds a site into a folder ready to publish: the page with its head
 * written in, the scripts and styles, the site's data, and the images made
 * from the runner's photo.
 *
 * `files` reads and writes (see nodeFiles); `images` is { canvas, sticker,
 * icons, card }; `locales` the languages the page can speak; `root` where
 * the app's own files are.
 */
export class SiteBuild {
  constructor({ files, images, locales, root, log }) {
    this.files = files;
    this.images = images;
    this.locales = locales;
    this.root = root;
    this.log = log;
  }

  async run({ site, out }) {
    this.guard(site, out);
    const read = (name) => this.readJson(path.join(site, name));
    const config = readSiteConfig(await read('config.json'), Object.keys(this.locales));
    const segments = readSchedule(await read('schedule.json'));
    const route = await this.readRoute(site);
    const schedule = new Schedule(segments);
    const course = new Course(route.polylines.flatMap(decodePolyline));
    new LegPlacer(course).place(schedule);

    const sticker = await this.face(site);
    for (const [name, png] of Object.entries(this.images.icons.make(sticker))) await this.files.write(path.join(out, name), png);
    const card = this.images.card.draw({ facts: cardFacts(config, schedule, course, this.locales), course, schedule, avatar: sticker });
    await this.files.write(path.join(out, 'og-card.png'), card);

    const head = new PageHead(config, segments, this.locales);
    const version = createHash('sha256').update(card).digest('hex').slice(0, 10);
    const template = await this.files.readText(path.join(this.root, 'index.template.html'));
    await this.files.write(path.join(out, 'index.html'), fillTemplate(template, {
      lang: head.first.locale.tag,
      head: head.render(version),
      headline: escapeHtml(head.first.words.title),
      detail: escapeHtml(localise(config.event.name, head.first.code)),
    }));
    // Crawlers may always read the page, or they could not see its noindex.
    await this.files.write(path.join(out, 'robots.txt'), 'User-agent: *\nAllow: /\n');
    await this.files.write(path.join(out, '.nojekyll'), '');
    await this.files.copy(path.join(this.root, 'style.css'), path.join(out, 'style.css'));
    // The build owns these two folders outright, so nothing old is left in them.
    await this.files.replace(path.join(this.root, 'src'), path.join(out, 'src'));
    await this.files.clear(path.join(out, 'data'));
    for (const name of ['config.json', 'schedule.json', 'route.json']) await this.files.copy(path.join(site, name), path.join(out, 'data', name));
    if (await this.files.exists(path.join(site, 'CNAME'))) await this.files.copy(path.join(site, 'CNAME'), path.join(out, 'CNAME'));
    this.log(`Built ${out} for ${config.name}: ${schedule.segments.length} segments, ${Math.round(course.totalKm)} km of course.`);
  }

  /** The output is written over, so it must not be the site or the app itself. */
  guard(site, out) {
    const o = path.resolve(out);
    if (o === path.resolve(site) || o === path.resolve(this.root)) throw new Error(`Refusing to build into ${out}: choose a folder of its own, such as dist.`);
  }

  async readJson(file) {
    if (!(await this.files.exists(file))) throw new Error(`${file} is missing.`);
    try {
      return JSON.parse(await this.files.readText(file));
    } catch (e) {
      throw new Error(`${file} is not valid JSON: ${e.message}`);
    }
  }

  async readRoute(site) {
    const file = path.join(site, 'route.json');
    if (!(await this.files.exists(file))) throw new Error(`${file} is missing: run "npm run fetch-route" to get the course from Chronorace.`);
    const route = await this.readJson(file);
    if (!Array.isArray(route.polylines) || route.polylines.length === 0) throw new Error(`${file} has no "polylines".`);
    return route;
  }

  /** The runner's sticker: avatar.png as it is, when the site has one, or one made from photo.*. */
  async face(site) {
    const avatar = path.join(site, 'avatar.png');
    if (await this.files.exists(avatar)) return this.images.canvas.loadImage(await this.files.read(avatar));
    for (const name of PHOTOS) {
      const photo = path.join(site, name);
      if (await this.files.exists(photo)) return this.images.sticker.make(await this.images.canvas.loadImage(await this.files.read(photo)));
    }
    throw new Error(`${site} needs a photo of the runner: ${PHOTOS.join(', ')}, or a ready-made avatar.png.`);
  }
}
