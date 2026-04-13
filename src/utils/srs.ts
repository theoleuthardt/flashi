import type { Card, Rating } from '../types';

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function newCard(front: string, back: string): Card {
  return {
    id: Math.random().toString(36).slice(2),
    front,
    back,
    interval: 1,
    ease: 2.5,
    due: todayStr(),
    reps: 0,
  };
}

export function applyRating(card: Card, r: Rating): Card {
  let { interval, ease } = card;
  if (r === 0) {
    return { ...card, interval: 1, ease: Math.max(1.3, ease - 0.2), due: todayStr(), reps: 0 };
  }
  const easeAdj: Record<1 | 2 | 3, number> = { 1: -0.15, 2: 0, 3: 0.15 };
  ease = Math.max(1.3, ease + easeAdj[r as 1 | 2 | 3]);
  if (r === 1) interval = Math.max(1, Math.round(interval * 1.2));
  else if (r === 2) interval = Math.max(1, Math.round(interval * ease));
  else interval = Math.max(1, Math.round(interval * ease * 1.3));
  return { ...card, interval, ease, due: daysFromNow(interval), reps: card.reps + 1 };
}

export function nextIntervalLabel(card: Card, r: Rating): string {
  if (r === 0) return '<1d';
  let { interval, ease } = card;
  const easeAdj: Record<1 | 2 | 3, number> = { 1: -0.15, 2: 0, 3: 0.15 };
  ease = Math.max(1.3, ease + easeAdj[r as 1 | 2 | 3]);
  if (r === 1) interval = Math.max(1, Math.round(interval * 1.2));
  else if (r === 2) interval = Math.max(1, Math.round(interval * ease));
  else interval = Math.max(1, Math.round(interval * ease * 1.3));
  return `${interval}d`;
}

export function getDueCards(cards: Card[]): Card[] {
  const t = todayStr();
  return cards.filter((c) => c.due <= t);
}
