# Tabletop

Mobile-first static site (GitHub Pages) with a dashboard and independent "instances":
card-game score counters and table tools. Data lives only in `localStorage`.

## Commands

- `npm run dev` – dev server (exposed on LAN for phone testing)
- `npm run build` – typecheck + production build to `dist/`
- `npm test` – Vitest, single run
- `npm run format` – Prettier

## Layout

- `index.html` + `src/dashboard/` – dashboard listing instances from `src/shared/games.ts`
- `picker/index.html` + `src/picker/` – "who starts" finger picker
- `flip7/index.html` + `src/flip7/` – Flip 7 score counter
- `src/shared/` – the ONLY code shared between instances: `storage.ts`, `games.ts`, `theme.css`

## Rules

- Instances never import each other. Dashboard and picker share `theme.css`; each game has its own stylesheet.
- Pure logic (scoring, game state, storage) lives in DOM-free modules with Vitest tests. Views are plain render functions; they are tested manually on a phone.
- Mobile-first: min 48px touch targets, test at 360px width, respect `viewport-fit=cover` safe areas.
- UI copy in Polish. Code, comments and commits in English.
- Persisted objects carry `version: 1`. Storage keys are prefixed per instance (`flip7:`).
- Vite 8: multi-page inputs go in `build.rolldownOptions.input`.

## Adding a new instance

1. Create `<id>/index.html` (copy `picker/index.html`) and `src/<id>/main.ts` + `style.css`.
2. Add the entry to `build.rolldownOptions.input` in `vite.config.ts`.
3. Add a `GameEntry` to `src/shared/games.ts` (optionally `hasActiveGame`).

## Git

Repo root is this directory. Do not run git in the parent `_Projects` folder.
Specs: `docs/superpowers/specs/`. Plans: `docs/superpowers/plans/`.
