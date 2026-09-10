# Tabletop

Mobile-first static site (GitHub Pages) with a dashboard and independent "instances":
card-game score counters and table tools. Data lives only in `localStorage`.

Live: https://kl0sin.github.io/tabletop/ — every push to `main` runs tests, builds and
deploys via `.github/workflows/deploy.yml` (Pages source is "GitHub Actions").

## Commands

- `npm run dev` – dev server (exposed on LAN for phone testing)
- `npm run build` – typecheck + production build to `dist/`
- `npm run preview` – serve the production build (service worker included)
- `npm test` / `npm run test:watch` – Vitest
- `npm run format` – Prettier (respects `.prettierignore`)

## Layout

- `index.html` + `src/dashboard/` – dashboard; tiles come from `src/shared/games.ts`,
  tile icons are inline SVG in `src/dashboard/icons.ts` keyed by instance id
- `picker/index.html` + `src/picker/` – "who starts" finger picker
- `flip7/index.html` + `src/flip7/` – Flip 7 score counter
  - `scoring.ts`, `game.ts`, `storage.ts` – pure, tested
  - `main.ts` – thin `Screen` switch; `views/*` – render functions
  - `views/dom.ts` – `esc()` (HTML escape), `toast()`, `plural()` (Polish plural forms)
- `src/shared/` – the ONLY code shared between instances: `storage.ts`, `games.ts`, `theme.css`
- `docs/superpowers/` – specs and plans; `docs/screenshots/` – README images
- Per-instance READMEs: `flip7/README.md`, `picker/README.md`

## Rules

- Instances never import each other. Dashboard and picker share `theme.css`; each game has its
  own stylesheet.
- Pure logic (scoring, game state, storage) lives in DOM-free modules with Vitest tests. Views
  are plain render functions; they are verified in a browser, not unit-tested.
- Every user-provided string (player names) goes through `esc()` before `innerHTML`.
- Mobile-first: min 48px touch targets, layouts checked at 360–390px, safe areas via
  `viewport-fit=cover`. Content is capped (`max-width`) and centred on wide screens.
- UI copy in Polish. Code, comments and commits in English.
- Persisted objects carry `version: 1`. Storage keys are prefixed per instance (`flip7:`).
- Vite 8: multi-page inputs go in `build.rolldownOptions.input` (not `rollupOptions`).
- PWA (`vite-plugin-pwa`): `workbox.navigateFallback` MUST stay `null`. This is a multi-page
  app; the SPA fallback would serve the dashboard for every nested URL once the SW is active.
  New pages are precached automatically by the glob pattern.

## Adding a new instance

1. Create `<id>/index.html` (copy `picker/index.html`, keep the `<head>` icon/PWA meta tags)
   and `src/<id>/main.ts` + `style.css`.
2. Add the entry to `build.rolldownOptions.input` in `vite.config.ts`.
3. Add a `GameEntry` to `src/shared/games.ts` (`id`, `name`, `description`, `path`, `accent`,
   optional `hasActiveGame`) and an SVG for that id in `src/dashboard/icons.ts`.
4. Add `<id>/README.md` and link it from the root README.

## Verifying in a browser

- `npm run dev -- --port 5199`, open `http://localhost:5199/tabletop/<page>/`.
- Multi-touch can be simulated by dispatching `PointerEvent`s with distinct `pointerId`s; stub
  `stage.setPointerCapture` first, otherwise unknown pointer ids throw.
- "Nowa gra" and "Usuń" in Flip 7 use `confirm()`, which blocks browser automation. Test them
  by hand.

## Git

Repo root is this directory. Do not run git in the parent `_Projects` folder.
Do not push unless asked. Specs: `docs/superpowers/specs/`. Plans: `docs/superpowers/plans/`.
