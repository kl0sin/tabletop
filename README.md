# Tabletop

Score counters and table tools for card games, built for phones.

**Live:** https://kl0sin.github.io/tabletop/

Open it on your phone, add it to the home screen, and it works offline. Everything is stored locally in the browser. No accounts, no backend, no tracking.

## What's inside

| Instance | What it does |
| --- | --- |
| **Flip 7** | Round-by-round score counter for [Flip 7](https://boardgamegeek.com/boardgame/420087/flip-7). Type the score or tap the cards a player collected and the app computes it, including busts and the +15 bonus for seven unique cards. Tracks the dealer, supports undo, keeps a history of finished games. |
| **Kto zaczyna?** | "Who starts?" picker. Everyone puts a finger on the screen, holds still for two seconds, and one finger gets picked with a short animation. |

The dashboard lists the instances and shows which game has an unfinished session.

## Design

- **Mobile-first, static, offline.** A Vite multi-page app deployed to GitHub Pages as a PWA. No framework, no runtime dependencies.
- **Instances are independent.** Each game or tool lives in its own folder with its own styles. They share only a tiny localStorage wrapper and the instance registry the dashboard reads. Adding a game does not touch existing ones.
- **Logic is pure and tested.** Scoring, game state, randomness and persistence are DOM-free modules covered by Vitest. Views are plain render functions.

## Stack

Vite 8 · TypeScript (strict) · Vitest · vite-plugin-pwa · GitHub Actions → GitHub Pages

## Development

Requires Node 22 or newer.

```bash
npm install
npm run dev      # dev server exposed on your LAN, open the printed URL on a phone
npm test         # unit tests
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build locally
```

Every push to `main` runs the tests, builds, and deploys to GitHub Pages.

## Project layout

```
index.html           dashboard
picker/index.html    "Kto zaczyna?" picker
flip7/index.html     Flip 7 score counter
src/
  shared/            storage wrapper, instance registry, dashboard + picker theme
  dashboard/
  picker/
  flip7/             scoring.ts, game.ts (pure, tested), storage.ts, views/
docs/superpowers/    design spec and implementation plan
```

## Adding a new instance

1. Create `<id>/index.html` and `src/<id>/` with its own `main.ts` and `style.css`.
2. Register the entry in `vite.config.ts` under `build.rolldownOptions.input`.
3. Add it to `src/shared/games.ts` so the dashboard shows a tile.

Details and conventions are in [CLAUDE.md](CLAUDE.md).

## Roadmap

- More card games as separate instances.
- Order mode for the picker (assign 1..N instead of picking one).
- Export and import of history as JSON.
