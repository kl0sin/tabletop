import { beforeEach, describe, expect, it, vi } from 'vitest';
import { has, read, remove, write } from './storage';

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

describe('storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });

  it('returns null for a missing key', () => {
    expect(read('nope')).toBeNull();
    expect(has('nope')).toBe(false);
  });

  it('round-trips an object', () => {
    expect(write('k', { a: 1, b: ['x'] })).toBe(true);
    expect(read('k')).toEqual({ a: 1, b: ['x'] });
    expect(has('k')).toBe(true);
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem('k', '{oops');
    expect(read('k')).toBeNull();
  });

  it('removes a key', () => {
    write('k', 1);
    remove('k');
    expect(read('k')).toBeNull();
  });

  it('write returns false when setItem throws', () => {
    vi.stubGlobal('localStorage', {
      ...memoryStorage(),
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    expect(write('k', 1)).toBe(false);
  });

  it('degrades gracefully when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(read('k')).toBeNull();
    expect(write('k', 1)).toBe(false);
    expect(has('k')).toBe(false);
    expect(() => remove('k')).not.toThrow();
  });
});
