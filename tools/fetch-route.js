// npm run fetch-route [-- --site site --track "Course name"]
import { ChronoraceFeed } from '../src/services/chronorace-feed.js';
import { processIo, runCli } from './lib/cli.js';
import { nodeFiles } from './lib/node-files.js';
import { RouteFetch } from './lib/route-fetch.js';

const fetchRoute = new RouteFetch(nodeFiles, (id) => new ChronoraceFeed(id, (...args) => fetch(...args)), processIo.log);

await runCli((o) => fetchRoute.run(o), process.argv.slice(2), {
  site: { type: 'string', default: 'site' },
  track: { type: 'string' },
}, processIo);
