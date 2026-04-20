import { useState } from 'react';
import type { Card, Deck, Rating } from '../types';
import { nextIntervalLabel } from '../utils/srs';
import { C } from '../theme';

interface Props {
  deck: Deck;
  queue: Card[];
  flipped: boolean;
  setFlipped: (v: boolean) => void;
  sessionCount: number;
  onRate: (r: Rating) => void;
  onSkip: () => void;
  onGoBack: () => void;
  onBack: () => void;
}

function SpeakerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 6h2.5L9 2v12L4.5 10H2V6z" fill="currentColor"/>
      <path d="M11 5.5a4 4 0 010 5M12.5 3.5a7 7 0 010 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const RATINGS: Array<{ label: string; color: string; bg: string; border: string; r: Rating }> = [
  { label: 'Again', color: C.again, bg: 'var(--again-bg-strong)', border: C.againBorder, r: 0 },
  { label: 'Hard', color: C.hard, bg: 'var(--hard-bg-strong)', border: C.hardBorder, r: 1 },
  { label: 'Good', color: C.good, bg: 'var(--good-bg-strong)', border: C.goodBorder, r: 2 },
  { label: 'Easy', color: C.easy, bg: 'var(--easy-bg-strong)', border: C.easyBorder, r: 3 },
];

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utt);
}

export default function StudyScreen({
  deck,
  queue,
  flipped,
  setFlipped,
  sessionCount,
  onRate,
  onSkip,
  onGoBack,
  onBack,
}: Props) {
  const card = queue[0];
  const remaining = queue.length;
  const progress = sessionCount / (sessionCount + remaining);
  const [animClass, setAnimClass] = useState('');

  function animate(exitClass: string, enterClass: string, cb: () => void) {
    setAnimClass(exitClass);
    setTimeout(() => {
      cb();
      setAnimClass(enterClass);
      setTimeout(() => setAnimClass(''), 360);
    }, 260);
  }

  function handleSkip() {
    animate('card-exit-right', 'card-enter-left', () => {
      onSkip();
      setFlipped(false);
    });
  }

  function handleRate(r: Rating) {
    animate('card-exit-right', 'card-enter-left', () => {
      onRate(r);
      setFlipped(false);
    });
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          ← Back
        </button>
        <span style={styles.deckName}>{deck.name}</span>
        <span style={styles.remaining}>{remaining} left</span>
      </div>

      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
      </div>

      <div style={styles.cardArea}>
        <div className={`card-scene ${animClass}`}>
          <div className={`card-inner${flipped ? ' is-flipped' : ''}`} style={{ minHeight: 240 }}>
            <div
              className="card-face card-face--front"
              onClick={() => setFlipped(true)}
              style={{
                ...styles.face,
                background: C.surface,
                border: `2px solid ${C.accentBorder}`,
              }}
            >
              <div style={styles.sideLabel}>Front</div>
              <div style={{ ...styles.cardText, fontSize: 32, fontWeight: 600 }}>{card.front}</div>
              <button
                style={styles.speakBtn}
                onClick={(e) => { e.stopPropagation(); speak(card.front); }}
                title="Read aloud"
              >
                <SpeakerIcon />
              </button>
              <div style={styles.tapHint}>Tap to flip</div>
            </div>

            <div
              className="card-face card-face--back"
              onClick={() => setFlipped(false)}
              style={{
                ...styles.face,
                background: C.surface,
                border: `2px solid ${C.border}`,
              }}
            >
              <div style={styles.sideLabel}>Back</div>
              <div style={{ ...styles.cardText, fontSize: 22 }}>{card.back}</div>
              <button
                style={styles.speakBtn}
                onClick={(e) => { e.stopPropagation(); speak(card.back); }}
                title="Read aloud"
              >
                <SpeakerIcon />
              </button>
              <div style={styles.tapHint}>Tap to flip back</div>
              <div style={styles.cardMeta}>
                {card.reps} reps · interval: {card.interval}d
              </div>
            </div>
          </div>
        </div>

        {!flipped && (
          <div style={styles.navRow}>
            <button
              onClick={() => {
                if (queue.length < 2) return;
                animate('card-exit-left', 'card-enter-right', onGoBack);
              }}
              style={{
                ...styles.navBtn,
                opacity: queue.length > 1 ? 1 : 0.3,
                cursor: queue.length > 1 ? 'pointer' : 'default',
              }}
              disabled={queue.length < 2}
              title="Previous card"
            >
              ←
            </button>

            <span style={styles.navHint}>skip</span>

            <button onClick={handleSkip} style={styles.navBtn} title="Skip to next card">
              →
            </button>
          </div>
        )}

        {flipped && (
          <div style={styles.ratingRow}>
            {RATINGS.map(({ label, color, bg, border, r }) => (
              <button
                key={r}
                onClick={() => handleRate(r)}
                style={{
                  ...styles.ratingBtn,
                  background: bg,
                  border: `1px solid ${border}`,
                  color,
                }}
              >
                {label}
                <span style={styles.intervalHint}>{nextIntervalLabel(card, r)}</span>
              </button>
            ))}
          </div>
        )}

        {flipped && <p style={styles.sessionInfo}>{sessionCount} learned this session</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' },
  header: {
    padding: '16px 20px',
    paddingTop: 'max(16px, env(safe-area-inset-top))',
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
  deckName: {
    color: C.mutedLight,
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '40%',
    textAlign: 'center',
  },
  remaining: { color: C.accent, fontSize: 13, fontWeight: 600 },
  progressTrack: { height: 3, background: C.border, flexShrink: 0 },
  progressFill: {
    height: '100%',
    background: C.accent,
    borderRadius: '0 3px 3px 0',
    transition: 'width 0.4s ease',
  },
  cardArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px 32px',
  },
  face: {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 28px',
    userSelect: 'none',
  },
  sideLabel: {
    color: C.mutedLight,
    fontSize: 11,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    marginBottom: 20,
    fontWeight: 600,
  },
  cardText: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  tapHint: { position: 'absolute', bottom: 14, color: C.mutedLight, fontSize: 11 },
  cardMeta: { position: 'absolute', top: 14, color: C.mutedLight, fontSize: 10 },
  speakBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.mutedLight,
    cursor: 'pointer',
    padding: '5px 7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.mutedLight,
    cursor: 'pointer',
    fontSize: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navHint: { color: C.muted, fontSize: 11, letterSpacing: '0.06em' },
  ratingRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 8,
    width: '100%',
    maxWidth: 440,
    marginTop: 20,
  },
  ratingBtn: {
    borderRadius: 14,
    padding: '12px 4px 10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },
  intervalHint: { fontSize: 10, fontWeight: 400, opacity: 0.85 },
  sessionInfo: { marginTop: 16, color: C.muted, fontSize: 12 },
};
