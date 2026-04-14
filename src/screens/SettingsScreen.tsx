import { useState, useEffect } from 'react';
import { C } from '../theme';
import { changePassword, getUserSettings, saveUserSettings } from '../utils/api';
import type { UserSettings } from '../utils/api';

interface Props {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: Props) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    discordWebhook: '',
    notificationTime: '08:00',
    notificationsEnabled: false,
  });
  const [notifSaved, setNotifSaved] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');

  useEffect(() => {
    void getUserSettings().then((s) => setSettings(s)).catch(() => {});
  }, []);

  async function handlePasswordChange() {
    setPwError('');
    setPwSuccess('');
    if (!currentPw) { setPwError('Please enter your current password'); return; }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match'); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess('Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Could not change password');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleSaveNotifications() {
    setNotifError('');
    setNotifLoading(true);
    try {
      await saveUserSettings(settings);
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    } catch (e) {
      setNotifError(e instanceof Error ? e.message : 'Could not save settings');
    } finally {
      setNotifLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <h2 style={styles.heading}>Settings</h2>
        <div style={{ width: 70 }} />
      </div>

      <div style={styles.content}>
        {/* ── Security ──────────────────── */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Security</h3>

          <label style={styles.label}>Current password</label>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Enter current password"
            style={styles.input}
            autoComplete="current-password"
          />

          <label style={styles.label}>New password</label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="At least 6 characters"
            style={styles.input}
            autoComplete="new-password"
          />

          <label style={styles.label}>Confirm new password</label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Repeat new password"
            style={styles.input}
            autoComplete="new-password"
            onKeyDown={(e) => e.key === 'Enter' && void handlePasswordChange()}
          />

          {pwError && <p style={styles.error}>{pwError}</p>}
          {pwSuccess && <p style={styles.success}>{pwSuccess}</p>}

          <button
            onClick={() => void handlePasswordChange()}
            disabled={pwLoading || !currentPw || !newPw || !confirmPw}
            style={{ ...styles.btn, opacity: pwLoading || !currentPw || !newPw || !confirmPw ? 0.5 : 1 }}
          >
            {pwLoading ? 'Saving…' : 'Change password'}
          </button>
        </section>

        {/* ── Notifications ──────────────── */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Daily Reminder</h3>
          <p style={styles.hint}>
            Get a Discord notification when you have cards due. Paste your webhook URL and set a time.
          </p>

          <div style={styles.toggleRow}>
            <label style={styles.label}>Enable daily reminder</label>
            <button
              onClick={() => setSettings((s) => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
              style={{
                ...styles.toggle,
                background: settings.notificationsEnabled ? C.good : C.border,
              }}
            >
              <span style={{
                ...styles.toggleThumb,
                transform: settings.notificationsEnabled ? 'translateX(20px)' : 'translateX(2px)',
              }} />
            </button>
          </div>

          <label style={styles.label}>Discord webhook URL</label>
          <input
            type="url"
            value={settings.discordWebhook}
            onChange={(e) => setSettings((s) => ({ ...s, discordWebhook: e.target.value }))}
            placeholder="https://discord.com/api/webhooks/..."
            style={styles.input}
          />

          <label style={styles.label}>Notification time (server local time)</label>
          <input
            type="time"
            value={settings.notificationTime}
            onChange={(e) => setSettings((s) => ({ ...s, notificationTime: e.target.value }))}
            style={{ ...styles.input, maxWidth: 160 }}
          />

          {notifError && <p style={styles.error}>{notifError}</p>}

          <button
            onClick={() => void handleSaveNotifications()}
            disabled={notifLoading}
            style={{ ...styles.btn, opacity: notifLoading ? 0.5 : 1 }}
          >
            {notifSaved ? '✓ Saved' : notifLoading ? 'Saving…' : 'Save notification settings'}
          </button>
        </section>
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
  heading: { color: C.text, fontSize: 17, fontWeight: 600 },
  content: {
    padding: '24px 16px 60px',
    maxWidth: 520,
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  section: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: '20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 8,
  },
  hint: { color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 4 },
  label: {
    color: C.muted,
    fontSize: 12,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    marginTop: 4,
  },
  input: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.text,
    fontSize: 14,
    padding: '11px 14px',
    width: '100%',
  },
  error: { color: C.again, fontSize: 13 },
  success: { color: C.good, fontSize: 13 },
  btn: {
    marginTop: 8,
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '13px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 16px var(--accent-shadow-sm)',
    transition: 'opacity 0.2s',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 0',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
    padding: 0,
  },
  toggleThumb: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.2s',
    display: 'block',
  },
};
