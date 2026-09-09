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
