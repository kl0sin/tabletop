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
