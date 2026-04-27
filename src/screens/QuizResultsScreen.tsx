import { useEffect, useRef } from 'react';
import type { Quiz, QuizAnswer } from '../types';
import { C } from '../theme';

const CONFETTI_COLORS = ['#6C63FF', '#FF6584', '#43D9AD', '#FFD166', '#EF476F', '#06D6A0', '#118AB2'];

function useConfetti(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      color: string; w: number; h: number; angle: number; spin: number; gravity: number;
    }

    function burst(originX: number): Particle[] {
      return Array.from({ length: 60 }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        const speed = 10 + Math.random() * 14;
        return {
          x: originX, y: canvas!.height + 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          w: 8 + Math.random() * 8,
          h: 4 + Math.random() * 4,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.3,
          gravity: 0.35 + Math.random() * 0.15,
        };
      });
    }

    let particles: Particle[] = [
      ...burst(canvas.width * 0.25),
      ...burst(canvas.width * 0.75),
    ];
    let frame = 0;
    let rafId: number;

    // Second volley after 600ms
    const timer = setTimeout(() => {
      particles.push(...burst(canvas.width * 0.5));
    }, 600);

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.angle += p.spin;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.angle);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = Math.max(0, 1 - frame / 160);
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      });
      frame++;
      if (frame < 180) rafId = requestAnimationFrame(draw);
      else ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
    }

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  return canvasRef;
}

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
  const canvasRef = useConfetti(pct === 100);

  return (
    <div style={styles.wrapper}>
      <canvas ref={canvasRef} style={styles.confettiCanvas} />
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
  confettiCanvas: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
  },
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
