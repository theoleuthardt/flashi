import { C } from '../theme';

interface Props {
  sessionCount: number;
  onBack: () => void;
}

export default function DoneScreen({ sessionCount, onBack }: Props) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.emoji}>🎉</div>
      <h2 style={styles.title}>Session complete!</h2>
      <p style={styles.sub}>
        {sessionCount} card{sessionCount !== 1 ? 's' : ''} learned
      </p>
      <button onClick={onBack} style={styles.btn}>
        Back to home
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100dvh',
    background: C.bg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 26,
    textAlign: 'center',
  },
  sub: { color: C.mutedLight, fontSize: 15, marginBottom: 28, textAlign: 'center' },
  btn: {
    background: C.accent,
    color: '#0d0d14',
    border: 'none',
    borderRadius: 14,
    padding: '14px 36px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(232,160,48,0.3)',
  },
};
