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
