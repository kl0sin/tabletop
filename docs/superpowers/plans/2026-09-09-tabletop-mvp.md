# Tabletop MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-first static site on GitHub Pages with a dashboard, a finger-based "who starts" picker, and a Flip 7 score counter with history, all stored in `localStorage`.

**Architecture:** Vite multi-page app. Root `index.html` is the dashboard; `picker/index.html` and `flip7/index.html` are independent instances that share only `src/shared/storage.ts` and `src/shared/games.ts` (dashboard and picker also share `src/shared/theme.css`). Pure logic (Flip 7 scoring and game state, storage wrapper) lives in DOM-free modules covered by Vitest; views are small vanilla-TS render functions.

**Tech Stack:** Vite 8, vanilla TypeScript 5.9 (strict), Vitest 5, vite-plugin-pwa 1.3, Prettier 3, GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-09-tabletop-design.md`

## Global Constraints

- Site base path is `/tabletop/`; final URL `https://mkklosin.github.io/tabletop/`.
- Mobile-first: every interactive control at least 48px tall, layouts tested at 360px width.
- UI copy in Polish (players are Polish speakers). Code, comments, commits in English.
- Instances never import each other. Allowed shared imports: `src/shared/storage.ts`, `src/shared/games.ts`, and (dashboard + picker only) `src/shared/theme.css`.
- Flip 7 has its own stylesheet and must not import `theme.css`.
- Data only in `localStorage`; every persisted object carries `version: 1`.
- Storage keys: `flip7:current`, `flip7:history`, `flip7:lastPlayers`.
- Vite 8: use `build.rolldownOptions.input` (not `rollupOptions`).
- Git: the repo root is `/Users/m.klosinski/_Projects/tabletop`. Before every commit run `git rev-parse --show-toplevel` and confirm it prints exactly that path. Never run git against the parent `_Projects` directory. Do not push unless asked.
- Deviation from spec (approved): instance HTML entry files live at `picker/index.html` and `flip7/index.html` in the repo root (clean URLs); their TS/CSS live in `src/picker/` and `src/flip7/`.

---

## File Structure

```
tabletop/
├── index.html                       # dashboard entry
├── picker/index.html                # picker entry
├── flip7/index.html                 # flip7 entry
├── public/
│   ├── icon.svg                     # source icon (Task 14)
│   └── (generated PNG icons)        # Task 14
├── src/
│   ├── shared/
│   │   ├── storage.ts               # localStorage wrapper
│   │   ├── storage.test.ts
│   │   ├── games.ts                 # registry of instances
│   │   └── theme.css                # dashboard + picker theme
│   ├── dashboard/
│   │   ├── main.ts
│   │   └── style.css
│   ├── picker/
│   │   ├── main.ts                  # pointer tracking, arm/pick state machine
│   │   ├── random.ts                # crypto-based randomIndex + shuffle
│   │   ├── random.test.ts
│   │   └── style.css
│   └── flip7/
│       ├── scoring.ts               # pure round scoring
│       ├── scoring.test.ts
│       ├── game.ts                  # pure game state transitions
│       ├── game.test.ts
│       ├── storage.ts               # flip7:* keys
│       ├── storage.test.ts
│       ├── main.ts                  # screen state + wiring
│       ├── style.css
│       └── views/
│           ├── dom.ts               # esc(), toast()
│           ├── dom.test.ts
│           ├── start.ts
│           ├── table.ts
│           ├── round.ts             # keypad + cards mode
│           ├── end.ts
│           └── history.ts
├── .github/workflows/deploy.yml
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .prettierrc
└── .gitignore
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.prettierrc`, `.gitignore`, `index.html`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `test`, `test:watch`, `format`; Vite config with `base: '/tabletop/'` and three HTML inputs (picker/flip7 entries are added to the input map now but their files are created in later tasks — so for this task only the dashboard input is listed; later tasks add theirs).

- [ ] **Step 1: Create package.json and install dependencies**

```bash
cat > package.json <<'JSON'
{
  "name": "tabletop",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write ."
  }
}
JSON
npm install -D vite@^8 vitest@^5 typescript@^5.9 prettier@^3 vite-plugin-pwa@^1.3
```

Expected: `node_modules/` created, `devDependencies` added to `package.json`, `package-lock.json` created.

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```ts
import { defineConfig } from 'vitest/config';

const page = (relative: string) => new URL(relative, import.meta.url).pathname;

export default defineConfig({
  base: '/tabletop/',
  build: {
    rolldownOptions: {
      input: {
        dashboard: page('index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create .prettierrc and .gitignore**

`.prettierrc`:
```json
{ "singleQuote": true, "printWidth": 100, "semi": true }
```

`.gitignore`:
```
node_modules
dist
.DS_Store
dev-dist
```

- [ ] **Step 5: Create placeholder dashboard index.html**

```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0f1115" />
    <title>Tabletop</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/dashboard/main.ts"></script>
  </body>
</html>
```

Create `src/dashboard/main.ts` with a single line so the build has something to bundle:

```ts
document.querySelector<HTMLElement>('#app')!.textContent = 'Tabletop';
```

- [ ] **Step 6: Verify build and test runner**

Run: `npm run build`
Expected: `dist/index.html` exists and references `/tabletop/assets/...`. Check with `grep -o '/tabletop/assets/[^"]*' dist/index.html`.

Run: `npm test`
Expected: Vitest exits 0 with "No test files found" (or passes with 0 tests). If it exits non-zero because no tests exist, add `passWithNoTests: true` to the `test` block in `vite.config.ts`.

- [ ] **Step 7: Commit**

```bash
git rev-parse --show-toplevel   # must print /Users/m.klosinski/_Projects/tabletop
git add package.json package-lock.json tsconfig.json vite.config.ts .prettierrc .gitignore index.html src/dashboard/main.ts
git commit -m "chore: scaffold Vite multi-page project"
```

---

### Task 2: CLAUDE.md and README

**Files:**
- Create: `CLAUDE.md`, `README.md`

- [ ] **Step 1: Write CLAUDE.md**

```markdown
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
```

- [ ] **Step 2: Write README.md**

```markdown
# Tabletop

Score counters and table tools for card games, built for phones. Hosted at
https://mkklosin.github.io/tabletop/

- **Flip 7** – round-by-round score counter with history
- **Kto zaczyna?** – put your fingers on the screen, one gets picked

Everything is stored locally in the browser. No accounts, no backend.

## Development

    npm install
    npm run dev      # open the LAN URL on your phone
    npm test
    npm run build
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: add CLAUDE.md and README"
```

---

### Task 3: Shared storage wrapper

**Files:**
- Create: `src/shared/storage.ts`, `src/shared/storage.test.ts`

**Interfaces:**
- Produces:
  - `read<T>(key: string): T | null`
  - `write<T>(key: string, value: T): boolean`
  - `remove(key: string): void`
  - `has(key: string): boolean`

- [ ] **Step 1: Write the failing tests**

`src/shared/storage.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { has, read, remove, write } from './storage';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

describe('storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });

  it('returns null for a missing key', () => {
    expect(read('nope')).toBeNull();
    expect(has('nope')).toBe(false);
  });

  it('round-trips an object', () => {
    expect(write('k', { a: 1, b: ['x'] })).toBe(true);
    expect(read('k')).toEqual({ a: 1, b: ['x'] });
    expect(has('k')).toBe(true);
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem('k', '{oops');
    expect(read('k')).toBeNull();
  });

  it('removes a key', () => {
    write('k', 1);
    remove('k');
    expect(read('k')).toBeNull();
  });

  it('write returns false when setItem throws', () => {
    vi.stubGlobal('localStorage', {
      ...memoryStorage(),
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(write('k', 1)).toBe(false);
  });

  it('degrades gracefully when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(read('k')).toBeNull();
    expect(write('k', 1)).toBe(false);
    expect(has('k')).toBe(false);
    expect(() => remove('k')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/shared/storage.test.ts`
Expected: FAIL, "Failed to resolve import ./storage" or similar.

- [ ] **Step 3: Implement storage.ts**

```ts
/**
 * Thin, exception-safe wrapper around localStorage.
 * Every function tolerates a missing or throwing localStorage.
 */

export function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function write<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function has(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/shared/storage.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/shared/storage.ts src/shared/storage.test.ts
git commit -m "feat(shared): add exception-safe localStorage wrapper"
```

---

### Task 4: Theme, game registry, dashboard

**Files:**
- Create: `src/shared/theme.css`, `src/shared/games.ts`, `src/dashboard/style.css`
- Modify: `src/dashboard/main.ts`

**Interfaces:**
- Consumes: `has` from `src/shared/storage.ts`
- Produces: `GameEntry` interface and `games: GameEntry[]` in `src/shared/games.ts`

- [ ] **Step 1: Create theme.css**

```css
:root {
  --bg: #0f1115;
  --surface: #1a1d24;
  --surface-2: #242833;
  --text: #f2f2f2;
  --muted: #9aa0aa;
  --accent: #f5b301;
  --accent-ink: #1a1400;
  --radius: 16px;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

button {
  font: inherit;
  color: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 2: Create games.ts**

```ts
import { has } from './storage';

export interface GameEntry {
  id: string;
  name: string;
  description: string;
  /** Path relative to the site base, with trailing slash. */
  path: string;
  /** Emoji shown on the dashboard tile. */
  icon: string;
  /** Optional: true when the instance has an unfinished session to resume. */
  hasActiveGame?: () => boolean;
}

export const games: GameEntry[] = [
  {
    id: 'flip7',
    name: 'Flip 7',
    description: 'Licznik punktów i historia rozgrywek',
    path: 'flip7/',
    icon: '🃏',
    hasActiveGame: () => has('flip7:current'),
  },
  {
    id: 'picker',
    name: 'Kto zaczyna?',
    description: 'Połóżcie palce, telefon losuje',
    path: 'picker/',
    icon: '👆',
  },
];
```

- [ ] **Step 3: Write dashboard main.ts**

```ts
import '../shared/theme.css';
import './style.css';
import { games } from '../shared/games';

const app = document.querySelector<HTMLElement>('#app')!;
const base = import.meta.env.BASE_URL;

function render(): void {
  const tiles = games
    .map((g) => {
      const active = g.hasActiveGame?.() ?? false;
      return `
        <a class="tile" href="${base}${g.path}">
          <span class="tile__icon" aria-hidden="true">${g.icon}</span>
          <span class="tile__name">${g.name}</span>
          <span class="tile__desc">${g.description}</span>
          ${active ? '<span class="tile__badge">w toku</span>' : ''}
        </a>`;
    })
    .join('');

  app.innerHTML = `
    <header class="header"><h1 class="header__title">Tabletop</h1></header>
    <main class="grid">${tiles}</main>`;
}

render();
// Re-render when returning via back/forward cache so "w toku" badges stay fresh.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) render();
});
```

- [ ] **Step 4: Write dashboard style.css**

```css
.header {
  padding: calc(var(--safe-top) + 24px) 20px 8px;
}

.header__title {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0.02em;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 12px 20px calc(var(--safe-bottom) + 24px);
}

@media (min-width: 480px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.tile {
  position: relative;
  display: grid;
  gap: 4px;
  min-height: 120px;
  padding: 18px;
  background: var(--surface);
  border-radius: var(--radius);
  transition: transform 0.1s ease;
}

.tile:active {
  transform: scale(0.98);
  background: var(--surface-2);
}

.tile__icon {
  font-size: 32px;
  line-height: 1;
}

.tile__name {
  font-size: 20px;
  font-weight: 600;
}

.tile__desc {
  color: var(--muted);
  font-size: 14px;
}

.tile__badge {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}
```

- [ ] **Step 5: Verify in the browser**

Run: `npm run dev`
Open the printed local URL. Expected: dark page, "Tabletop" header, two tiles. Tiles link to `/tabletop/flip7/` and `/tabletop/picker/` (404 for now, that is fine). In DevTools console run `localStorage.setItem('flip7:current','{}')` and reload: the Flip 7 tile shows a "W TOKU" badge. Remove the key afterwards.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/shared/theme.css src/shared/games.ts src/dashboard
git commit -m "feat(dashboard): render instance tiles from registry"
```

---

### Task 5: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: deploy to GitHub Pages on push to main"
```

- [ ] **Step 3: Manual step for the repo owner (do not do this yourself)**

Tell the user: in GitHub → repo **Settings → Pages → Build and deployment → Source** choose **GitHub Actions**. After the first push to `main` the site appears at `https://mkklosin.github.io/tabletop/`. Pushing is the user's decision; do not push.

---

### Task 6: Finger picker

**Files:**
- Create: `picker/index.html`, `src/picker/main.ts`, `src/picker/random.ts`, `src/picker/random.test.ts`, `src/picker/style.css`
- Modify: `vite.config.ts` (add `picker` input)

**Interfaces:**
- Consumes: `src/shared/theme.css`
- Produces: `randomIndex(n: number): number`, `shuffle<T>(items: T[]): T[]` in `src/picker/random.ts`

- [ ] **Step 1: Write failing tests for random.ts**

`src/picker/random.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { randomIndex, shuffle } from './random';

describe('randomIndex', () => {
  it('always returns an integer in [0, n)', () => {
    for (let i = 0; i < 1000; i++) {
      const r = randomIndex(7);
      expect(Number.isInteger(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(7);
    }
  });

  it('returns 0 for n = 1', () => {
    expect(randomIndex(1)).toBe(0);
  });

  it('throws for n < 1', () => {
    expect(() => randomIndex(0)).toThrow();
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('eventually produces a different order', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const changed = Array.from({ length: 50 }, () => shuffle(input)).some(
      (o) => o.join() !== input.join(),
    );
    expect(changed).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/picker/random.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement random.ts**

```ts
/** Uniform integer in [0, n) using crypto, with rejection sampling to avoid modulo bias. */
export function randomIndex(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer');
  if (n === 1) return 0;
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0]!;
  } while (value >= limit);
  return value % n;
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/picker/random.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Create picker/index.html**

```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    />
    <meta name="theme-color" content="#0f1115" />
    <title>Kto zaczyna? – Tabletop</title>
  </head>
  <body>
    <div id="stage" class="stage">
      <a class="back" href="../">← Tabletop</a>
      <p id="hint" class="hint">Połóżcie palce na ekranie</p>
      <p id="counter" class="counter" hidden></p>
    </div>
    <script type="module" src="/src/picker/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Add picker input to vite.config.ts**

In `build.rolldownOptions.input` add:
```ts
        picker: page('picker/index.html'),
```

- [ ] **Step 7: Write src/picker/style.css**

```css
html,
body {
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.stage {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--bg);
  transition: background 0.4s ease;
}

.back {
  position: absolute;
  top: calc(var(--safe-top) + 12px);
  left: 16px;
  padding: 10px 14px;
  color: var(--muted);
  font-size: 14px;
  z-index: 2;
}

.hint {
  position: absolute;
  left: 24px;
  right: 24px;
  top: 40%;
  margin: 0;
  text-align: center;
  color: var(--muted);
  font-size: 20px;
  pointer-events: none;
  transition: opacity 0.3s;
}

.counter {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(var(--safe-bottom) + 24px);
  margin: 0;
  text-align: center;
  color: var(--muted);
  font-size: 16px;
  pointer-events: none;
}

.finger {
  position: absolute;
  width: 110px;
  height: 110px;
  margin: -55px 0 0 -55px;
  border-radius: 50%;
  border: 6px solid var(--finger-color);
  background: color-mix(in srgb, var(--finger-color) 25%, transparent);
  pointer-events: none;
  transition:
    opacity 0.25s,
    transform 0.25s;
}

.stage.is-armed .finger {
  animation: pulse var(--pulse, 0.9s) ease-in-out infinite;
}

.finger.is-out {
  opacity: 0;
  transform: scale(0.4);
}

.finger.is-winner {
  animation: none;
  transform: scale(1.6);
  background: var(--finger-color);
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.25);
  }
}
```

- [ ] **Step 8: Write src/picker/main.ts**

```ts
import '../shared/theme.css';
import './style.css';
import { shuffle } from './random';

type Phase = 'idle' | 'armed' | 'picking' | 'result';

interface Finger {
  id: number;
  color: string;
  el: HTMLDivElement;
}

const COLORS = [
  '#f5b301',
  '#ff5c5c',
  '#4fc3f7',
  '#81c784',
  '#ba68c8',
  '#ffb74d',
  '#4db6ac',
  '#f06292',
  '#aed581',
  '#7986cb',
  '#e57373',
];
const STABLE_MS = 2000; // no finger added/removed for this long → start picking
const FAST_PULSE_AFTER_MS = 1200; // switch to faster pulse partway through the wait
const ELIMINATE_STEP_MS = 350;

const stage = document.querySelector<HTMLElement>('#stage')!;
const hint = document.querySelector<HTMLElement>('#hint')!;
const counter = document.querySelector<HTMLElement>('#counter')!;

const fingers = new Map<number, Finger>();
const activePointers = new Set<number>();
let phase: Phase = 'idle';
let stableTimer: number | undefined;
let fastTimer: number | undefined;

function pickColor(): string {
  const used = new Set([...fingers.values()].map((f) => f.color));
  return COLORS.find((c) => !used.has(c)) ?? COLORS[fingers.size % COLORS.length]!;
}

function place(el: HTMLElement, x: number, y: number): void {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

function updateText(): void {
  const n = fingers.size;
  counter.hidden = n === 0 || phase === 'result';
  counter.textContent = `Palców: ${n}`;
  if (phase === 'idle') {
    hint.textContent = n === 0 ? 'Połóżcie palce na ekranie' : 'Potrzeba co najmniej 2 palców';
    hint.style.opacity = '1';
  } else if (phase === 'armed') {
    hint.textContent = 'Trzymajcie…';
    hint.style.opacity = '1';
  } else if (phase === 'picking') {
    hint.style.opacity = '0';
  } else {
    hint.textContent = 'Zaczyna ten palec! Oderwijcie palce, aby losować ponownie';
    hint.style.opacity = '1';
  }
}

function clearTimers(): void {
  window.clearTimeout(stableTimer);
  window.clearTimeout(fastTimer);
  stage.classList.remove('is-armed');
  stage.style.removeProperty('--pulse');
}

/** Called whenever the finger set changes while not picking. */
function rearm(): void {
  clearTimers();
  if (fingers.size >= 2) {
    phase = 'armed';
    stage.classList.add('is-armed');
    stage.style.setProperty('--pulse', '0.9s');
    fastTimer = window.setTimeout(() => stage.style.setProperty('--pulse', '0.4s'), FAST_PULSE_AFTER_MS);
    stableTimer = window.setTimeout(startPick, STABLE_MS);
  } else {
    phase = 'idle';
  }
  updateText();
}

function startPick(): void {
  clearTimers();
  phase = 'picking';
  updateText();
  const order = shuffle([...fingers.values()]);
  const winner = order.pop()!;
  order.forEach((f, i) => {
    window.setTimeout(() => f.el.classList.add('is-out'), ELIMINATE_STEP_MS * (i + 1));
  });
  window.setTimeout(() => {
    winner.el.classList.add('is-winner');
    stage.style.background = winner.color;
    navigator.vibrate?.([80, 60, 200]);
    phase = 'result';
    updateText();
    if (activePointers.size === 0) reset();
  }, ELIMINATE_STEP_MS * (order.length + 1));
}

function reset(): void {
  clearTimers();
  fingers.forEach((f) => f.el.remove());
  fingers.clear();
  stage.style.background = '';
  phase = 'idle';
  updateText();
}

stage.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  activePointers.add(e.pointerId);
  if (phase === 'picking' || phase === 'result') return;
  stage.setPointerCapture(e.pointerId);
  const el = document.createElement('div');
  el.className = 'finger';
  const color = pickColor();
  el.style.setProperty('--finger-color', color);
  place(el, e.clientX, e.clientY);
  stage.append(el);
  fingers.set(e.pointerId, { id: e.pointerId, color, el });
  rearm();
});

stage.addEventListener('pointermove', (e) => {
  const f = fingers.get(e.pointerId);
  if (f && phase !== 'result') place(f.el, e.clientX, e.clientY);
});

function lift(e: PointerEvent): void {
  activePointers.delete(e.pointerId);
  if (phase === 'result') {
    if (activePointers.size === 0) reset();
    return;
  }
  if (phase === 'picking') return; // decided already; wait for result
  const f = fingers.get(e.pointerId);
  if (f) {
    f.el.remove();
    fingers.delete(e.pointerId);
    rearm();
  }
}
stage.addEventListener('pointerup', lift);
stage.addEventListener('pointercancel', lift);

// Block long-press context menus and any residual touch gestures.
stage.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

updateText();
```

Note: the `touchstart` preventDefault also blocks the "← Tabletop" link on touch devices. Fix by exempting it: replace both `document.addEventListener('touch…')` lines with:

```ts
for (const type of ['touchstart', 'touchmove'] as const) {
  document.addEventListener(
    type,
    (e) => {
      if (!(e.target as HTMLElement).closest('.back')) e.preventDefault();
    },
    { passive: false },
  );
}
```

- [ ] **Step 9: Verify on a phone**

Run: `npm run dev` and open the LAN URL + `/tabletop/picker/` on a phone.
Expected:
- One finger: colored ring follows it, hint says "Potrzeba co najmniej 2 palców", counter "Palców: 1".
- Two or more fingers held still: rings pulse, faster after ~1s, after 2s rings vanish one by one, last one grows and the background takes its color; phone vibrates (Android).
- Lifting a finger during pulsing restarts the wait.
- Lifting all fingers after the result clears the screen.
- No pull-to-refresh, no zoom, no text selection, no long-press menu. "← Tabletop" still works.

Run: `npm run build` → succeeds, `dist/picker/index.html` exists.

- [ ] **Step 10: Commit**

```bash
git add picker src/picker vite.config.ts
git commit -m "feat(picker): finger-based who-starts picker"
```

---

### Task 7: Flip 7 scoring

**Files:**
- Create: `src/flip7/scoring.ts`, `src/flip7/scoring.test.ts`

**Interfaces:**
- Produces:
  - `type Modifier = '+2' | '+4' | '+6' | '+8' | '+10' | 'x2'`
  - `const NUMBER_CARDS: readonly number[]` (0..12)
  - `const MODIFIERS: readonly Modifier[]`
  - `interface RoundResult { score: number; busted: boolean; flip7Bonus: boolean }`
  - `scoreRound(numbers: number[], modifiers: Modifier[]): RoundResult`

- [ ] **Step 1: Write the failing tests**

`src/flip7/scoring.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { MODIFIERS, NUMBER_CARDS, scoreRound } from './scoring';

describe('scoreRound', () => {
  it('scores zero for no cards', () => {
    expect(scoreRound([], [])).toEqual({ score: 0, busted: false, flip7Bonus: false });
  });

  it('sums number cards', () => {
    expect(scoreRound([3, 5, 12], [])).toEqual({ score: 20, busted: false, flip7Bonus: false });
  });

  it('busts on a duplicate number and scores zero even with modifiers', () => {
    expect(scoreRound([3, 3, 7], ['+10', 'x2'])).toEqual({
      score: 0,
      busted: true,
      flip7Bonus: false,
    });
  });

  it('doubles only the number sum with x2', () => {
    expect(scoreRound([5, 6], ['x2']).score).toBe(22);
  });

  it('adds bonus modifiers after doubling', () => {
    expect(scoreRound([5], ['x2', '+4']).score).toBe(14);
    expect(scoreRound([5], ['+4', '+2']).score).toBe(11);
  });

  it('adds 15 for seven unique number cards', () => {
    const r = scoreRound([0, 1, 2, 3, 4, 5, 6], []);
    expect(r).toEqual({ score: 21 + 15, busted: false, flip7Bonus: true });
  });

  it('applies x2 before the flip 7 bonus', () => {
    expect(scoreRound([0, 1, 2, 3, 4, 5, 6], ['x2']).score).toBe(42 + 15);
  });

  it('does not award the bonus for seven cards containing a duplicate', () => {
    expect(scoreRound([1, 1, 2, 3, 4, 5, 6], []).busted).toBe(true);
  });

  it('exposes the card sets', () => {
    expect(NUMBER_CARDS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(MODIFIERS).toEqual(['+2', '+4', '+6', '+8', '+10', 'x2']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/flip7/scoring.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement scoring.ts**

```ts
export type Modifier = '+2' | '+4' | '+6' | '+8' | '+10' | 'x2';

export const NUMBER_CARDS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const MODIFIERS: readonly Modifier[] = ['+2', '+4', '+6', '+8', '+10', 'x2'];

export interface RoundResult {
  score: number;
  busted: boolean;
  flip7Bonus: boolean;
}

const FLIP7_BONUS = 15;
const FLIP7_COUNT = 7;

/**
 * Flip 7 round score:
 * - duplicate number card → bust, 0 points
 * - sum of number cards, doubled by x2, plus bonus modifiers
 * - seven unique number cards → +15
 */
export function scoreRound(numbers: number[], modifiers: Modifier[]): RoundResult {
  const busted = new Set(numbers).size !== numbers.length;
  if (busted) return { score: 0, busted: true, flip7Bonus: false };

  let score = numbers.reduce((sum, n) => sum + n, 0);
  if (modifiers.includes('x2')) score *= 2;
  for (const m of modifiers) {
    if (m !== 'x2') score += Number(m.slice(1));
  }
  const flip7Bonus = numbers.length === FLIP7_COUNT;
  if (flip7Bonus) score += FLIP7_BONUS;
  return { score, busted: false, flip7Bonus };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/flip7/scoring.test.ts`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add src/flip7/scoring.ts src/flip7/scoring.test.ts
git commit -m "feat(flip7): pure round scoring"
```

---

### Task 8: Flip 7 game state

**Files:**
- Create: `src/flip7/game.ts`, `src/flip7/game.test.ts`

**Interfaces:**
- Produces:
  - `interface Player { id: string; name: string }`
  - `interface Round { scores: Record<string, number> }`
  - `interface Game { version: 1; id: string; createdAt: string; finishedAt?: string; players: Player[]; target: number; dealerIndex: number; rounds: Round[]; winnerId?: string }`
  - `createGame(names: string[], target: number): Game` (throws if fewer than 2 names)
  - `totals(game: Game): Record<string, number>`
  - `addRound(game: Game, scores: Record<string, number>): Game` (pure; throws if a player's score is missing)
  - `undoLastRound(game: Game): Game` (pure; no-op when no rounds)
  - `isFinished(game: Game): boolean`
  - `standings(game: Game): { player: Player; total: number }[]` (sorted desc)
  - `currentDealer(game: Game): Player`

- [ ] **Step 1: Write the failing tests**

`src/flip7/game.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  addRound,
  createGame,
  currentDealer,
  isFinished,
  standings,
  totals,
  undoLastRound,
} from './game';

const game = () => createGame(['Ala', 'Bartek', 'Celina'], 200);

describe('createGame', () => {
  it('creates players with stable ids and dealer 0', () => {
    const g = game();
    expect(g.version).toBe(1);
    expect(g.players.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(g.players.map((p) => p.name)).toEqual(['Ala', 'Bartek', 'Celina']);
    expect(g.dealerIndex).toBe(0);
    expect(g.rounds).toEqual([]);
    expect(g.target).toBe(200);
    expect(typeof g.id).toBe('string');
    expect(Number.isNaN(Date.parse(g.createdAt))).toBe(false);
  });

  it('throws for fewer than 2 players', () => {
    expect(() => createGame(['Solo'], 200)).toThrow();
  });
});

describe('addRound', () => {
  it('appends the round, sums totals and rotates the dealer', () => {
    const g1 = addRound(game(), { p1: 10, p2: 0, p3: 25 });
    expect(g1.rounds).toHaveLength(1);
    expect(totals(g1)).toEqual({ p1: 10, p2: 0, p3: 25 });
    expect(g1.dealerIndex).toBe(1);
    expect(currentDealer(g1).name).toBe('Bartek');
    const g2 = addRound(addRound(g1, { p1: 1, p2: 1, p3: 1 }), { p1: 1, p2: 1, p3: 1 });
    expect(g2.dealerIndex).toBe(0);
  });

  it('does not mutate the input game', () => {
    const g = game();
    addRound(g, { p1: 1, p2: 2, p3: 3 });
    expect(g.rounds).toEqual([]);
    expect(g.dealerIndex).toBe(0);
  });

  it('throws when a player score is missing', () => {
    expect(() => addRound(game(), { p1: 1, p2: 2 })).toThrow();
  });

  it('finishes the game when someone reaches the target', () => {
    const g = addRound(game(), { p1: 200, p2: 50, p3: 0 });
    expect(isFinished(g)).toBe(true);
    expect(g.winnerId).toBe('p1');
    expect(typeof g.finishedAt).toBe('string');
  });

  it('keeps playing on a tie at the top', () => {
    const g = addRound(game(), { p1: 200, p2: 200, p3: 0 });
    expect(isFinished(g)).toBe(false);
    expect(g.winnerId).toBeUndefined();
  });

  it('picks the highest total, not the first to cross', () => {
    const g = addRound(game(), { p1: 201, p2: 230, p3: 0 });
    expect(g.winnerId).toBe('p2');
  });
});

describe('undoLastRound', () => {
  it('removes the last round, restores dealer and clears the winner', () => {
    const g = addRound(addRound(game(), { p1: 1, p2: 1, p3: 1 }), { p1: 250, p2: 0, p3: 0 });
    expect(isFinished(g)).toBe(true);
    const u = undoLastRound(g);
    expect(u.rounds).toHaveLength(1);
    expect(u.dealerIndex).toBe(1);
    expect(u.winnerId).toBeUndefined();
    expect(u.finishedAt).toBeUndefined();
  });

  it('is a no-op with no rounds', () => {
    const g = game();
    expect(undoLastRound(g)).toEqual(g);
  });
});

describe('standings', () => {
  it('sorts by total descending', () => {
    const g = addRound(game(), { p1: 5, p2: 20, p3: 10 });
    expect(standings(g).map((s) => s.player.id)).toEqual(['p2', 'p3', 'p1']);
    expect(standings(g)[0]!.total).toBe(20);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/flip7/game.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement game.ts**

```ts
export interface Player {
  id: string;
  name: string;
}

export interface Round {
  scores: Record<string, number>;
}

export interface Game {
  version: 1;
  id: string;
  createdAt: string;
  finishedAt?: string;
  players: Player[];
  target: number;
  dealerIndex: number;
  rounds: Round[];
  winnerId?: string;
}

export function createGame(names: string[], target: number): Game {
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (cleaned.length < 2) throw new Error('Potrzeba co najmniej 2 graczy');
  return {
    version: 1,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    players: cleaned.map((name, i) => ({ id: `p${i + 1}`, name })),
    target,
    dealerIndex: 0,
    rounds: [],
  };
}

export function totals(game: Game): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of game.players) out[p.id] = 0;
  for (const round of game.rounds) {
    for (const p of game.players) out[p.id] = (out[p.id] ?? 0) + (round.scores[p.id] ?? 0);
  }
  return out;
}

function findWinner(game: Game, sums: Record<string, number>): string | undefined {
  const reached = game.players.some((p) => (sums[p.id] ?? 0) >= game.target);
  if (!reached) return undefined;
  const max = Math.max(...game.players.map((p) => sums[p.id] ?? 0));
  const leaders = game.players.filter((p) => sums[p.id] === max);
  return leaders.length === 1 ? leaders[0]!.id : undefined;
}

export function addRound(game: Game, scores: Record<string, number>): Game {
  for (const p of game.players) {
    if (typeof scores[p.id] !== 'number') throw new Error(`Brak wyniku dla gracza ${p.name}`);
  }
  const next: Game = {
    ...game,
    rounds: [...game.rounds, { scores: { ...scores } }],
    dealerIndex: (game.dealerIndex + 1) % game.players.length,
  };
  delete next.winnerId;
  delete next.finishedAt;
  const winnerId = findWinner(next, totals(next));
  if (winnerId) {
    next.winnerId = winnerId;
    next.finishedAt = new Date().toISOString();
  }
  return next;
}

export function undoLastRound(game: Game): Game {
  if (game.rounds.length === 0) return game;
  const n = game.players.length;
  const next: Game = {
    ...game,
    rounds: game.rounds.slice(0, -1),
    dealerIndex: (game.dealerIndex - 1 + n) % n,
  };
  delete next.winnerId;
  delete next.finishedAt;
  return next;
}

export function isFinished(game: Game): boolean {
  return game.winnerId !== undefined;
}

export function currentDealer(game: Game): Player {
  return game.players[game.dealerIndex] ?? game.players[0]!;
}

export function standings(game: Game): { player: Player; total: number }[] {
  const sums = totals(game);
  return game.players
    .map((player) => ({ player, total: sums[player.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/flip7/game.test.ts`
Expected: 11 passed.

- [ ] **Step 5: Commit**

```bash
git add src/flip7/game.ts src/flip7/game.test.ts
git commit -m "feat(flip7): pure game state with rounds, dealer rotation and winner detection"
```

---

### Task 9: Flip 7 storage

**Files:**
- Create: `src/flip7/storage.ts`, `src/flip7/storage.test.ts`

**Interfaces:**
- Consumes: `read`, `write`, `remove` from `src/shared/storage.ts`; `Game` from `./game`
- Produces:
  - `loadCurrent(): Game | null`, `saveCurrent(game: Game): boolean`, `clearCurrent(): void`
  - `loadHistory(): Game[]`, `archiveGame(game: Game): boolean`, `deleteFromHistory(id: string): boolean`
  - `loadLastPlayers(): string[]`, `saveLastPlayers(names: string[]): boolean`

- [ ] **Step 1: Write the failing tests**

`src/flip7/storage.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGame } from './game';
import {
  archiveGame,
  clearCurrent,
  deleteFromHistory,
  loadCurrent,
  loadHistory,
  loadLastPlayers,
  saveCurrent,
  saveLastPlayers,
} from './storage';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
});

describe('current game', () => {
  it('round-trips under flip7:current', () => {
    const g = createGame(['A', 'B'], 200);
    expect(saveCurrent(g)).toBe(true);
    expect(localStorage.getItem('flip7:current')).not.toBeNull();
    expect(loadCurrent()).toEqual(g);
    clearCurrent();
    expect(loadCurrent()).toBeNull();
  });

  it('ignores data with an unknown version', () => {
    localStorage.setItem('flip7:current', JSON.stringify({ version: 99 }));
    expect(loadCurrent()).toBeNull();
  });
});

describe('history', () => {
  it('prepends archived games and deletes by id', () => {
    const a = createGame(['A', 'B'], 200);
    const b = createGame(['C', 'D'], 200);
    archiveGame(a);
    archiveGame(b);
    expect(loadHistory().map((g) => g.id)).toEqual([b.id, a.id]);
    expect(deleteFromHistory(a.id)).toBe(true);
    expect(loadHistory().map((g) => g.id)).toEqual([b.id]);
  });

  it('keeps at most 100 games', () => {
    for (let i = 0; i < 105; i++) archiveGame(createGame(['A', 'B'], 200));
    expect(loadHistory()).toHaveLength(100);
  });

  it('returns an empty list for missing or malformed data', () => {
    expect(loadHistory()).toEqual([]);
    localStorage.setItem('flip7:history', JSON.stringify({ version: 1, games: 'nope' }));
    expect(loadHistory()).toEqual([]);
  });
});

describe('last players', () => {
  it('round-trips names', () => {
    expect(loadLastPlayers()).toEqual([]);
    saveLastPlayers(['Ala', 'Bartek']);
    expect(loadLastPlayers()).toEqual(['Ala', 'Bartek']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/flip7/storage.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement storage.ts**

```ts
import { read, remove, write } from '../shared/storage';
import type { Game } from './game';

const CURRENT = 'flip7:current';
const HISTORY = 'flip7:history';
const LAST_PLAYERS = 'flip7:lastPlayers';
const HISTORY_LIMIT = 100;

interface HistoryDoc {
  version: 1;
  games: Game[];
}

interface LastPlayersDoc {
  version: 1;
  names: string[];
}

function isGame(value: unknown): value is Game {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Game).version === 1 &&
    Array.isArray((value as Game).players) &&
    Array.isArray((value as Game).rounds)
  );
}

export function loadCurrent(): Game | null {
  const g = read<unknown>(CURRENT);
  return isGame(g) ? g : null;
}

export function saveCurrent(game: Game): boolean {
  return write(CURRENT, game);
}

export function clearCurrent(): void {
  remove(CURRENT);
}

export function loadHistory(): Game[] {
  const doc = read<HistoryDoc>(HISTORY);
  if (!doc || doc.version !== 1 || !Array.isArray(doc.games)) return [];
  return doc.games.filter(isGame);
}

function saveHistory(games: Game[]): boolean {
  return write<HistoryDoc>(HISTORY, { version: 1, games });
}

export function archiveGame(game: Game): boolean {
  const games = [game, ...loadHistory().filter((g) => g.id !== game.id)].slice(0, HISTORY_LIMIT);
  return saveHistory(games);
}

export function deleteFromHistory(id: string): boolean {
  return saveHistory(loadHistory().filter((g) => g.id !== id));
}

export function loadLastPlayers(): string[] {
  const doc = read<LastPlayersDoc>(LAST_PLAYERS);
  if (!doc || doc.version !== 1 || !Array.isArray(doc.names)) return [];
  return doc.names.filter((n) => typeof n === 'string');
}

export function saveLastPlayers(names: string[]): boolean {
  return write<LastPlayersDoc>(LAST_PLAYERS, { version: 1, names });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/flip7/storage.test.ts`
Expected: 6 passed. Then `npm test` → all suites pass.

- [ ] **Step 5: Commit**

```bash
git add src/flip7/storage.ts src/flip7/storage.test.ts
git commit -m "feat(flip7): persistence for current game, history and last players"
```

---

### Task 10: Flip 7 shell, DOM helpers and start screen

**Files:**
- Create: `flip7/index.html`, `src/flip7/main.ts`, `src/flip7/style.css`, `src/flip7/views/dom.ts`, `src/flip7/views/dom.test.ts`, `src/flip7/views/start.ts`
- Modify: `vite.config.ts` (add `flip7` input)

**Interfaces:**
- Consumes: `createGame`, `Game` from `../game`; storage functions from `../storage`
- Produces:
  - `esc(s: string): string`, `toast(message: string): void` in `views/dom.ts`
  - `renderStart(root: HTMLElement, props: StartProps): void` with `StartProps { lastPlayers: string[]; onStart(names: string[], target: number): void; onHistory(): void }`
  - In `main.ts`: `type Screen`, `go(screen)`, `render()` – later tasks add cases to the `switch` in `render()`.

- [ ] **Step 1: Write failing test for esc()**

`src/flip7/views/dom.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { esc } from './dom';

describe('esc', () => {
  it('escapes HTML special characters', () => {
    expect(esc(`<b>"Ala" & 'Ola'</b>`)).toBe('&lt;b&gt;&quot;Ala&quot; &amp; &#39;Ola&#39;&lt;/b&gt;');
  });
  it('leaves plain text alone', () => {
    expect(esc('Żółć 7')).toBe('Żółć 7');
  });
});
```

Run: `npm test -- src/flip7/views/dom.test.ts` → FAIL (module not found).

- [ ] **Step 2: Implement views/dom.ts**

```ts
const MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape untrusted text (player names) before interpolating into innerHTML. */
export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => MAP[c] ?? c);
}

/** Short non-blocking notice at the bottom of the screen. */
export function toast(message: string): void {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  window.setTimeout(() => el.remove(), 2500);
}
```

Run: `npm test -- src/flip7/views/dom.test.ts` → 2 passed.

- [ ] **Step 3: Create flip7/index.html and register the input**

`flip7/index.html`:
```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#fff8e7" />
    <title>Flip 7 – Tabletop</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/flip7/main.ts"></script>
  </body>
</html>
```

In `vite.config.ts` `build.rolldownOptions.input` add:
```ts
        flip7: page('flip7/index.html'),
```

- [ ] **Step 4: Write src/flip7/style.css**

```css
:root {
  --f7-bg: #fff8e7;
  --f7-surface: #ffffff;
  --f7-ink: #1f1a2e;
  --f7-muted: #6f6a80;
  --f7-coral: #ff5a5f;
  --f7-teal: #00b4a6;
  --f7-yellow: #ffc93c;
  --f7-purple: #7b4fd6;
  --f7-line: #e9e2d0;
  --radius: 16px;
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  background: var(--f7-bg);
  color: var(--f7-ink);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

button,
input {
  font: inherit;
  color: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: calc(var(--safe-top) + 14px) 20px 6px;
}

.bar h1 {
  margin: 0;
  font-size: 26px;
  color: var(--f7-purple);
}

.bar__sub {
  color: var(--f7-muted);
  font-size: 14px;
}

.link {
  background: none;
  border: 0;
  padding: 10px 12px;
  color: var(--f7-purple);
  font-weight: 600;
}

.screen {
  display: grid;
  gap: 14px;
  padding: 8px 20px calc(var(--safe-bottom) + 24px);
}

.screen h2 {
  margin: 8px 0 0;
  font-size: 18px;
  color: var(--f7-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.btn {
  min-height: 52px;
  padding: 0 18px;
  border: 0;
  border-radius: var(--radius);
  font-size: 18px;
  font-weight: 700;
  background: var(--f7-surface);
  box-shadow: 0 1px 0 var(--f7-line);
}

.btn:disabled {
  opacity: 0.4;
}

.btn--primary {
  background: var(--f7-coral);
  color: #fff;
}

.btn--ghost {
  background: transparent;
  box-shadow: inset 0 0 0 2px var(--f7-line);
  font-weight: 600;
}

.row {
  display: flex;
  gap: 10px;
}

.row > * {
  flex: 1;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.field input {
  width: 90px;
  min-height: 48px;
  padding: 0 12px;
  border: 2px solid var(--f7-line);
  border-radius: 12px;
  background: var(--f7-surface);
  font-size: 18px;
  text-align: center;
}

.error {
  margin: 0;
  color: var(--f7-coral);
  font-weight: 600;
}

/* start: player list */
.players {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.players__row {
  display: grid;
  grid-template-columns: 1fr 44px 44px 44px;
  gap: 6px;
}

.players__name {
  min-height: 48px;
  padding: 0 14px;
  border: 2px solid var(--f7-line);
  border-radius: 12px;
  background: var(--f7-surface);
  font-size: 17px;
}

.players__row button {
  min-height: 48px;
  border: 0;
  border-radius: 12px;
  background: var(--f7-surface);
  box-shadow: 0 1px 0 var(--f7-line);
  font-size: 18px;
}

/* table */
.scores {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.scores__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 56px;
  padding: 0 16px;
  border-radius: var(--radius);
  background: var(--f7-surface);
  font-size: 18px;
}

.scores__row.is-dealer {
  box-shadow: inset 0 0 0 3px var(--f7-yellow);
}

.scores__row small {
  color: var(--f7-muted);
  font-size: 12px;
  margin-left: 6px;
}

.scores__total {
  font-size: 24px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.rounds {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.rounds th,
.rounds td {
  padding: 6px 4px;
  text-align: right;
  border-bottom: 1px solid var(--f7-line);
}

.rounds th:first-child,
.rounds td:first-child {
  text-align: left;
  color: var(--f7-muted);
}

/* round entry */
.entry__who {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.entry__value {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  background: var(--f7-surface);
  font-size: 44px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.entry__value.is-bust {
  color: var(--f7-coral);
}

.entry__flags {
  min-height: 20px;
  text-align: center;
  color: var(--f7-teal);
  font-weight: 700;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.keypad .btn {
  min-height: 60px;
  font-size: 24px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.card {
  min-height: 56px;
  border: 0;
  border-radius: 12px;
  background: var(--f7-surface);
  box-shadow: inset 0 0 0 2px var(--f7-line);
  font-size: 20px;
  font-weight: 800;
}

.card.is-on {
  background: var(--f7-teal);
  color: #fff;
  box-shadow: none;
}

.card--mod.is-on {
  background: var(--f7-purple);
}

/* end + history */
.winner {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 28px 16px;
  border-radius: var(--radius);
  background: var(--f7-yellow);
  text-align: center;
}

.winner__name {
  font-size: 32px;
  font-weight: 900;
}

.history {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.history__item {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--f7-surface);
}

.history__meta {
  display: flex;
  justify-content: space-between;
  color: var(--f7-muted);
  font-size: 13px;
}

.history__line {
  font-size: 15px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--safe-bottom) + 20px);
  transform: translateX(-50%);
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--f7-ink);
  color: #fff;
  font-size: 14px;
  z-index: 10;
}
```

- [ ] **Step 5: Write views/start.ts**

```ts
import { esc } from './dom';

export interface StartProps {
  lastPlayers: string[];
  onStart(names: string[], target: number): void;
  onHistory(): void;
}

export function renderStart(root: HTMLElement, props: StartProps): void {
  const initial = props.lastPlayers.length >= 2 ? props.lastPlayers : ['', ''];
  root.innerHTML = `
    <header class="bar">
      <a class="link" href="../">← Tabletop</a>
      <h1>Flip 7</h1>
      <button class="link" data-action="history">Historia</button>
    </header>
    <main class="screen">
      <h2>Gracze</h2>
      <ul class="players" id="players"></ul>
      <button class="btn btn--ghost" data-action="add">+ Dodaj gracza</button>
      <label class="field">
        Gramy do
        <input id="target" type="number" inputmode="numeric" min="1" value="200" />
        punktów
      </label>
      <p class="error" id="error" hidden></p>
      <button class="btn btn--primary" data-action="start">Graj</button>
    </main>`;

  const list = root.querySelector<HTMLUListElement>('#players')!;
  const error = root.querySelector<HTMLElement>('#error')!;

  const addRow = (name: string): HTMLLIElement => {
    const li = document.createElement('li');
    li.className = 'players__row';
    li.innerHTML = `
      <input class="players__name" type="text" placeholder="Imię" autocomplete="off" value="${esc(name)}" />
      <button type="button" data-move="up" aria-label="W górę">↑</button>
      <button type="button" data-move="down" aria-label="W dół">↓</button>
      <button type="button" data-remove aria-label="Usuń">✕</button>`;
    list.append(li);
    return li;
  };
  initial.forEach(addRow);

  list.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const li = t.closest('li');
    if (!li) return;
    if (t.hasAttribute('data-remove')) li.remove();
    else if (t.dataset.move === 'up') li.previousElementSibling?.before(li);
    else if (t.dataset.move === 'down') li.nextElementSibling?.after(li);
  });

  root.querySelector('[data-action=add]')!.addEventListener('click', () => {
    addRow('').querySelector('input')!.focus();
  });
  root.querySelector('[data-action=history]')!.addEventListener('click', props.onHistory);
  root.querySelector('[data-action=start]')!.addEventListener('click', () => {
    const names = [...list.querySelectorAll<HTMLInputElement>('.players__name')]
      .map((i) => i.value.trim())
      .filter(Boolean);
    const target = Number(root.querySelector<HTMLInputElement>('#target')!.value);
    if (names.length < 2) {
      error.textContent = 'Potrzeba co najmniej 2 graczy';
      error.hidden = false;
      return;
    }
    if (!Number.isInteger(target) || target < 1) {
      error.textContent = 'Podaj poprawny próg punktów';
      error.hidden = false;
      return;
    }
    props.onStart(names, target);
  });
}
```

- [ ] **Step 6: Write src/flip7/main.ts (start screen only for now)**

```ts
import './style.css';
import type { Game } from './game';
import { createGame } from './game';
import * as store from './storage';
import { toast } from './views/dom';
import { renderStart } from './views/start';

export type Screen = { name: 'start' } | { name: 'table'; game: Game } | { name: 'history' };

const app = document.querySelector<HTMLElement>('#app')!;
let screen: Screen = initialScreen();

function initialScreen(): Screen {
  const current = store.loadCurrent();
  return current ? { name: 'table', game: current } : { name: 'start' };
}

function persist(game: Game): void {
  if (!store.saveCurrent(game)) toast('Nie udało się zapisać gry');
}

function go(next: Screen): void {
  screen = next;
  window.scrollTo(0, 0);
  render();
}

function render(): void {
  app.innerHTML = '';
  switch (screen.name) {
    case 'start':
      renderStart(app, {
        lastPlayers: store.loadLastPlayers(),
        onStart: (names, target) => {
          const game = createGame(names, target);
          store.saveLastPlayers(names);
          persist(game);
          go({ name: 'table', game });
        },
        onHistory: () => go({ name: 'history' }),
      });
      break;
    case 'table':
      app.textContent = `Tabela – ${screen.game.players.map((p) => p.name).join(', ')}`;
      break;
    case 'history':
      app.textContent = 'Historia';
      break;
  }
}

render();
```

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev`, open `/tabletop/flip7/`.
Expected: start screen with two empty name inputs, add/remove/reorder works, "Graj" with fewer than two names shows the error, with two names shows the placeholder "Tabela – …". Reload: lands on the placeholder table (current game persisted). Clear `flip7:current` in DevTools, reload: start screen with the two names pre-filled from `flip7:lastPlayers`.

Run: `npm run build` → succeeds, `dist/flip7/index.html` exists.

- [ ] **Step 8: Commit**

```bash
git add flip7 src/flip7 vite.config.ts
git commit -m "feat(flip7): app shell, styles and start screen"
```

---

### Task 11: Flip 7 table and keypad round entry

**Files:**
- Create: `src/flip7/views/table.ts`, `src/flip7/views/round.ts`
- Modify: `src/flip7/main.ts`

**Interfaces:**
- Consumes: `Game`, `totals`, `currentDealer`, `addRound`, `undoLastRound`, `isFinished` from `../game`; `Modifier`, `scoreRound` from `../scoring`; `esc` from `./dom`
- Produces:
  - `renderTable(root, props: TableProps)` with `TableProps { game: Game; onEndRound(): void; onUndo(): void; onNewGame(): void; onHistory(): void }`
  - `interface RoundDraft { index: number; scores: Record<string, number>; mode: 'keypad' | 'cards'; input: string; numbers: number[]; modifiers: Modifier[] }`
  - `newDraft(): RoundDraft`
  - `renderRound(root, props: RoundProps)` with `RoundProps { game: Game; draft: RoundDraft; onChange(draft: RoundDraft): void; onCancel(): void; onComplete(scores: Record<string, number>): void }`
  - The cards mode (Task 12) is rendered by `renderCards(container, draft, onChange)` – in this task `renderRound` calls a stub `renderCards` that only shows a "wkrótce" text; Task 12 replaces it.

- [ ] **Step 1: Write views/table.ts**

```ts
import { currentDealer, totals, type Game } from '../game';
import { esc } from './dom';

export interface TableProps {
  game: Game;
  onEndRound(): void;
  onUndo(): void;
  onNewGame(): void;
  onHistory(): void;
}

export function renderTable(root: HTMLElement, props: TableProps): void {
  const { game } = props;
  const sums = totals(game);
  const dealer = currentDealer(game);

  const rows = game.players
    .map(
      (p) => `
      <li class="scores__row ${p.id === dealer.id ? 'is-dealer' : ''}">
        <span>${esc(p.name)}${p.id === dealer.id ? '<small>rozdaje</small>' : ''}</span>
        <span class="scores__total">${sums[p.id] ?? 0}</span>
      </li>`,
    )
    .join('');

  const roundsTable =
    game.rounds.length === 0
      ? ''
      : `
      <details>
        <summary>Rundy</summary>
        <table class="rounds">
          <thead><tr><th>#</th>${game.players.map((p) => `<th>${esc(p.name)}</th>`).join('')}</tr></thead>
          <tbody>
            ${game.rounds
              .map(
                (r, i) =>
                  `<tr><td>${i + 1}</td>${game.players
                    .map((p) => `<td>${r.scores[p.id] ?? 0}</td>`)
                    .join('')}</tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </details>`;

  root.innerHTML = `
    <header class="bar">
      <h1>Flip 7</h1>
      <span class="bar__sub">Runda ${game.rounds.length + 1} · do ${game.target}</span>
    </header>
    <main class="screen">
      <ul class="scores">${rows}</ul>
      <button class="btn btn--primary" data-action="end-round">Zakończ rundę</button>
      ${roundsTable}
      <div class="row">
        <button class="btn btn--ghost" data-action="undo" ${game.rounds.length === 0 ? 'disabled' : ''}>Cofnij rundę</button>
        <button class="btn btn--ghost" data-action="new">Nowa gra</button>
      </div>
      <button class="link" data-action="history">Historia</button>
    </main>`;

  root.querySelector('[data-action=end-round]')!.addEventListener('click', props.onEndRound);
  root.querySelector('[data-action=undo]')!.addEventListener('click', props.onUndo);
  root.querySelector('[data-action=new]')!.addEventListener('click', props.onNewGame);
  root.querySelector('[data-action=history]')!.addEventListener('click', props.onHistory);
}
```

- [ ] **Step 2: Write views/round.ts (keypad mode; cards stub)**

```ts
import type { Game } from '../game';
import { scoreRound, type Modifier } from '../scoring';
import { esc } from './dom';

export interface RoundDraft {
  index: number;
  scores: Record<string, number>;
  mode: 'keypad' | 'cards';
  input: string;
  numbers: number[];
  modifiers: Modifier[];
}

export interface RoundProps {
  game: Game;
  draft: RoundDraft;
  onChange(draft: RoundDraft): void;
  onCancel(): void;
  onComplete(scores: Record<string, number>): void;
}

export function newDraft(): RoundDraft {
  return { index: 0, scores: {}, mode: 'keypad', input: '', numbers: [], modifiers: [] };
}

function currentValue(draft: RoundDraft): number {
  return draft.mode === 'keypad'
    ? Number(draft.input || '0')
    : scoreRound(draft.numbers, draft.modifiers).score;
}

export function renderRound(root: HTMLElement, props: RoundProps): void {
  const { game, draft } = props;
  const player = game.players[draft.index]!;
  const result = scoreRound(draft.numbers, draft.modifiers);
  const value = currentValue(draft);
  const isBust = draft.mode === 'cards' ? result.busted : draft.input === '0';

  root.innerHTML = `
    <header class="bar">
      <button class="link" data-action="back">← ${draft.index === 0 ? 'Anuluj' : 'Wstecz'}</button>
      <span class="bar__sub">Runda ${game.rounds.length + 1} · ${draft.index + 1}/${game.players.length}</span>
    </header>
    <main class="screen">
      <p class="entry__who">${esc(player.name)}</p>
      <div class="entry__value ${isBust ? 'is-bust' : ''}">${isBust && draft.mode === 'cards' ? 'BUST' : value}</div>
      <div class="entry__flags">${draft.mode === 'cards' && result.flip7Bonus ? 'Flip 7! +15' : ''}</div>
      <div id="pad"></div>
      <div class="row">
        <button class="btn btn--ghost" data-action="toggle">${draft.mode === 'keypad' ? 'Policz z kart' : 'Wpisz ręcznie'}</button>
        <button class="btn btn--primary" data-action="confirm">${draft.index + 1 < game.players.length ? 'Dalej' : 'Zakończ rundę'}</button>
      </div>
    </main>`;

  const pad = root.querySelector<HTMLElement>('#pad')!;
  if (draft.mode === 'keypad') renderKeypad(pad, draft, props.onChange);
  else renderCards(pad, draft, props.onChange);

  root.querySelector('[data-action=back]')!.addEventListener('click', () => {
    if (draft.index === 0) return props.onCancel();
    const prev = game.players[draft.index - 1]!;
    props.onChange({
      ...draft,
      index: draft.index - 1,
      mode: 'keypad',
      input: String(draft.scores[prev.id] ?? ''),
      numbers: [],
      modifiers: [],
    });
  });

  root.querySelector('[data-action=toggle]')!.addEventListener('click', () => {
    props.onChange(
      draft.mode === 'keypad'
        ? { ...draft, mode: 'cards', numbers: [], modifiers: [] }
        : { ...draft, mode: 'keypad', input: String(value) },
    );
  });

  root.querySelector('[data-action=confirm]')!.addEventListener('click', () => {
    const scores = { ...draft.scores, [player.id]: value };
    if (draft.index + 1 < game.players.length) {
      props.onChange({ ...draft, index: draft.index + 1, scores, mode: 'keypad', input: '', numbers: [], modifiers: [] });
    } else {
      props.onComplete(scores);
    }
  });
}

function renderKeypad(pad: HTMLElement, draft: RoundDraft, onChange: (d: RoundDraft) => void): void {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Bust', '0', '⌫'];
  pad.className = 'keypad';
  pad.innerHTML = keys.map((k) => `<button class="btn" data-key="${k}">${k}</button>`).join('');
  pad.addEventListener('click', (e) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>('[data-key]')?.dataset.key;
    if (!key) return;
    if (key === 'Bust') return onChange({ ...draft, input: '0' });
    if (key === '⌫') return onChange({ ...draft, input: draft.input.slice(0, -1) });
    const next = (draft.input === '0' ? '' : draft.input) + key;
    if (next.length <= 3) onChange({ ...draft, input: next });
  });
}

// Replaced with the real card picker in Task 12.
function renderCards(pad: HTMLElement, _draft: RoundDraft, _onChange: (d: RoundDraft) => void): void {
  pad.className = '';
  pad.textContent = 'Wybór kart – wkrótce';
}
```

- [ ] **Step 3: Wire table and round into main.ts**

Replace the contents of `src/flip7/main.ts` with:

```ts
import './style.css';
import type { Game } from './game';
import { addRound, createGame, isFinished, undoLastRound } from './game';
import * as store from './storage';
import { toast } from './views/dom';
import { renderStart } from './views/start';
import { renderTable } from './views/table';
import { newDraft, renderRound, type RoundDraft } from './views/round';

export type Screen =
  | { name: 'start' }
  | { name: 'table'; game: Game }
  | { name: 'round'; game: Game; draft: RoundDraft }
  | { name: 'end'; game: Game }
  | { name: 'history' };

const app = document.querySelector<HTMLElement>('#app')!;
let screen: Screen = initialScreen();

function initialScreen(): Screen {
  const current = store.loadCurrent();
  return current ? { name: 'table', game: current } : { name: 'start' };
}

function persist(game: Game): void {
  if (!store.saveCurrent(game)) toast('Nie udało się zapisać gry');
}

function go(next: Screen): void {
  screen = next;
  window.scrollTo(0, 0);
  render();
}

function render(): void {
  app.innerHTML = '';
  const s = screen;
  switch (s.name) {
    case 'start':
      renderStart(app, {
        lastPlayers: store.loadLastPlayers(),
        onStart: (names, target) => {
          const game = createGame(names, target);
          store.saveLastPlayers(names);
          persist(game);
          go({ name: 'table', game });
        },
        onHistory: () => go({ name: 'history' }),
      });
      break;

    case 'table':
      renderTable(app, {
        game: s.game,
        onEndRound: () => go({ name: 'round', game: s.game, draft: newDraft() }),
        onUndo: () => {
          const game = undoLastRound(s.game);
          persist(game);
          go({ name: 'table', game });
        },
        onNewGame: () => {
          if (confirm('Porzucić bieżącą grę? Nie trafi do historii.')) {
            store.clearCurrent();
            go({ name: 'start' });
          }
        },
        onHistory: () => go({ name: 'history' }),
      });
      break;

    case 'round':
      renderRound(app, {
        game: s.game,
        draft: s.draft,
        onChange: (draft) => go({ name: 'round', game: s.game, draft }),
        onCancel: () => go({ name: 'table', game: s.game }),
        onComplete: (scores) => {
          const game = addRound(s.game, scores);
          if (isFinished(game)) {
            if (!store.archiveGame(game)) toast('Nie udało się zapisać do historii');
            store.clearCurrent();
            go({ name: 'end', game });
          } else {
            persist(game);
            go({ name: 'table', game });
          }
        },
      });
      break;

    case 'end':
      app.textContent = `Koniec – wygrywa ${s.game.players.find((p) => p.id === s.game.winnerId)?.name}`;
      break;

    case 'history':
      app.textContent = 'Historia';
      break;
  }
}

render();
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`, open `/tabletop/flip7/`, start a game with 3 players, target 30.
Expected:
- Table shows three rows, first player marked "rozdaje", "Cofnij rundę" disabled.
- "Zakończ rundę": keypad, "Dalej" walks through players, "Wstecz" returns to the previous player with their value, "Anuluj" on the first player returns to the table.
- Entering 10/5/0 then finishing: table sums, dealer moves to the second player, the "Rundy" details list the round, undo works and re-enables correctly.
- A round pushing one player to ≥30 shows the placeholder "Koniec – wygrywa …" and `flip7:current` is gone while `flip7:history` has one game.
- Values cap at 3 digits; Bust sets 0; ⌫ deletes.

- [ ] **Step 5: Commit**

```bash
git add src/flip7
git commit -m "feat(flip7): game table and keypad round entry"
```

---

### Task 12: Flip 7 card picker mode

**Files:**
- Modify: `src/flip7/views/round.ts` (replace the `renderCards` stub)

**Interfaces:**
- Consumes: `NUMBER_CARDS`, `MODIFIERS`, `Modifier` from `../scoring`

- [ ] **Step 1: Replace the renderCards stub**

In `src/flip7/views/round.ts` change the scoring import to:
```ts
import { MODIFIERS, NUMBER_CARDS, scoreRound, type Modifier } from '../scoring';
```

Replace the stub `renderCards` with:

```ts
function renderCards(pad: HTMLElement, draft: RoundDraft, onChange: (d: RoundDraft) => void): void {
  pad.className = 'cards';
  const numberTiles = NUMBER_CARDS.map(
    (n) =>
      `<button class="card ${draft.numbers.includes(n) ? 'is-on' : ''}" data-number="${n}">${n}</button>`,
  );
  const modifierTiles = MODIFIERS.map(
    (m) =>
      `<button class="card card--mod ${draft.modifiers.includes(m) ? 'is-on' : ''}" data-modifier="${m}">${m}</button>`,
  );
  pad.innerHTML = [...numberTiles, ...modifierTiles].join('');

  pad.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.card');
    if (!btn) return;
    if (btn.dataset.number !== undefined) {
      const n = Number(btn.dataset.number);
      const numbers = draft.numbers.includes(n)
        ? draft.numbers.filter((x) => x !== n)
        : [...draft.numbers, n];
      onChange({ ...draft, numbers });
    } else if (btn.dataset.modifier !== undefined) {
      const m = btn.dataset.modifier as Modifier;
      const modifiers = draft.modifiers.includes(m)
        ? draft.modifiers.filter((x) => x !== m)
        : [...draft.modifiers, m];
      onChange({ ...draft, modifiers });
    }
  });
}
```

- [ ] **Step 2: Verify in the browser**

In a round, tap "Policz z kart":
- Tiles 0–12 and modifiers appear; tapping toggles them (teal for numbers, purple for modifiers).
- The big value updates live: 5+6 → 11, add x2 → 22, add +4 → 26.
- Selecting seven numbers shows "Flip 7! +15" and adds 15.
- "Wpisz ręcznie" returns to the keypad with the computed value pre-filled.
- "Dalej" stores the computed value.

- [ ] **Step 3: Commit**

```bash
git add src/flip7/views/round.ts
git commit -m "feat(flip7): compute round score from picked cards"
```

---

### Task 13: Flip 7 end screen and history

**Files:**
- Create: `src/flip7/views/end.ts`, `src/flip7/views/history.ts`
- Modify: `src/flip7/main.ts`

**Interfaces:**
- Consumes: `standings`, `Game` from `../game`; `esc` from `./dom`
- Produces:
  - `renderEnd(root, props: EndProps)` with `EndProps { game: Game; onRematch(): void; onHome(): void }`
  - `renderHistory(root, props: HistoryProps)` with `HistoryProps { games: Game[]; onDelete(id: string): void; onBack(): void }`

- [ ] **Step 1: Write views/end.ts**

```ts
import { standings, type Game } from '../game';
import { esc } from './dom';

export interface EndProps {
  game: Game;
  onRematch(): void;
  onHome(): void;
}

export function renderEnd(root: HTMLElement, props: EndProps): void {
  const { game } = props;
  const table = standings(game);
  const winner = game.players.find((p) => p.id === game.winnerId) ?? table[0]!.player;

  root.innerHTML = `
    <header class="bar"><h1>Flip 7</h1><span class="bar__sub">${game.rounds.length} rund</span></header>
    <main class="screen">
      <div class="winner">
        <span>Wygrywa</span>
        <span class="winner__name">${esc(winner.name)}</span>
      </div>
      <ul class="scores">
        ${table
          .map(
            (s) => `
          <li class="scores__row">
            <span>${esc(s.player.name)}</span>
            <span class="scores__total">${s.total}</span>
          </li>`,
          )
          .join('')}
      </ul>
      <button class="btn btn--primary" data-action="rematch">Rewanż</button>
      <button class="btn btn--ghost" data-action="home">Do startu</button>
    </main>`;

  root.querySelector('[data-action=rematch]')!.addEventListener('click', props.onRematch);
  root.querySelector('[data-action=home]')!.addEventListener('click', props.onHome);
}
```

- [ ] **Step 2: Write views/history.ts**

```ts
import { standings, type Game } from '../game';
import { esc } from './dom';

export interface HistoryProps {
  games: Game[];
  onDelete(id: string): void;
  onBack(): void;
}

const dateFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });

export function renderHistory(root: HTMLElement, props: HistoryProps): void {
  const items = props.games
    .map((g) => {
      const winner = g.players.find((p) => p.id === g.winnerId);
      const line = standings(g)
        .map((s) => `${esc(s.player.name)} ${s.total}`)
        .join(' · ');
      const when = g.finishedAt ?? g.createdAt;
      return `
        <li class="history__item" data-id="${g.id}">
          <div class="history__meta">
            <span>${dateFormat.format(new Date(when))}</span>
            <button class="link" data-delete>Usuń</button>
          </div>
          <strong>${winner ? `Wygrał(a) ${esc(winner.name)}` : 'Bez zwycięzcy'}</strong>
          <span class="history__line">${line}</span>
        </li>`;
    })
    .join('');

  root.innerHTML = `
    <header class="bar">
      <button class="link" data-action="back">← Wróć</button>
      <h1>Historia</h1>
      <span></span>
    </header>
    <main class="screen">
      ${props.games.length === 0 ? '<p class="bar__sub">Brak zakończonych gier.</p>' : `<ul class="history">${items}</ul>`}
    </main>`;

  root.querySelector('[data-action=back]')!.addEventListener('click', props.onBack);
  root.querySelector('.history')?.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (!t.hasAttribute('data-delete')) return;
    const id = t.closest<HTMLElement>('.history__item')!.dataset.id!;
    if (confirm('Usunąć tę grę z historii?')) props.onDelete(id);
  });
}
```

- [ ] **Step 3: Wire into main.ts**

Add imports:
```ts
import { renderEnd } from './views/end';
import { renderHistory } from './views/history';
```

Replace the `'end'` and `'history'` cases in `render()`:

```ts
    case 'end':
      renderEnd(app, {
        game: s.game,
        onRematch: () => {
          const game = createGame(
            s.game.players.map((p) => p.name),
            s.game.target,
          );
          persist(game);
          go({ name: 'table', game });
        },
        onHome: () => go({ name: 'start' }),
      });
      break;

    case 'history':
      renderHistory(app, {
        games: store.loadHistory(),
        onDelete: (id) => {
          store.deleteFromHistory(id);
          render();
        },
        onBack: () => go(initialScreen()),
      });
      break;
```

- [ ] **Step 4: Verify in the browser**

- Finish a game (target 30): yellow winner card, sorted standings, "Rewanż" starts a new game with the same players and the table shows round 1. "Do startu" shows the start screen with names pre-filled.
- "Historia" from start and from the table lists the finished game with date and standings; "Usuń" asks for confirmation and removes it; "← Wróć" returns to the table if a game is in progress, otherwise to start.
- Dashboard at `/tabletop/` shows the "w toku" badge on Flip 7 while a game is in progress and none after it finishes.

Run: `npm test && npm run build` → all green.

- [ ] **Step 5: Commit**

```bash
git add src/flip7
git commit -m "feat(flip7): end screen, rematch and history"
```

---

### Task 14: PWA manifest, icons, offline

**Files:**
- Create: `public/icon.svg`, generated PNGs in `public/`
- Modify: `vite.config.ts`, `index.html`, `picker/index.html`, `flip7/index.html`

- [ ] **Step 1: Create the source icon**

`public/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0f1115"/>
  <rect x="136" y="96" width="200" height="280" rx="24" fill="#f5b301" transform="rotate(-12 236 236)"/>
  <rect x="196" y="136" width="200" height="280" rx="24" fill="#ffffff" transform="rotate(8 296 276)"/>
  <text x="296" y="300" font-family="system-ui, sans-serif" font-size="140" font-weight="800" text-anchor="middle" fill="#0f1115" transform="rotate(8 296 276)">7</text>
</svg>
```

- [ ] **Step 2: Generate PNG icons**

Run:
```bash
npx --yes @vite-pwa/assets-generator --preset minimal-2023 public/icon.svg
```
Expected: `public/pwa-64x64.png`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`, `public/favicon.ico` created. If the generator fails, fall back to `npx --yes sharp-cli -i public/icon.svg -o public/pwa-512x512.png resize 512 512` and repeat for 192 and 180 (`apple-touch-icon-180x180.png`); skip the maskable variant.

- [ ] **Step 3: Configure vite-plugin-pwa**

In `vite.config.ts` add the import and plugin:

```ts
import { VitePWA } from 'vite-plugin-pwa';
```

```ts
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Tabletop',
        short_name: 'Tabletop',
        description: 'Liczniki punktów i narzędzia do gier karcianych',
        lang: 'pl',
        start_url: '/tabletop/',
        scope: '/tabletop/',
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
```

- [ ] **Step 4: Add head tags to all three HTML entries**

Inside `<head>` of `index.html`, `picker/index.html`, `flip7/index.html` add:
```html
    <link rel="icon" href="/tabletop/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/tabletop/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/tabletop/apple-touch-icon-180x180.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

Note: Vite dev server serves `public/` under the base path too, so `/tabletop/favicon.ico` works in both dev and prod.

- [ ] **Step 5: Verify**

Run: `npm run build && npm run preview`, open the preview URL + `/tabletop/`.
Expected:
- `dist/manifest.webmanifest` and `dist/sw.js` exist; `dist/index.html`, `dist/picker/index.html`, `dist/flip7/index.html` each contain a `registerSW` script tag or an inline registration snippet (`grep -l registerSW dist/index.html dist/picker/index.html dist/flip7/index.html`).
- In Chrome DevTools → Application → Manifest: no errors, icons listed. Service worker activated.
- Toggle "Offline" in DevTools Network and reload `/tabletop/`, `/tabletop/picker/`, `/tabletop/flip7/`: all load.

- [ ] **Step 6: Commit**

```bash
git add public vite.config.ts index.html picker/index.html flip7/index.html
git commit -m "feat: PWA manifest, icons and offline caching"
```

---

### Task 15: Format, final checks and phone QA

**Files:**
- Modify: any file Prettier touches

- [ ] **Step 1: Format and run everything**

```bash
npm run format
npm test
npm run build
```
Expected: all tests pass, build succeeds. Commit formatting only if it changed files:
```bash
git add -A && git commit -m "style: prettier"
```

- [ ] **Step 2: Phone QA checklist (record results in the final report)**

Run `npm run dev` and open the LAN URL on an iPhone (Safari) and, if available, an Android phone (Chrome):

- [ ] Dashboard: tiles readable at 360px, tap targets comfortable, badge appears with a game in progress.
- [ ] Picker: 2–5 fingers, pick works, no scroll/zoom/long-press artifacts, back link works.
- [ ] Flip 7: full game with 3 players to 30 points using both keypad and cards; undo; rematch; history delete; reload mid-game resumes at the table.
- [ ] Add to Home Screen from the dashboard: opens standalone with the Tabletop icon; instances open inside the standalone window (no Safari chrome).

- [ ] **Step 3: Report**

Summarise to the user: what works, anything that failed on device, and remind them to (a) push `main` to `origin` themselves and (b) set GitHub Pages source to "GitHub Actions" before the first deploy.
