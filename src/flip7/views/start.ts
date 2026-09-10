import { esc } from './dom';

export interface StartProps {
  lastPlayers: string[];
  onStart(names: string[], target: number): void;
  onHistory(): void;
}

export function renderStart(root: HTMLElement, props: StartProps): void {
  const initial = props.lastPlayers.length >= 2 ? props.lastPlayers : ['', ''];
  root.innerHTML = `
    <header class="bar bar--3">
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
