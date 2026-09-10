import { standings, type Game } from '../game';
import { esc, plural } from './dom';

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
      const d = new Date(when);
      const dateText = Number.isNaN(d.getTime()) ? '—' : dateFormat.format(d);
      return `
        <li class="history__item" data-id="${g.id}">
          <div class="history__meta">
            <span>${dateText}</span>
            <button class="link" data-delete>Usuń</button>
          </div>
          <strong>${winner ? `${esc(winner.name)} wygrywa` : 'Bez zwycięzcy'}</strong>
          <span class="history__line">${line}</span>
          <span class="history__sub">${plural(g.rounds.length, 'runda', 'rundy', 'rund')} · do ${g.target}</span>
        </li>`;
    })
    .join('');

  root.innerHTML = `
    <header class="bar bar--3">
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
