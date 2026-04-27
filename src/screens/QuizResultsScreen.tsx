import type { Quiz, QuizAnswer } from '../types';
import { C } from '../theme';

interface Props {
  quiz: Quiz;
  answers: QuizAnswer[];
  onBack: () => void;
  onRetry: () => void;
}

function correctIndices(correct: number | number[]): number[] {
  return Array.isArray(correct) ? correct : [correct];
}

function isAnswerCorrect(selected: number[], correct: number | number[]): boolean {
  const ci = correctIndices(correct);
  return selected.length === ci.length && ci.every((c) => selected.includes(c));
}

function optText(opt: import('../types').QuizOption): string {
  return Array.isArray(opt) ? opt[0] : opt;
}

export default function QuizResultsScreen({ quiz, answers, onBack, onRetry }: Props) {
  const total = answers.length;
  const correct = answers.filter((a) => isAnswerCorrect(a.selected, a.correct)).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const faults = answers.filter((a) => !isAnswerCorrect(a.selected, a.correct));

  const scoreColor = pct >= 80 ? C.good : pct >= 50 ? C.hard : C.again;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <h2 style={styles.heading}>{quiz.name}</h2>
        <div style={{ width: 70 }} />
      </div>

      <div style={styles.body}>
        <div style={styles.scoreCard}>
          <p style={styles.scoreLabel}>Your score</p>
          <div style={styles.scoreRow}>
            <span style={{ ...styles.scorePct, color: scoreColor }}>{pct}%</span>
            <span style={styles.scoreFraction}>{correct} / {total}</span>
          </div>

          <div style={styles.barTrack}>
            <div style={{ ...styles.barCorrect, width: `${pct}%`, background: scoreColor }} />
          </div>

          <p style={styles.scoreMsg}>
            {pct === 100 ? '🎉 Perfect score!' :
             pct >= 80 ? '👏 Great job!' :
             pct >= 50 ? '📚 Keep practising!' :
             '💪 Needs more review'}
          </p>
        </div>

        {faults.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Review — {faults.length} wrong</h3>
            {faults.map((a) => {
              const q = quiz.questions[a.questionIndex];
              const ci = correctIndices(q.correct);
              return (
                <div key={a.questionIndex} style={styles.faultCard}>
                  <p style={styles.faultQuestion}>{q.question}</p>
                  <div style={styles.faultRow}>
                    <div style={styles.faultWrong}>
                      <span style={styles.faultBadge}>✗</span>
                      <span style={styles.faultText}>
                        {a.selected.map((i) => optText(q.options[i])).join(', ')}
                      </span>
                    </div>
                    <div style={styles.faultCorrect}>
                      <span style={styles.faultBadge}>✓</span>
                      <span style={styles.faultText}>
                        {ci.map((i) => optText(q.options[i])).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={styles.actions}>
          <button onClick={onRetry} style={styles.retryBtn}>↺ Try again</button>
          <button onClick={onBack} style={styles.backBtnBottom}>Back to topic</button>
        </div>
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
  heading: { color: C.text, fontSize: 16, fontWeight: 600 },
  body: {
    padding: '24px 16px 60px',
    maxWidth: 520,
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  scoreCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 22,
    padding: '24px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  scoreLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  scoreRow: { display: 'flex', alignItems: 'baseline', gap: 12 },
  scorePct: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 52,
    fontWeight: 600,
    lineHeight: 1,
  },
  scoreFraction: { color: C.mutedLight, fontSize: 18 },
  barTrack: {
    height: 8,
    background: C.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  barCorrect: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.6s ease',
    minWidth: 4,
  },
  scoreMsg: { color: C.mutedLight, fontSize: 14, marginTop: 4 },
  section: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionTitle: { color: C.text, fontSize: 14, fontWeight: 600 },
  faultCard: {
    background: C.surface2,
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  faultQuestion: { color: C.text, fontSize: 13, fontWeight: 500 },
  faultRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  faultWrong: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--again-bg)',
    border: `1px solid ${C.again}55`,
    borderRadius: 8,
    padding: '8px 10px',
    color: C.again,
  },
  faultCorrect: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--good-bg)',
    border: `1px solid ${C.good}55`,
    borderRadius: 8,
    padding: '8px 10px',
    color: C.good,
  },
  faultBadge: { fontSize: 13, fontWeight: 700, flexShrink: 0 },
  faultText: { fontSize: 13 },
  actions: { display: 'flex', gap: 10 },
  retryBtn: {
    flex: 1,
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '14px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px var(--accent-shadow-sm)',
  },
  backBtnBottom: {
    flex: 1,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: '14px',
    fontSize: 14,
    color: C.text,
    cursor: 'pointer',
  },
};
