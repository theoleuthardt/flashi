import { useState } from 'react';
import { setupPassword } from '../utils/api';
import { C } from '../theme';

interface Props {
  onSetup: (token: string) => void;
}

export default function SetupScreen({ onSetup }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { token } = await setupPassword(password, username.trim() || undefined);
      onSetup(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <img src="/icon-128.png" alt="Flashi" style={styles.icon} />
        <h1 style={styles.title}>Flashi</h1>
        <p style={styles.subtitle}>Welcome! Create your admin account.</p>

        <label style={styles.label}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          style={styles.input}
          autoComplete="username"
          autoFocus
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          style={styles.input}
          autoComplete="new-password"
        />

        <label style={styles.label}>Confirm</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          style={styles.input}
          onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
          autoComplete="new-password"
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={() => void handleSubmit()}
          disabled={loading || !password || !confirm}
          style={{ ...styles.btn, opacity: loading || !password || !confirm ? 0.5 : 1 }}
        >
          {loading ? 'Saving…' : 'Create account'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100dvh',
    background: C.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 24,
    padding: '36px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  icon: {
    width: 52,
    height: 52,
    objectFit: 'contain',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 30,
    fontWeight: 600,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: C.mutedLight,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    color: C.muted,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.text,
    fontSize: 15,
    padding: '12px 16px',
    width: '100%',
  },
  error: {
    color: C.again,
    fontSize: 13,
    marginTop: 8,
  },
  btn: {
    marginTop: 20,
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 20px var(--accent-shadow)',
  },
};
