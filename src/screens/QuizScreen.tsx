import { useState, useEffect } from 'react';
import type { Quiz, QuizAnswer } from '../types';
import { C } from '../theme';

interface Props {
  quiz: Quiz;
  onDone: (answers: QuizAnswer[]) => void;
  onBack: () => void;
}

interface SavedProgress {
  currentIndex: number;
  answers: QuizAnswer[];
}

function progressKey(quizId: string) {
  return `flashi-quiz-progress-${quizId}`;
}

function optText(opt: import('../types').QuizOption): string {
  return Array.isArray(opt) ? opt[0] : opt;
}
function optExplanation(opt: import('../types').QuizOption): string | undefined {
  return Array.isArray(opt) ? opt[1] : undefined;
}

export default function QuizScreen({ quiz, onDone, onBack }: Props) {
  const [confirmRestart, setConfirmRestart] = useState(false);

  const [resumed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(progressKey(quiz.id));
      if (saved) {
        const p = JSON.parse(saved) as SavedProgress;
        return p.currentIndex > 0 || p.answers.length > 0;
      }
    } catch { /* ignore */ }
    return false;
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(progressKey(quiz.id));
      if (saved) return (JSON.parse(saved) as SavedProgress).currentIndex;
    } catch { /* ignore */ }
    return 0;
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>(() => {
    try {
      const saved = localStorage.getItem(progressKey(quiz.id));
      if (saved) return (JSON.parse(saved) as SavedProgress).answers;
    } catch { /* ignore */ }
    return [];
  });

  const question = quiz.questions[currentIndex];
  const total = quiz.questions.length;
  const progress = currentIndex / total;
  const isLast = currentIndex === total - 1;
  const revealed = selected !== null;

  useEffect(() => {
    if (answers.length > 0 || currentIndex > 0) {
      localStorage.setItem(progressKey(quiz.id), JSON.stringify({ currentIndex, answers }));
    }
  }, [currentIndex, answers, quiz.id]);

  function handleSelect(optionIndex: number) {
    if (revealed) return;
    setSelected(optionIndex);
  }

  function handleNext() {
    if (selected === null) return;
    const newAnswers = [
      ...answers,
      { questionIndex: currentIndex, selected, correct: question.correct },
    ];
    if (isLast) {
      localStorage.removeItem(progressKey(quiz.id));
      onDone(newAnswers);
    } else {
      setAnswers(newAnswers);
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  }

  function optionStyle(idx: number): React.CSSProperties {
    const base: React.CSSProperties = { ...styles.option };
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

      {resumed && selected === null && (
        <div style={styles.resumeBanner}>Resuming from question {currentIndex + 1}</div>
      )}

      <div style={styles.body}>
        <div style={styles.questionCard}>
          <p style={styles.questionLabel}>Question {currentIndex + 1}</p>
          <p style={styles.questionText}>{question.question}</p>
        </div>

        <div style={styles.optionsList}>
          {question.options.map((opt, idx) => {
            const text = optText(opt);
            const explanation = optExplanation(opt);
            const isCorrect = idx === question.correct;
            const isWrongSelected = revealed && idx === selected && !isCorrect;
            const hasExplanation = revealed && !!explanation;
            return (
              <div key={idx}>
                <button
                  style={{
                    ...optionStyle(idx),
                    ...(hasExplanation ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' } : {}),
                  }}
                  onClick={() => handleSelect(idx)}
                >
                  <span style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                  <span style={styles.optionText}>{text}</span>
                  {revealed && isCorrect && <span style={styles.optionBadge}>✓</span>}
                  {isWrongSelected && <span style={styles.optionBadge}>✗</span>}
                </button>
                {hasExplanation && (
                  <div style={{
                    ...styles.explanationInline,
                    background: isCorrect
                      ? 'var(--good-bg)'
                      : isWrongSelected
                        ? 'var(--again-bg)'
                        : C.surface,
                    borderColor: isCorrect ? C.good : isWrongSelected ? C.again : C.border,
                    color: isCorrect ? C.good : isWrongSelected ? C.again : C.mutedLight,
                  }}>
                    {explanation}
                  </div>
                )}
              </div>
            );
          })}
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

      <button
        onClick={() => setConfirmRestart(true)}
        style={styles.restartFab}
        title="Restart quiz"
      >
        ↺
      </button>

      {confirmRestart && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <p style={styles.modalTitle}>Quiz neu starten?</p>
            <p style={styles.modalHint}>Dein Fortschritt geht verloren.</p>
            <div style={styles.modalBtns}>
              <button onClick={() => setConfirmRestart(false)} style={styles.cancelBtn}>Abbrechen</button>
              <button
                onClick={() => {
                  localStorage.removeItem(progressKey(quiz.id));
                  setCurrentIndex(0);
                  setAnswers([]);
                  setSelected(null);
                  setConfirmRestart(false);
                }}
                style={styles.confirmBtn}
              >
                Neu starten
              </button>
            </div>
          </div>
        </div>
      )}
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
  resumeBanner: {
    background: 'var(--accent-border)',
    color: C.accent,
    fontSize: 12,
    textAlign: 'center',
    padding: '6px 16px',
    fontWeight: 500,
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
  explanationInline: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: '10px 16px',
    fontSize: 13,
    lineHeight: 1.55,
    fontStyle: 'italic',
  },
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
  restartFab: {
    position: 'fixed',
    bottom: 28,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: C.surface2,
    border: `1px solid ${C.border}`,
    color: C.mutedLight,
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    zIndex: 50,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 200,
    padding: '0 16px 40px',
  },
  modal: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 22,
    padding: '24px 20px',
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { color: C.text, fontSize: 16, textAlign: 'center', marginBottom: 6 },
  modalHint: { color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 22 },
  modalBtns: { display: 'flex', gap: 10 },
  cancelBtn: {
    flex: 1,
    background: C.border,
    border: 'none',
    borderRadius: 11,
    padding: 13,
    color: C.text,
    cursor: 'pointer',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    background: C.accent,
    border: 'none',
    borderRadius: 11,
    padding: 13,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
};
