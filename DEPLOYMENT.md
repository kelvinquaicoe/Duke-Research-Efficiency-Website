# Deployment

This project deploys as a static Astro site (build output in `dist/`).

## Team Standard

- Astro output mode: `static` (default)
- Build command: `npm run build`
- Publish directory: `dist`
- Server: `reseff.cs.duke.edu` serves `dist/` as static files (CI deploy via `rsync`)
- Node version: `22.12.0`

## Local Verification

1. Install dependencies:
   - `npm install`
2. Build:
   - `npm run build`
3. Preview:
   - `npm run preview`

## Notes

- Avoid relying on hosting dashboard defaults; project settings are defined in `astro.config.mjs`.
- Chatbot widget URL resolution:
   - Local dev defaults to `http://localhost:5000/`.
   - Production defaults to same-origin `/chatbot/`.
   - To override in any environment, set `PUBLIC_CHATBOT_URL` (for example, your deployed chatbot URL).

- Live metrics endpoint:
   - The UI tries `/api/gpu-metrics.json` first (recommended for the Duke server deployment).
   - If that is unavailable, it falls back to `/.netlify/functions/gpu-metrics` (for Netlify deployments).
