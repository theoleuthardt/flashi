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
  answers: Record<number, number[]>;
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

function correctIndices(correct: number | number[]): number[] {
  return Array.isArray(correct) ? correct : [correct];
}


export default function QuizScreen({ quiz, onDone, onBack }: Props) {
  const [confirmRestart, setConfirmRestart] = useState(false);

  const [resumed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(progressKey(quiz.id));
      if (saved) {
        const p = JSON.parse(saved) as SavedProgress;
        return p.currentIndex > 0 || Object.keys(p.answers).length > 0;
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

  // answers: questionIndex → selected indices
  const [answers, setAnswers] = useState<Record<number, number[]>>(() => {
    try {
      const saved = localStorage.getItem(progressKey(quiz.id));
      if (saved) return (JSON.parse(saved) as SavedProgress).answers ?? {};
    } catch { /* ignore */ }
    return {};
  });

  // pending selection for the current question (before confirming)
  const [pendingSelection, setPendingSelection] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  const question = quiz.questions[currentIndex];
  const total = quiz.questions.length;
  const progress = currentIndex / total;
  const isLast = currentIndex === total - 1;
  const isMultiple = Array.isArray(question.correct) && question.correct.length > 1;
  const storedAnswer = answers[currentIndex];
  const isAnswered = storedAnswer !== undefined;

  // When navigating to a question, restore its state
  useEffect(() => {
    if (storedAnswer !== undefined) {
      setPendingSelection(storedAnswer);
      setRevealed(true);
    } else {
      setPendingSelection([]);
      setRevealed(false);
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Object.keys(answers).length > 0 || currentIndex > 0) {
      localStorage.setItem(progressKey(quiz.id), JSON.stringify({ currentIndex, answers }));
    }
  }, [currentIndex, answers, quiz.id]);

  function handleToggleOption(optionIndex: number) {
    if (revealed) return;
    if (isMultiple) {
      setPendingSelection((prev) =>
        prev.includes(optionIndex)
          ? prev.filter((i) => i !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setPendingSelection([optionIndex]);
    }
  }

  function handleConfirm() {
    if (pendingSelection.length === 0) return;
    const newAnswers = { ...answers, [currentIndex]: pendingSelection };
    setAnswers(newAnswers);
    setRevealed(true);
  }

  function handleNext() {
    if (!isAnswered && !revealed) return;
    const finalAnswers = revealed ? { ...answers, [currentIndex]: pendingSelection } : answers;
    if (!finalAnswers[currentIndex]) return;
    const savedAnswers = { ...finalAnswers };
    setAnswers(savedAnswers);

    if (isLast) {
      localStorage.removeItem(progressKey(quiz.id));
      const result: QuizAnswer[] = Object.entries(savedAnswers).map(([qi, sel]) => ({
        questionIndex: Number(qi),
        selected: sel,
        correct: quiz.questions[Number(qi)].correct,
      }));
      onDone(result);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handlePrev() {
    if (currentIndex === 0) return;
    if (revealed && !isAnswered) {
      setAnswers((prev) => ({ ...prev, [currentIndex]: pendingSelection }));
    }
    setCurrentIndex((i) => i - 1);
  }

  const answeredCount = Object.keys(answers).length + (revealed && !isAnswered ? 1 : 0);

  function optionStyle(idx: number): React.CSSProperties {
    const base: React.CSSProperties = { ...styles.option };
    const ci = correctIndices(question.correct);
    const isSelectedPending = pendingSelection.includes(idx);

    if (!revealed) {
      return {
        ...base,
        background: isSelectedPending ? 'var(--accent-border)' : C.surface,
        border: isSelectedPending ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
      };
    }

    const isCorrectOpt = ci.includes(idx);
    const isWrongSelected = isSelectedPending && !isCorrectOpt;

    if (isCorrectOpt) {
      return { ...base, background: 'var(--good-bg-strong)', border: `2px solid ${C.good}`, color: C.good };
    }
    if (isWrongSelected) {
      return { ...base, background: 'var(--again-bg-strong)', border: `2px solid ${C.again}`, color: C.again };
    }
    return { ...base, opacity: 0.45 };
  }

  const canGoNext = revealed && answers[currentIndex] !== undefined;

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

      {resumed && !revealed && answeredCount === 0 && (
        <div style={styles.resumeBanner}>Resuming from question {currentIndex + 1}</div>
      )}

      <div style={styles.body}>
        <div style={styles.questionCard}>
          <p style={styles.questionLabel}>Question {currentIndex + 1}</p>
          {question.image && (
            <img
              src={question.image}
              alt="Question image"
              style={styles.questionImage}
            />
          )}
          <p style={styles.questionText}>{question.question}</p>
          {isMultiple && (
            <p style={styles.multipleHint}>Select all correct answers</p>
          )}
        </div>

        <div style={styles.optionsList}>
          {question.options.map((opt, idx) => {
            const text = optText(opt);
            const explanation = optExplanation(opt);
            const ci = correctIndices(question.correct);
            const isCorrectOpt = ci.includes(idx);
            const isWrongSelected = revealed && pendingSelection.includes(idx) && !isCorrectOpt;
            const showExplanation = revealed && !!explanation;
            return (
              <div key={idx}>
                <button
                  style={optionStyle(idx)}
                  onClick={() => handleToggleOption(idx)}
                >
                  <span style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                  <div style={styles.optionContent}>
                    <span style={styles.optionText}>{text}</span>
                    {showExplanation && (
                      <span style={{
                        ...styles.optionExplanation,
                        color: isCorrectOpt ? C.good : isWrongSelected ? C.again : C.mutedLight,
                      }}>
                        {explanation}
                      </span>
                    )}
                  </div>
                  {revealed && isCorrectOpt && <span style={styles.optionBadge}>✓</span>}
                  {isWrongSelected && <span style={styles.optionBadge}>✗</span>}
                </button>
              </div>
            );
          })}
        </div>

        {!revealed && pendingSelection.length > 0 && (
          <button onClick={handleConfirm} style={styles.confirmBtn}>
            {isMultiple ? `Confirm ${pendingSelection.length} answer${pendingSelection.length !== 1 ? 's' : ''}` : 'Confirm answer'}
          </button>
        )}

        {!revealed && pendingSelection.length === 0 && (
          <p style={styles.hint}>
            {isMultiple ? 'Select all correct answers, then confirm' : 'Select an answer to continue'}
          </p>
        )}

        <div style={styles.navRow}>
          <button
            onClick={handlePrev}
            style={{
              ...styles.navArrowBtn,
              opacity: currentIndex > 0 ? 1 : 0.3,
              cursor: currentIndex > 0 ? 'pointer' : 'default',
            }}
            disabled={currentIndex === 0}
            title="Previous question"
          >
            ←
          </button>

          <span style={styles.navHint}>{answeredCount} / {total} answered</span>

          {canGoNext && (
            <button
              onClick={handleNext}
              style={styles.navArrowBtn}
              title={isLast ? 'See results' : 'Next question'}
            >
              {isLast ? '✓' : '→'}
            </button>
          )}
          {!canGoNext && <div style={{ ...styles.navArrowBtn, opacity: 0.3, cursor: 'default' }}>→</div>}
        </div>

        {revealed && (
          <button onClick={handleNext} style={styles.nextBtn}>
            {isLast ? 'See results' : 'Next question →'}
          </button>
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
            <p style={styles.modalTitle}>Restart quiz?</p>
            <p style={styles.modalHint}>Your progress will be lost.</p>
            <div style={styles.modalBtns}>
              <button onClick={() => setConfirmRestart(false)} style={styles.cancelBtn}>Cancel</button>
              <button
                onClick={() => {
                  localStorage.removeItem(progressKey(quiz.id));
                  setCurrentIndex(0);
                  setAnswers({});
                  setPendingSelection([]);
                  setRevealed(false);
                  setConfirmRestart(false);
                }}
                style={styles.confirmModalBtn}
              >
                Restart
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
    padding: '20px 20px 16px',
    marginBottom: 8,
  },
  questionLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  questionImage: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'contain',
    borderRadius: 10,
    marginBottom: 12,
  },
  questionText: {
    color: C.text,
    fontSize: 18,
    fontWeight: 600,
    fontFamily: "'Playfair Display', serif",
    lineHeight: 1.5,
  },
  multipleHint: {
    color: C.accent,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    marginTop: 8,
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
  optionContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  optionText: { fontSize: 14, lineHeight: 1.4 },
  optionExplanation: { fontSize: 12, lineHeight: 1.5, fontStyle: 'italic', opacity: 0.9 },
  optionBadge: { fontSize: 16, fontWeight: 700, flexShrink: 0 },
  confirmBtn: {
    marginTop: 4,
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '13px 28px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 20px var(--accent-shadow)',
    alignSelf: 'stretch',
  },
  nextBtn: {
    marginTop: 4,
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
  navRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  navArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.mutedLight,
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  navHint: { color: C.muted, fontSize: 12 },
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
  confirmModalBtn: {
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
