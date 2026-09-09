import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGame } from './game';
import {
  archiveGame,
  clearCurrent,
  deleteFromHistory,
  loadCurrent,
  loadHistory,
  loadLastPlayers,
  saveCurrent,
  saveLastPlayers,
} from './storage';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
});

describe('current game', () => {
  it('round-trips under flip7:current', () => {
    const g = createGame(['A', 'B'], 200);
    expect(saveCurrent(g)).toBe(true);
    expect(localStorage.getItem('flip7:current')).not.toBeNull();
    expect(loadCurrent()).toEqual(g);
    clearCurrent();
    expect(loadCurrent()).toBeNull();
  });

  it('ignores data with an unknown version', () => {
    localStorage.setItem('flip7:current', JSON.stringify({ version: 99 }));
    expect(loadCurrent()).toBeNull();
  });
});

describe('history', () => {
  it('prepends archived games and deletes by id', () => {
    const a = createGame(['A', 'B'], 200);
    const b = createGame(['C', 'D'], 200);
    archiveGame(a);
    archiveGame(b);
    expect(loadHistory().map((g) => g.id)).toEqual([b.id, a.id]);
    expect(deleteFromHistory(a.id)).toBe(true);
    expect(loadHistory().map((g) => g.id)).toEqual([b.id]);
  });

  it('keeps at most 100 games', () => {
    for (let i = 0; i < 105; i++) archiveGame(createGame(['A', 'B'], 200));
    expect(loadHistory()).toHaveLength(100);
  });

  it('returns an empty list for missing or malformed data', () => {
    expect(loadHistory()).toEqual([]);
    localStorage.setItem('flip7:history', JSON.stringify({ version: 1, games: 'nope' }));
    expect(loadHistory()).toEqual([]);
  });
});

describe('last players', () => {
  it('round-trips names', () => {
    expect(loadLastPlayers()).toEqual([]);
    saveLastPlayers(['Ala', 'Bartek']);
    expect(loadLastPlayers()).toEqual(['Ala', 'Bartek']);
  });
});
