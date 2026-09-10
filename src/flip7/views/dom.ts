const MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape untrusted text (player names) before interpolating into innerHTML. */
export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => MAP[c] ?? c);
}

/** Short non-blocking notice at the bottom of the screen. */
export function toast(message: string): void {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  window.setTimeout(() => el.remove(), 2500);
}

/** Polish plural: plural(3, 'runda', 'rundy', 'rund') → "3 rundy". */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  let word = many;
  if (n === 1) word = one;
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = few;
  return `${n} ${word}`;
}
