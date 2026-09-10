import '../shared/theme.css';
import './style.css';
import { shuffle } from './random';

type Phase = 'idle' | 'armed' | 'picking' | 'result';

interface Finger {
  id: number;
  color: string;
  el: HTMLDivElement;
  x: number;
  y: number;
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
const FAST_AFTER_MS = 1200; // speed up pulse + ripples partway through the wait
const RIPPLE_SLOW_MS = 700;
const RIPPLE_FAST_MS = 350;
const ELIMINATE_FIRST_MS = 380; // first elimination step; later steps accelerate
const ELIMINATE_MIN_MS = 170;
const ELIMINATE_ACCEL_MS = 35;
const FLOOD_MS = 650; // colour flood duration before the result overlay appears

const stage = document.querySelector<HTMLElement>('#stage')!;
const hint = document.querySelector<HTMLElement>('#hint')!;
const counter = document.querySelector<HTMLElement>('#counter')!;
const progress = document.querySelector<HTMLElement>('#progress')!;
const result = document.querySelector<HTMLElement>('#result')!;
const again = document.querySelector<HTMLButtonElement>('#again')!;

const fingers = new Map<number, Finger>();
const activePointers = new Set<number>();
let phase: Phase = 'idle';
let stableTimer: number | undefined;
let fastTimer: number | undefined;
let rippleTimer: number | undefined;
let pending: number[] = []; // timeouts scheduled during picking/result

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
  counter.hidden = n === 0 || phase === 'result' || phase === 'picking';
  counter.textContent = `Palców: ${n}`;
  hint.classList.toggle('is-hidden', phase === 'picking' || phase === 'result');
  if (phase === 'idle') {
    hint.textContent = n === 0 ? 'Połóżcie palce na ekranie' : 'Potrzeba co najmniej 2 palców';
  } else if (phase === 'armed') {
    hint.textContent = 'Trzymajcie…';
  }
}

function setProgress(active: boolean): void {
  progress.style.transition = 'none';
  progress.style.width = '0%';
  if (!active) return;
  void progress.offsetWidth; // flush so the next transition starts from 0
  progress.style.transition = `width ${STABLE_MS}ms linear`;
  progress.style.width = '100%';
}

function spawnRipple(f: Finger): void {
  const r = document.createElement('div');
  r.className = 'ripple';
  r.style.setProperty('--finger-color', f.color);
  place(r, f.x, f.y);
  r.addEventListener('animationend', () => r.remove());
  stage.append(r);
}

function startRipples(interval: number): void {
  window.clearInterval(rippleTimer);
  rippleTimer = window.setInterval(() => fingers.forEach(spawnRipple), interval);
}

function clearTimers(): void {
  window.clearTimeout(stableTimer);
  window.clearTimeout(fastTimer);
  window.clearInterval(rippleTimer);
  pending.forEach((t) => window.clearTimeout(t));
  pending = [];
  stage.classList.remove('is-armed', 'is-fast');
  setProgress(false);
}

/** Called whenever the finger set changes while not picking. */
function rearm(): void {
  clearTimers();
  if (fingers.size >= 2) {
    phase = 'armed';
    stage.classList.add('is-armed');
    setProgress(true);
    startRipples(RIPPLE_SLOW_MS);
    fastTimer = window.setTimeout(() => {
      stage.classList.add('is-fast');
      startRipples(RIPPLE_FAST_MS);
    }, FAST_AFTER_MS);
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

  let at = 0;
  order.forEach((f, i) => {
    at += Math.max(ELIMINATE_MIN_MS, ELIMINATE_FIRST_MS - i * ELIMINATE_ACCEL_MS);
    pending.push(
      window.setTimeout(() => {
        f.el.classList.add('is-out');
        navigator.vibrate?.(15);
      }, at),
    );
  });

  pending.push(window.setTimeout(() => reveal(winner), at + 250));
}

function reveal(winner: Finger): void {
  winner.el.classList.add('is-winner');
  navigator.vibrate?.([60, 40, 60, 40, 220]);

  const flood = document.createElement('div');
  flood.className = 'flood';
  flood.style.setProperty('--finger-color', winner.color);
  flood.style.setProperty('--x', `${winner.x}px`);
  flood.style.setProperty('--y', `${winner.y}px`);
  stage.append(flood);
  void flood.offsetWidth;
  flood.classList.add('is-on');

  pending.push(
    window.setTimeout(() => {
      phase = 'result';
      result.hidden = false;
      updateText();
    }, FLOOD_MS),
  );
}

function reset(): void {
  clearTimers();
  fingers.forEach((f) => f.el.remove());
  fingers.clear();
  stage.querySelectorAll('.flood, .ripple').forEach((el) => el.remove());
  result.hidden = true;
  phase = 'idle';
  updateText();
}

again.addEventListener('click', reset);

stage.addEventListener('pointerdown', (e) => {
  const target = e.target as HTMLElement;
  if (target.closest('.back, .result')) return;
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
  fingers.set(e.pointerId, { id: e.pointerId, color, el, x: e.clientX, y: e.clientY });
  rearm();
});

stage.addEventListener('pointermove', (e) => {
  const f = fingers.get(e.pointerId);
  if (!f || phase === 'picking' || phase === 'result') return;
  f.x = e.clientX;
  f.y = e.clientY;
  place(f.el, f.x, f.y);
});

function lift(e: PointerEvent): void {
  activePointers.delete(e.pointerId);
  if (phase === 'picking' || phase === 'result') return; // decided; only the button resets
  const f = fingers.get(e.pointerId);
  if (f) {
    f.el.remove();
    fingers.delete(e.pointerId);
    rearm();
  }
}
stage.addEventListener('pointerup', lift);
stage.addEventListener('pointercancel', lift);

// Block long-press context menus and any residual touch gestures, except on real controls.
stage.addEventListener('contextmenu', (e) => e.preventDefault());
for (const type of ['touchstart', 'touchmove'] as const) {
  document.addEventListener(
    type,
    (e) => {
      if (!(e.target as HTMLElement).closest('.back, .result')) e.preventDefault();
    },
    { passive: false },
  );
}

updateText();
