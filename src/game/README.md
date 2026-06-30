# Cluster Command

A cyberpunk HPC strategy game set at the Duke Compute Cluster.
Assign CPU and GPU jobs to matching nodes to keep efficiency high.

## Requirements

- **Node.js 18+** — https://nodejs.org
- **pnpm** — `npm install -g pnpm`  
  (or use npm/yarn — replace `pnpm` with `npm` in the commands below)

## Run in development

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173 in your browser.

## Build for production

```bash
pnpm build
pnpm preview   # serves the built version locally
```

## How to play

- Jobs arrive in the queue on the left as coloured hexagons
  - 🔵 Cyan = GPU job   🟡 Gold = CPU job
- **Drag** a gem onto a matching node, or **click** the gem then **click** the node
- Hover a gem for ~0.5s to see full job details
- Keep efficiency above 0% — the Slurm-O snail shows your progress
- Queue overflow or efficiency hitting 0% ends the game

## Project structure

```
src/
  game/
    types.ts          — all TypeScript types
    constants.ts      — job templates, node definitions, messages
    useGameState.ts   — game engine (reducer + tick loop)
  components/
    HUD.tsx           — top bar with metrics
    JobQueue.tsx      — hex gem job queue with drag support
    NodeGrid.tsx      — node cards with drop zones
    SlurmOTrack.tsx   — snail progress track
    SlurmO.tsx        — mascot speech bubble
    EventBanner.tsx   — cluster event notifications
  Game.tsx            — main game + menu/gameover screens
  assets/
    slurm_the_snail.png
```
