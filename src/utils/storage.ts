import type { FlashiData } from '../types';

const KEY = 'flashi-data-v1';

export function loadData(): FlashiData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { topics: [], decks: [], cards: {} };
    const d = JSON.parse(raw) as FlashiData;
    // migrate old data without topics
    if (!d.topics) d.topics = [];
    return d;
  } catch {
    return { topics: [], decks: [], cards: {} };
  }
}

export function saveData(data: FlashiData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}
