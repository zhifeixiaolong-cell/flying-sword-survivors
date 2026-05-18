# Flying Sword Survivors

A 2D top-down survivor-style game built with Phaser 3, TypeScript, and Vite — a learning project where the player is surrounded by auto-attacking flying swords, mowing through waves of enemies and leveling up.

## Tech stack

- [Vite](https://vitejs.dev/) — build tool & dev server
- [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [Phaser 3](https://phaser.io/) — 2D game engine

## Getting started

```sh
npm install
npm run dev
```

The dev server opens http://localhost:5173 in your browser.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run build:gh` | Build for GitHub Pages (sets `base` to repo path) |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run `tsc --noEmit` (optional in M0) |
| `npm run lint` | Run ESLint (optional in M0) |
| `npm run format` | Format the project with Prettier (optional in M0) |

`typecheck` / `lint` / `format` are optional in M0 and **not** wired into the `build` step. They will become required build gates in M4 once the codebase has real complexity.

## Project layout

```
src/
  main.ts            # Entry: creates Phaser.Game
  config.ts          # Game-wide constants (canvas size, colors)
  scenes/            # Phaser scenes; one class per file
public/              # Static assets copied as-is by Vite
```

## Roadmap

- [x] **M0** — Project scaffold; empty Phaser canvas renders in the browser
- [ ] **M1** — Player character, input, camera
- [ ] **M2** — Orbiting flying swords (auto-attack)
- [ ] **M3** — Enemy spawning, collisions, asset preloading (`BootScene`)
- [ ] **M4** — XP / level-up UI; CI quality gates (typecheck/lint on build)

## License

[MIT](./LICENSE) © Zhifei Cai
