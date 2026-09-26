// npm run build [-- --config config --out dist]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES } from '../src/i18n/locales/index.js';
import { nodeCanvas } from './lib/canvas.js';
import { processIo, runCli } from './lib/cli.js';
import { nodeFiles } from './lib/node-files.js';
import { OgCard } from './lib/og-card.js';
import { SiteBuild } from './lib/site-build.js';
import { Icons, Sticker } from './lib/sticker.js';

const canvas = nodeCanvas();
const build = new SiteBuild({
  files: nodeFiles,
  images: { canvas, sticker: new Sticker(canvas), icons: new Icons(canvas), card: new OgCard(canvas) },
  locales: LOCALES,
  root: path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  log: processIo.log,
});

await runCli((o) => build.run({ site: o.config, out: o.out }), process.argv.slice(2), {
  config: { type: 'string', default: 'config' },
  out: { type: 'string', default: 'dist' },
}, processIo);
