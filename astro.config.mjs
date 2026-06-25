// @ts-check
import { defineConfig } from 'astro/config';

// Static output (the default). The CI build emits to ./dist and Caddy serves it.
//
// To move to server-side rendering later:
//   1. npm install an adapter (e.g. @astrojs/node)
//   2. set `output: 'server'` and `adapter: node({ mode: 'standalone' })`
//   3. on the host, run dist/server/entry.mjs under systemd and switch the
//      Caddyfile from `file_server` to `reverse_proxy localhost:4321`.
export default defineConfig({
  site: 'https://reseff.cs.duke.edu',
});
