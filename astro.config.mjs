// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Static build for reseff.cs.duke.edu.
// The host serves ./dist through Caddy/rsync, so we keep Astro in static mode.
export default defineConfig({
  output: 'static',
  site: 'https://reseff.cs.duke.edu',
  integrations: [react()],
  vite: {
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client'] },
  },
});
