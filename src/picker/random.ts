/** Uniform integer in [0, n) using crypto, with rejection sampling to avoid modulo bias. */
export function randomIndex(n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer');
  if (n === 1) return 0;
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0]!;
  } while (value >= limit);
  return value % n;
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
