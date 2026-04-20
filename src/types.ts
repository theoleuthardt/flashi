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
  quizzes?: Quiz[];
}

// Each option is either a plain string or a [text, explanation] pair
export type QuizOption = string | [string, string];

export interface QuizQuestion {
  question: string;
  options: QuizOption[]; // 2–6 choices
  correct: number;       // 0-based index of the correct option
}

export interface Quiz {
  id: string;
  name: string;
  created: string;
  topicId?: string;
  questions: QuizQuestion[];
}

export interface QuizAnswer {
  questionIndex: number;
  selected: number; // -1 = not answered
  correct: number;
}

export type Rating = 0 | 1 | 2 | 3; // again, hard, good, easy

export type Screen =
  | 'home' | 'topic' | 'study' | 'import' | 'done'
  | 'admin' | 'settings'
  | 'quiz' | 'quiz-import' | 'quiz-results'
  | 'progression';
export type AppState = 'loading' | 'setup' | 'login' | 'app';
