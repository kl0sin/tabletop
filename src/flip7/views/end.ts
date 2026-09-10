import { standings, type Game } from '../game';
import { esc, plural } from './dom';

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
    <header class="bar">
      <h1>Flip 7</h1>
      <span class="bar__sub">${plural(game.rounds.length, 'runda', 'rundy', 'rund')} · do ${game.target}</span>
    </header>
    <main class="screen">
      <div class="winner">
        <span>Wygrywa</span>
        <span class="winner__name">${esc(winner.name)}</span>
      </div>
      <ul class="scores">
        ${table
          .map(
            (s, i) => `
          <li class="scores__row ${i === 0 ? 'is-leader' : ''}">
            <span class="scores__name"><span class="scores__place">${i + 1}.</span> ${esc(s.player.name)}</span>
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
