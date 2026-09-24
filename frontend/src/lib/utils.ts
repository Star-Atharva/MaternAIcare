import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const round1 = (v: number) => Math.round(v * 10) / 10;
export const uid = () => Math.random().toString(36).slice(2, 9);

export function seededRand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
export const clock = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s} sec ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h} h ago`;
}

export function genCTG(n = 260, base = 142, seed = 7) {
  const rand = seededRand(seed);
  let v = base;
  const fhr: number[] = [];
  const ua: number[] = [];
  for (let i = 0; i < n; i++) {
    v += (base - v) * 0.09 + (rand() - 0.5) * 4.2;
    fhr.push(v);
  }
  [40, 128, 196].forEach((s) => {
    for (let k = 0; k < 15; k++) {
      const idx = s + k;
      if (fhr[idx] != null) fhr[idx] += 17 * Math.sin((Math.PI * k) / 15);
    }
  });
  for (let k = 0; k < 22; k++) {
    const idx = 88 + k;
    if (fhr[idx] != null) fhr[idx] -= 24 * Math.sin((Math.PI * k) / 22);
  }
  for (let i = 0; i < n; i++) {
    ua.push(6 + 30 * Math.pow(Math.max(0, Math.sin(i / 32)), 6) + (rand() - 0.5) * 1.6);
  }
  return { fhr: fhr.map(round1), ua: ua.map(round1) };
}