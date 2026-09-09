import './style.css';
import type { Game } from './game';
import { addRound, createGame, isFinished, undoLastRound } from './game';
import * as store from './storage';
import { toast } from './views/dom';
import { renderStart } from './views/start';
import { renderTable } from './views/table';
import { newDraft, renderRound, type RoundDraft } from './views/round';
import { renderEnd } from './views/end';
import { renderHistory } from './views/history';

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
  }
}

render();
