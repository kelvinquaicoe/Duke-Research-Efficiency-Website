# Deployment

This project deploys to Vercel using Astro SSR.

## Team Standard

- Adapter: `@astrojs/vercel/serverless`
- Astro output mode: `server`
- Build command: `npm run build`
- Publish directory: `dist`
- SSR functions: managed by the Astro Vercel adapter
- Node version: `22.12.0`

## Local Verification

1. Install dependencies:
   - `npm install`
2. Build:
   - `npm run build`
3. Preview:
   - `npm run preview`

## Notes

- Do not switch Astro to `@astrojs/node`; this project uses the Vercel adapter.
- Avoid relying on Vercel dashboard defaults; project settings are defined in `astro.config.mjs`.
