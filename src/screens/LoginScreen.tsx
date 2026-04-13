import { useState } from 'react';
import { login } from '../utils/api';
import { C } from '../theme';

interface Props {
  onLogin: (token: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const { token } = await login(password, username.trim() || undefined);
      onLogin(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.icon}>🃏</div>
        <h1 style={styles.title}>Flashi</h1>
        <p style={styles.subtitle}>Spaced Repetition</p>

        <label style={styles.label}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Leave blank for default"
          style={styles.input}
          autoComplete="username"
          autoFocus
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={styles.input}
          onKeyDown={(e) => e.key === 'Enter' && void handleLogin()}
          autoComplete="current-password"
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={() => void handleLogin()}
          disabled={loading || !password}
          style={{ ...styles.btn, opacity: loading || !password ? 0.5 : 1 }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
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
    maxWidth: 340,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 24,
    padding: '40px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  icon: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 42,
    color: C.accent,
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 28,
    fontWeight: 600,
    textAlign: 'center',
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    marginBottom: 20,
    letterSpacing: '0.04em',
    textAlign: 'center',
  },
  label: {
    color: C.muted,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.text,
    fontSize: 15,
    padding: '13px 16px',
    width: '100%',
  },
  error: {
    color: C.again,
    fontSize: 13,
    marginTop: 6,
  },
  btn: {
    marginTop: 16,
    background: C.accent,
    color: '#0d0d14',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    boxShadow: `0 4px 20px rgba(232,160,48,0.3)`,
  },
};
