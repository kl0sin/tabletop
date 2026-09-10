import type { Game } from '../game';
import { MODIFIERS, NUMBER_CARDS, scoreRound, type Modifier } from '../scoring';
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
  const isEmpty = draft.mode === 'keypad' && draft.input === '';
  const isBust = draft.mode === 'cards' ? result.busted : draft.input === '0';
  const shown = isEmpty ? '–' : isBust && draft.mode === 'cards' ? 'BUST' : String(value);
  const flags =
    draft.mode === 'cards' && result.flip7Bonus
      ? 'Flip 7! +15'
      : draft.mode === 'keypad' && isBust
        ? 'Bust · 0 punktów'
        : '';

  root.innerHTML = `
    <header class="bar">
      <button class="link" data-action="back">← ${draft.index === 0 ? 'Anuluj' : 'Wstecz'}</button>
      <span class="bar__sub">Runda ${game.rounds.length + 1} · ${draft.index + 1}/${game.players.length}</span>
    </header>
    <main class="screen">
      <p class="entry__who">${esc(player.name)}</p>
      <div class="entry__value ${isBust ? 'is-bust' : ''} ${isEmpty ? 'is-empty' : ''}">${shown}</div>
      <div class="entry__flags ${flags.startsWith('Bust') ? 'is-bust' : ''}">${flags}</div>
      <div id="pad"></div>
      <div class="row">
        <button class="btn btn--ghost" data-action="toggle">${draft.mode === 'keypad' ? 'Policz z kart' : 'Wpisz ręcznie'}</button>
        <button class="btn btn--primary" data-action="confirm" ${isEmpty ? 'disabled' : ''}>${draft.index + 1 < game.players.length ? 'Dalej' : 'Zakończ rundę'}</button>
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
      props.onChange({
        ...draft,
        index: draft.index + 1,
        scores,
        mode: 'keypad',
        input: '',
        numbers: [],
        modifiers: [],
      });
    } else {
      props.onComplete(scores);
    }
  });
}

function renderKeypad(
  pad: HTMLElement,
  draft: RoundDraft,
  onChange: (d: RoundDraft) => void,
): void {
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

function renderCards(pad: HTMLElement, draft: RoundDraft, onChange: (d: RoundDraft) => void): void {
  pad.className = 'cards-groups';
  const numberTiles = NUMBER_CARDS.map((n) => {
    const count = draft.numbers.filter((x) => x === n).length;
    const isOn = count >= 1;
    const isDup = count >= 2;
    return `<button class="card ${isOn ? 'is-on' : ''} ${isDup ? 'is-dup' : ''}" data-number="${n}">${n}${isDup ? '<span class="card__dup">×2</span>' : ''}</button>`;
  });
  const modifierTiles = MODIFIERS.map(
    (m) =>
      `<button class="card card--mod ${draft.modifiers.includes(m) ? 'is-on' : ''}" data-modifier="${m}">${m}</button>`,
  );
  pad.innerHTML = `
    <p class="cards__label">Karty liczbowe <small>drugie dotknięcie = duplikat</small></p>
    <div class="cards">${numberTiles.join('')}</div>
    <p class="cards__label">Modyfikatory</p>
    <div class="cards cards--mods">${modifierTiles.join('')}</div>`;

  pad.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.card');
    if (!btn) return;
    if (btn.dataset.number !== undefined) {
      const n = Number(btn.dataset.number);
      const count = draft.numbers.filter((x) => x === n).length;
      // Cycle 0 -> 1 -> 2 -> 0: a second copy represents the duplicate that busted the player.
      const others = draft.numbers.filter((x) => x !== n);
      const nextCount = (count + 1) % 3;
      const numbers = [...others, ...Array<number>(nextCount).fill(n)];
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
