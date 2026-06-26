# reseff_website

Astro site for the Research Efficiency / Cluster_cmd project.

## Development

```sh
npm install
npm run dev
```

## Build and preview

```sh
npm run build
npm run preview
```

## Project layout

- `src/pages/` — pages and API routes
- `src/components/` — shared UI pieces
- `src/layouts/` — site layout and global styles
- `src/game/` — embedded React game app
- `public/` — static assets

## Deployment

- Production build output: `dist/`
- Host: `reseff.cs.duke.edu`
- The site is deployed as a static Astro build on the main server.
- See `DEPLOYMENT.md` for the current deployment workflow.

## Notes

- The chatbot widget loads from `/chatbot/` by default.
- Set `PUBLIC_CHATBOT_URL` to override the chatbot location if needed.
- The embedded game uses React components, so Astro React integration is enabled in `astro.config.mjs`.
