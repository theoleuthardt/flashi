export interface Card {
  id: string;
  front: string;
  back: string;
  interval: number;
  ease: number;
  due: string; // YYYY-MM-DD
  reps: number;
}

export interface Topic {
  id: string;
  name: string;
  created: string;
}

export interface Deck {
  id: string;
  name: string;
  created: string;
  topicId?: string;
}

export interface FlashiData {
  topics: Topic[];
  decks: Deck[];
  cards: Record<string, Card[]>;
}

export type Rating = 0 | 1 | 2 | 3; // again, hard, good, easy

export type Screen = 'home' | 'topic' | 'study' | 'import' | 'done' | 'admin';
export type AppState = 'loading' | 'setup' | 'login' | 'app';
