// npm run fetch-route [-- --config config --track "Course name"]
import { ChronoraceFeed } from '../src/services/chronorace-feed.js';
import { processIo, runCli } from './lib/cli.js';
import { nodeFiles } from './lib/node-files.js';
import { RouteFetch } from './lib/route-fetch.js';

const fetchRoute = new RouteFetch(nodeFiles, (id) => new ChronoraceFeed(id, (...args) => fetch(...args)), processIo.log);

await runCli((o) => fetchRoute.run({ site: o.config, track: o.track }), process.argv.slice(2), {
  config: { type: 'string', default: 'config' },
  track: { type: 'string' },
}, processIo);
