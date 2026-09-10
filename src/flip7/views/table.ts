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
  const max = Math.max(...game.players.map((p) => sums[p.id] ?? 0));
  const leaders = new Set(
    max > 0 ? game.players.filter((p) => sums[p.id] === max).map((p) => p.id) : [],
  );

  const rows = game.players
    .map((p) => {
      const total = sums[p.id] ?? 0;
      const pct = Math.min(100, Math.round((total / game.target) * 100));
      const isDealer = p.id === dealer.id;
      const isLeader = leaders.has(p.id);
      return `
      <li class="scores__row ${isDealer ? 'is-dealer' : ''} ${isLeader ? 'is-leader' : ''}">
        <span class="scores__name">
          ${esc(p.name)}
          ${isLeader ? '<span class="tag tag--lead">prowadzi</span>' : ''}
          ${isDealer ? '<span class="tag">rozdaje</span>' : ''}
        </span>
        <span class="scores__total">${total}</span>
        <span class="scores__bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
      </li>`;
    })
    .join('');

  const roundsTable =
    game.rounds.length === 0
      ? ''
      : `
      <details class="rounds-box">
        <summary>Przebieg rund</summary>
        <div class="rounds-scroll">
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
        </div>
      </details>`;

  root.innerHTML = `
    <header class="bar bar--3">
      <a class="link" href="../">← Tabletop</a>
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
