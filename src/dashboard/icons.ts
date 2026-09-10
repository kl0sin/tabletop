/**
 * Inline SVG icons for dashboard tiles, keyed by instance id.
 * Icons are monochrome and use `currentColor`, so the tile decides the colour.
 */
const icons: Record<string, string> = {
  flip7: `
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9" y="11" width="18" height="26" rx="3" transform="rotate(-12 18 24)"
            fill="currentColor" opacity="0.35"/>
      <rect x="20" y="10" width="18" height="26" rx="3" transform="rotate(8 29 23)"
            fill="currentColor"/>
      <text x="29" y="28" font-family="system-ui, sans-serif" font-size="14" font-weight="800"
            text-anchor="middle" fill="var(--icon-ink, #0f1115)" transform="rotate(8 29 23)">7</text>
    </svg>`,
  picker: `
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="15" cy="18" r="6" stroke="currentColor" stroke-width="2.5" opacity="0.5"/>
      <circle cx="33" cy="15" r="6" stroke="currentColor" stroke-width="2.5" opacity="0.5"/>
      <circle cx="24" cy="32" r="7" fill="currentColor"/>
      <circle cx="24" cy="32" r="11.5" stroke="currentColor" stroke-width="2" opacity="0.4"/>
    </svg>`,
};

const fallback = `
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="24" cy="24" r="10" fill="currentColor"/>
  </svg>`;

export function iconFor(id: string): string {
  return icons[id] ?? fallback;
}
