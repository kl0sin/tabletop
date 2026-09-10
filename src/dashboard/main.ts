import '../shared/theme.css';
import './style.css';
import { games } from '../shared/games';
import { iconFor } from './icons';

const app = document.querySelector<HTMLElement>('#app')!;
const base = import.meta.env.BASE_URL;

function render(): void {
  const tiles = games
    .map((g) => {
      const active = g.hasActiveGame?.() ?? false;
      return `
        <a class="tile" href="${base}${g.path}" style="--accent: ${g.accent}">
          <span class="tile__icon">${iconFor(g.id)}</span>
          <span class="tile__body">
            <span class="tile__name">${g.name}</span>
            <span class="tile__desc">${g.description}</span>
          </span>
          ${active ? '<span class="tile__badge">w toku</span>' : ''}
          <span class="tile__chevron" aria-hidden="true">›</span>
        </a>`;
    })
    .join('');

  app.innerHTML = `
    <div class="page">
      <header class="header">
        <h1 class="header__title">Tabletop</h1>
        <p class="header__sub">Gry i narzędzia przy stole</p>
      </header>
      <main class="grid">${tiles}</main>
    </div>`;
}

render();
// Re-render when returning via back/forward cache so "w toku" badges stay fresh.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) render();
});
