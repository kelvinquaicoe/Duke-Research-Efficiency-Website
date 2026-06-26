# reseff_website

Astro + React website for Research Efficiency (reseff.cs.duke.edu).

## Requirements

- Node `22.12.0` (see `.nvmrc`)
- npm (ships with Node)

## Local development

- Install: `npm ci`
- Dev server: `npm run dev`
- Production build: `npm run build` (outputs `dist/`)
- Preview build: `npm run preview`

## Deployment

Primary production deployment is via GitLab CI:

- Pipeline builds `dist/` with Node 22 and then `rsync`s it to `reseff.cs.duke.edu`.
- Required CI/CD variables are documented in `.gitlab-ci.yml`.

See `DEPLOYMENT.md` for details and notes about the live metrics endpoint.
