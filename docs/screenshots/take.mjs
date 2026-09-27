// npm run screenshots
//
// Retakes the README's screenshots of the example site: each scene in
// scenes.json on each device, against a pretend Chronorace feed, so the
// page looks as it does during a relay. Needs Google Chrome and a Maps key
// that allows http://localhost:8765/, given as MAPS_API_KEY.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Course } from '../../src/domain/course.js';
import { parseInZone } from '../../src/services/zoned-time.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const PORT = 8765;
const DEBUG_PORT = 9333;
const SETTLE_MS = 15000;
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.txt': 'text/plain' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

/** Builds the example site with the given Maps key into a scratch folder. */
async function buildSite(configDir, key, work) {
  const site = path.join(work, 'config');
  await fs.cp(configDir, site, { recursive: true });
  const config = await readJson(path.join(site, 'config.json'));
  await fs.writeFile(path.join(site, 'config.json'), JSON.stringify({ ...config, mapsApiKey: key }));
  const out = path.join(work, 'dist');
  await run(process.execPath, [path.join(ROOT, 'tools/build.js'), '--config', site, '--out', out]);
  return { out, config };
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    spawn(cmd, args, { stdio: 'inherit' }).on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

/** Where each scene puts the two trackers, as Chronorace would report them. */
function feeds(scenes, course, timezone) {
  const out = {};
  for (const s of scenes) {
    const time = parseInZone(s.at, timezone).toISOString().replace('Z', '');
    const team = course.at(course.indexAtKm(s.teamKm));
    out[s.name] = { run: { Lat: team.lat, Lon: team.lng, Time: time }, van: { Lat: s.vehicle.lat, Lon: s.vehicle.lng, Time: time } };
  }
  return out;
}

/** A script for the page's head that answers Chronorace's requests with the scene named in ?scene=. */
function fakeFeed(byScene, bibs) {
  return `<script>
(() => {
  const scene = ${JSON.stringify(byScene)}[new URLSearchParams(location.search).get('scene')];
  if (!scene) return;
  const real = window.fetch.bind(window);
  const answer = (body) => Promise.resolve(new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }));
  window.fetch = (url, opts) => {
    const u = String(url);
    if (u.includes('/api/gps/config/')) return answer({ Trackers: { r: { Bib: ${JSON.stringify(bibs.run)}, DeviceId: 'run' }, v: { Bib: ${JSON.stringify(bibs.van)}, DeviceId: 'van' } } });
    if (u.includes('/api/gps/get/')) return answer(scene);
    return real(url, opts);
  };
})();
</script>`;
}

function serve(dir) {
  const server = http.createServer(async (req, res) => {
    const file = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
    if (!file.startsWith(dir + path.sep)) {
      res.writeHead(404).end();
      return;
    }
    try {
      const body = await fs.readFile(file);
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

/** Headless Chrome, driven over its debugging protocol so the map can finish drawing first. */
class Browser {
  static async open(profile) {
    const proc = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, 'about:blank']);
    let page;
    for (let i = 0; i < 100 && !page; i++) {
      try {
        page = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json()).find((t) => t.type === 'page');
      } catch {
        await sleep(100);
      }
    }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    return new Browser(proc, ws);
  }

  constructor(proc, ws) {
    this.proc = proc;
    this.ws = ws;
    this.id = 0;
    this.waiting = new Map();
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (!Number.isInteger(m.id) || !this.waiting.has(m.id)) return; // an event, not an answer
      const resolve = this.waiting.get(m.id);
      this.waiting.delete(m.id);
      resolve(m.result);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      this.waiting.set(++this.id, resolve);
      this.ws.send(JSON.stringify({ id: this.id, method, params }));
    });
  }

  async shoot(url, device, file) {
    await this.send('Emulation.setDeviceMetricsOverride', { width: device.width, height: device.height, deviceScaleFactor: device.scale, mobile: device.mobile });
    await this.send('Page.navigate', { url });
    await sleep(SETTLE_MS);
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(file, Buffer.from(data, 'base64'));
  }

  /** Waits for Chrome to exit, so its profile can be deleted. */
  close() {
    this.ws.close();
    const exited = new Promise((r) => this.proc.once('exit', r));
    this.proc.kill();
    return exited;
  }
}

const key = process.env.MAPS_API_KEY;
if (!key) throw new Error(`Set MAPS_API_KEY to a Google Maps key that allows http://localhost:${PORT}/.`);
const plan = await readJson(path.join(HERE, 'scenes.json'));
const work = await fs.mkdtemp(path.join(os.tmpdir(), 'screenshots-'));
const { out, config } = await buildSite(path.join(ROOT, plan.config), key, work);
const route = await readJson(path.join(ROOT, plan.config, 'route.json'));
const byScene = feeds(plan.scenes, new Course(route.points), config.timezone);
const index = path.join(out, 'index.html');
const html = await fs.readFile(index, 'utf8');
await fs.writeFile(index, html.replace('</head>', `${fakeFeed(byScene, { run: config.chronorace.runnerTracker, van: config.chronorace.vehicleTracker })}\n</head>`));

const server = await serve(out);
const browser = await Browser.open(path.join(work, 'chrome'));
try {
  for (const scene of plan.scenes) {
    for (const [name, device] of Object.entries(plan.devices)) {
      const file = path.join(ROOT, 'docs', `screenshot-${scene.name}-${name}.png`);
      await browser.shoot(`http://localhost:${PORT}/?at=${scene.at}&scene=${scene.name}`, device, file);
      console.log(`${path.relative(ROOT, file)}: ${scene.about}`);
    }
  }
} finally {
  await browser.close();
  server.close();
  await fs.rm(work, { recursive: true, force: true });
}
