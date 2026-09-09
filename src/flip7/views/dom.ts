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
