import { useState } from 'react';
import type { Quiz, QuizAnswer } from '../types';
import { C } from '../theme';

interface Props {
  quiz: Quiz;
  onDone: (answers: QuizAnswer[]) => void;
  onBack: () => void;
}

export default function QuizScreen({ quiz, onDone, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);

  const question = quiz.questions[currentIndex];
  const total = quiz.questions.length;
  const progress = currentIndex / total;
  const isLast = currentIndex === total - 1;
  const revealed = selected !== null;

  function handleSelect(optionIndex: number) {
    if (revealed) return; // already answered
    setSelected(optionIndex);
  }

  function handleNext() {
    if (selected === null) return;
    const newAnswers = [
      ...answers,
      { questionIndex: currentIndex, selected, correct: question.correct },
    ];
    if (isLast) {
      onDone(newAnswers);
    } else {
      setAnswers(newAnswers);
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function optionStyle(idx: number): React.CSSProperties {
    const base: React.CSSProperties = {
      ...styles.option,
    };
    if (!revealed) return base;
    if (idx === question.correct) {
      return { ...base, background: 'var(--good-bg-strong)', border: `2px solid ${C.good}`, color: C.good };
    }
    if (idx === selected) {
      return { ...base, background: 'var(--again-bg-strong)', border: `2px solid ${C.again}`, color: C.again };
    }
    return { ...base, opacity: 0.45 };
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <span style={styles.quizName}>{quiz.name}</span>
        <span style={styles.counter}>{currentIndex + 1} / {total}</span>
      </div>

      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
      </div>

      <div style={styles.body}>
        <div style={styles.questionCard}>
          <p style={styles.questionLabel}>Question {currentIndex + 1}</p>
          <p style={styles.questionText}>{question.question}</p>
        </div>

        <div style={styles.optionsList}>
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              style={optionStyle(idx)}
              onClick={() => handleSelect(idx)}
            >
              <span style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
              <span style={styles.optionText}>{opt}</span>
              {revealed && idx === question.correct && (
                <span style={styles.optionBadge}>✓</span>
              )}
              {revealed && idx === selected && idx !== question.correct && (
                <span style={styles.optionBadge}>✗</span>
              )}
            </button>
          ))}
        </div>

        {revealed && (
          <button onClick={handleNext} style={styles.nextBtn}>
            {isLast ? 'See results' : 'Next question →'}
          </button>
        )}

        {!revealed && (
          <p style={styles.hint}>Select an answer to continue</p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' },
  header: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${C.border}`,
    flexShrink: 0,
  },
  backBtn: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    color: C.mutedLight,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    padding: '7px 16px',
  },
  quizName: {
    color: C.mutedLight,
    fontSize: 13,
    maxWidth: '40%',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  counter: { color: C.accent, fontSize: 13, fontWeight: 600 },
  progressTrack: { height: 3, background: C.border, flexShrink: 0 },
  progressFill: {
    height: '100%',
    background: C.accent,
    borderRadius: '0 3px 3px 0',
    transition: 'width 0.4s ease',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 16px 40px',
    maxWidth: 560,
    width: '100%',
    margin: '0 auto',
    gap: 12,
  },
  questionCard: {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.accentBorder}`,
    borderRadius: 20,
    padding: '24px 20px',
    marginBottom: 8,
  },
  questionLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  questionText: {
    color: C.text,
    fontSize: 18,
    fontWeight: 600,
    fontFamily: "'Playfair Display', serif",
    lineHeight: 1.5,
  },
  optionsList: { width: '100%', display: 'flex', flexDirection: 'column', gap: 10 },
  option: {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: '14px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    transition: 'border-color 0.15s, background 0.15s',
    color: C.text,
  },
  optionLetter: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: C.surface2,
    border: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: C.mutedLight,
    flexShrink: 0,
  } as React.CSSProperties,
  optionText: { flex: 1, fontSize: 14, lineHeight: 1.4 },
  optionBadge: { fontSize: 16, fontWeight: 700, flexShrink: 0 },
  nextBtn: {
    marginTop: 8,
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 20px var(--accent-shadow)',
    alignSelf: 'stretch',
  },
  hint: { color: C.muted, fontSize: 12, marginTop: 4 },
};
