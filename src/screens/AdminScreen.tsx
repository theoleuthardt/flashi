import { useState, useEffect, useRef } from 'react';
import { getAdminUsers, createAdminUser, deleteAdminUser, updateAdminUser } from '../utils/api';
import { C } from '../theme';

interface Props {
  currentUsername: string;
  onBack: () => void;
}

interface UserEntry {
  username: string;
  isAdmin: boolean;
}

export default function AdminScreen({ currentUsername, onBack }: Props) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 3-dot menu state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserEntry | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenu]);

  async function loadUsers() {
    try {
      const { users } = await getAdminUsers();
      setUsers(users);
    } catch {
      setError('Failed to load users');
    }
  }

  async function handleCreate() {
    setError('');
    setSuccess('');
    if (!newUsername.trim() || !newPassword) return;
    setLoading(true);
    try {
      await createAdminUser(newUsername.trim(), newPassword);
      setNewUsername('');
      setNewPassword('');
      setSuccess(`User "${newUsername.trim()}" created`);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(username: string) {
    setError('');
    setSuccess('');
    setDeleteTarget(null);
    try {
      await deleteAdminUser(username);
      setSuccess(`User "${username}" deleted`);
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function handleEdit() {
    if (!editingUser) return;
    setError('');
    setSuccess('');
    setEditLoading(true);
    try {
      const patch: { password?: string; isAdmin?: boolean } = {};
      if (editPassword) patch.password = editPassword;
      if (editIsAdmin !== editingUser.isAdmin) patch.isAdmin = editIsAdmin;
      if (Object.keys(patch).length === 0) {
        setEditingUser(null);
        return;
      }
      await updateAdminUser(editingUser.username, patch);
      setSuccess(`User "${editingUser.username}" updated`);
      setEditingUser(null);
      setEditPassword('');
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setEditLoading(false);
    }
  }

  function openEdit(u: UserEntry) {
    setOpenMenu(null);
    setEditingUser(u);
    setEditIsAdmin(u.isAdmin);
    setEditPassword('');
    setError('');
    setSuccess('');
  }

  function openDelete(username: string) {
    setOpenMenu(null);
    setDeleteTarget(username);
    setError('');
    setSuccess('');
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          ← Back
        </button>
        <h2 style={styles.heading}>User Management</h2>
        <div style={{ width: 70 }} />
      </div>

      <div style={styles.content}>
        <p style={styles.sectionTitle}>Users</p>

        {users.map((u) => (
          <div key={u.username} style={styles.userRow}>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{u.username}</span>
              {u.isAdmin && <span style={styles.adminBadge}>admin</span>}
              {u.username === currentUsername && <span style={styles.youBadge}>you</span>}
            </div>

            {u.username !== currentUsername && (
              <div
                style={{ position: 'relative' }}
                ref={openMenu === u.username ? menuRef : undefined}
              >
                <button
                  onClick={() => setOpenMenu(openMenu === u.username ? null : u.username)}
                  style={styles.dotsBtn}
                  aria-label="Options"
                >
                  ⋯
                </button>
                {openMenu === u.username && (
                  <div style={styles.dropdown}>
                    <button onClick={() => openEdit(u)} style={styles.dropdownItem}>
                      ✏ Edit
                    </button>
                    <button
                      onClick={() => openDelete(u.username)}
                      style={{ ...styles.dropdownItem, ...styles.dropdownItemDelete }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div style={styles.divider} />

        <p style={styles.sectionTitle}>Add user</p>

        <label style={styles.label}>Username</label>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="username"
          style={styles.input}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 6 characters"
          style={styles.input}
          onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
        />

        {error && <p style={styles.error}>⚠ {error}</p>}
        {success && <p style={styles.successMsg}>✓ {success}</p>}

        <button
          onClick={() => void handleCreate()}
          disabled={loading || !newUsername.trim() || !newPassword}
          style={{
            ...styles.createBtn,
            opacity: loading || !newUsername.trim() || !newPassword ? 0.4 : 1,
            cursor: loading || !newUsername.trim() || !newPassword ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Creating…' : 'Create user'}
        </button>
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div style={styles.modalBackdrop} onClick={() => setEditingUser(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalTitle}>Edit user</p>
            <p style={styles.modalSubtitle}>{editingUser.username}</p>

            <label style={styles.label}>New password</label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              style={styles.input}
              autoFocus
            />

            {editingUser.username !== currentUsername && (
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: C.accent }}
                />
                <span style={styles.checkboxLabel}>Admin access</span>
              </label>
            )}

            {error && <p style={styles.error}>⚠ {error}</p>}

            <div style={styles.modalBtns}>
              <button onClick={() => setEditingUser(null)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={() => void handleEdit()}
                disabled={editLoading}
                style={{ ...styles.saveBtn, opacity: editLoading ? 0.5 : 1 }}
              >
                {editLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={styles.modalBackdrop} onClick={() => setDeleteTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalTitle}>Delete user?</p>
            <p style={styles.modalSubtitle}>"{deleteTarget}" will be permanently removed.</p>
            <div style={styles.modalBtns}>
              <button onClick={() => setDeleteTarget(null)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={() => void handleDelete(deleteTarget)}
                style={styles.deleteConfirmBtn}
              >
                Delete
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
    padding: '24px 16px 80px',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 8,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '12px 16px',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  userName: { color: C.text, fontSize: 14, fontWeight: 500 },
  adminBadge: {
    background: `${C.accent}22`,
    color: C.accent,
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
  },
  youBadge: {
    background: C.surface2,
    color: C.muted,
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 11,
  },
  dotsBtn: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.mutedLight,
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
    padding: '4px 10px',
    letterSpacing: 2,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 6px)',
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
    zIndex: 50,
    minWidth: 130,
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    background: 'none',
    border: 'none',
    padding: '11px 16px',
    textAlign: 'left',
    color: C.text,
    fontSize: 14,
    cursor: 'pointer',
  },
  dropdownItemDelete: {
    color: C.again,
    borderTop: `1px solid ${C.border}`,
  },
  divider: {
    height: 1,
    background: C.border,
    margin: '12px 0',
  },
  label: {
    color: C.muted,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    cursor: 'pointer',
  },
  checkboxLabel: {
    color: C.text,
    fontSize: 14,
  },
  input: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.text,
    fontSize: 14,
    padding: '12px 14px',
    width: '100%',
  },
  error: { color: C.again, fontSize: 13 },
  successMsg: { color: C.good, fontSize: 13 },
  createBtn: {
    marginTop: 8,
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '13px',
    fontSize: 14,
    fontWeight: 600,
    width: '100%',
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
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  modalTitle: { color: C.text, fontSize: 16, fontWeight: 600, textAlign: 'center' },
  modalSubtitle: { color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  modalBtns: { display: 'flex', gap: 10, marginTop: 12 },
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
  saveBtn: {
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
  deleteConfirmBtn: {
    flex: 1,
    background: C.again,
    border: 'none',
    borderRadius: 11,
    padding: 13,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
};
