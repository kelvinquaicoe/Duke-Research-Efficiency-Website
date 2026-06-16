# Deployment

This project deploys to Netlify using Astro SSR.

## Team Standard

- Adapter: `@astrojs/netlify`
- Astro output mode: `server`
- Build command: `npm run build`
- Publish directory: `dist`
- SSR functions: managed by the Astro Netlify adapter (do not set a custom functions directory)
- Node version: `22.12.0`

## Local Verification

1. Install dependencies:
   - `npm install`
2. Build:
   - `npm run build`
3. Preview:
   - `npm run preview`

## Notes

- Do not switch Astro to `@astrojs/node` for Netlify deploys.
- Avoid relying on Netlify dashboard defaults; project settings are defined in `netlify.toml`.
