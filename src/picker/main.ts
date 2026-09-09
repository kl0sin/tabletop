import '../shared/theme.css';
import './style.css';
import { shuffle } from './random';

type Phase = 'idle' | 'armed' | 'picking' | 'result';

interface Finger {
  id: number;
  color: string;
  el: HTMLDivElement;
}

const COLORS = [
  '#f5b301',
  '#ff5c5c',
  '#4fc3f7',
  '#81c784',
  '#ba68c8',
  '#ffb74d',
  '#4db6ac',
  '#f06292',
  '#aed581',
  '#7986cb',
  '#e57373',
];
const STABLE_MS = 2000; // no finger added/removed for this long → start picking
const FAST_PULSE_AFTER_MS = 1200; // switch to faster pulse partway through the wait
const ELIMINATE_STEP_MS = 350;
const RESULT_HOLD_MS = 1500; // keep the winner reveal on screen before auto-resetting

const stage = document.querySelector<HTMLElement>('#stage')!;
const hint = document.querySelector<HTMLElement>('#hint')!;
const counter = document.querySelector<HTMLElement>('#counter')!;

const fingers = new Map<number, Finger>();
const activePointers = new Set<number>();
let phase: Phase = 'idle';
let stableTimer: number | undefined;
let fastTimer: number | undefined;
let resultTimer: number | undefined;

function pickColor(): string {
  const used = new Set([...fingers.values()].map((f) => f.color));
  return COLORS.find((c) => !used.has(c)) ?? COLORS[fingers.size % COLORS.length]!;
}

function place(el: HTMLElement, x: number, y: number): void {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

function updateText(): void {
  const n = fingers.size;
  counter.hidden = n === 0 || phase === 'result';
  counter.textContent = `Palców: ${n}`;
  if (phase === 'idle') {
    hint.textContent = n === 0 ? 'Połóżcie palce na ekranie' : 'Potrzeba co najmniej 2 palców';
    hint.style.opacity = '1';
  } else if (phase === 'armed') {
    hint.textContent = 'Trzymajcie…';
    hint.style.opacity = '1';
  } else if (phase === 'picking') {
    hint.style.opacity = '0';
  } else {
    hint.textContent = 'Zaczyna ten palec! Oderwijcie palce, aby losować ponownie';
    hint.style.opacity = '1';
  }
}

function clearTimers(): void {
  window.clearTimeout(stableTimer);
  window.clearTimeout(fastTimer);
  window.clearTimeout(resultTimer);
  stage.classList.remove('is-armed');
  stage.style.removeProperty('--pulse');
}

/** Called whenever the finger set changes while not picking. */
function rearm(): void {
  clearTimers();
  if (fingers.size >= 2) {
    phase = 'armed';
    stage.classList.add('is-armed');
    stage.style.setProperty('--pulse', '0.9s');
    fastTimer = window.setTimeout(
      () => stage.style.setProperty('--pulse', '0.4s'),
      FAST_PULSE_AFTER_MS,
    );
    stableTimer = window.setTimeout(startPick, STABLE_MS);
  } else {
    phase = 'idle';
  }
  updateText();
}

function startPick(): void {
  clearTimers();
  phase = 'picking';
  updateText();
  const order = shuffle([...fingers.values()]);
  const winner = order.pop()!;
  order.forEach((f, i) => {
    window.setTimeout(() => f.el.classList.add('is-out'), ELIMINATE_STEP_MS * (i + 1));
  });
  window.setTimeout(
    () => {
      winner.el.classList.add('is-winner');
      stage.style.background = winner.color;
      navigator.vibrate?.([80, 60, 200]);
      phase = 'result';
      updateText();
      if (activePointers.size === 0) resultTimer = window.setTimeout(reset, RESULT_HOLD_MS);
    },
    ELIMINATE_STEP_MS * (order.length + 1),
  );
}

function reset(): void {
  clearTimers();
  fingers.forEach((f) => f.el.remove());
  fingers.clear();
  stage.style.background = '';
  phase = 'idle';
  updateText();
}

stage.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  activePointers.add(e.pointerId);
  if (phase === 'picking' || phase === 'result') return;
  stage.setPointerCapture(e.pointerId);
  const el = document.createElement('div');
  el.className = 'finger';
  const color = pickColor();
  el.style.setProperty('--finger-color', color);
  place(el, e.clientX, e.clientY);
  stage.append(el);
  fingers.set(e.pointerId, { id: e.pointerId, color, el });
  rearm();
});

stage.addEventListener('pointermove', (e) => {
  const f = fingers.get(e.pointerId);
  if (f && phase !== 'result') place(f.el, e.clientX, e.clientY);
});

function lift(e: PointerEvent): void {
  activePointers.delete(e.pointerId);
  if (phase === 'result') {
    if (activePointers.size === 0) reset();
    return;
  }
  if (phase === 'picking') return; // decided already; wait for result
  const f = fingers.get(e.pointerId);
  if (f) {
    f.el.remove();
    fingers.delete(e.pointerId);
    rearm();
  }
}
stage.addEventListener('pointerup', lift);
stage.addEventListener('pointercancel', lift);

// Block long-press context menus and any residual touch gestures.
stage.addEventListener('contextmenu', (e) => e.preventDefault());
for (const type of ['touchstart', 'touchmove'] as const) {
  document.addEventListener(
    type,
    (e) => {
      if (!(e.target as HTMLElement).closest('.back')) e.preventDefault();
    },
    { passive: false },
  );
}

updateText();
