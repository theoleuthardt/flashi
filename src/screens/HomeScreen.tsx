import { useState } from 'react';
import type { FlashiData, Topic } from '../types';
import { C } from '../theme';

interface Props {
  data: FlashiData;
  dueCount: (deckId: string) => number;
  onStudy: (deckId: string) => void;
  onImport: () => void;
  onDelete: (deckId: string) => void;
  onOpenTopic: (topicId: string) => void;
  onCreateTopic: (name: string) => void;
  onAssignTopic?: (deckId: string, topicId: string) => void;
  onAdmin?: () => void;
  onLogout: () => void;
}

export default function HomeScreen({
  data,
  dueCount,
  onStudy,
  onImport,
  onDelete,
  onOpenTopic,
  onCreateTopic,
  onAssignTopic,
  onAdmin,
  onLogout,
}: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);

  const totalDue = data.decks.reduce((s, d) => s + dueCount(d.id), 0);
  const totalCards = data.decks.reduce((s, d) => s + (data.cards[d.id]?.length ?? 0), 0);
  const unassignedDecks = data.decks.filter((d) => !d.topicId);

  const stats = [
    { label: 'Decks', val: data.decks.length },
    { label: 'Cards', val: totalCards },
    { label: 'Due today', val: totalDue },
  ];

  function topicDue(t: Topic) {
    return data.decks.filter((d) => d.topicId === t.id).reduce((s, d) => s + dueCount(d.id), 0);
  }
  function topicCards(t: Topic) {
    return data.decks
      .filter((d) => d.topicId === t.id)
      .reduce((s, d) => s + (data.cards[d.id]?.length ?? 0), 0);
  }
  function topicDeckCount(t: Topic) {
    return data.decks.filter((d) => d.topicId === t.id).length;
  }

  function handleCreateTopic() {
    const name = newTopicName.trim();
    if (!name) return;
    onCreateTopic(name);
    setNewTopicName('');
    setShowNewTopic(false);
  }

  return (
    <div className="app-layout">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="app-sidebar">
        <div style={styles.sidebarLogo}>
          <span style={styles.sidebarIcon}>🃏</span>
          <h1 style={styles.sidebarTitle}>Flashi</h1>
          <p style={styles.sidebarSub}>Spaced Repetition</p>
        </div>
        <div style={{ marginTop: 24 }}>
          {stats.map(({ label, val }) => (
            <div key={label} style={styles.sidebarStat}>
              <span style={styles.sidebarStatVal}>{val}</span>
              <span style={styles.sidebarStatLabel}>{label}</span>
            </div>
          ))}
        </div>
        <div style={styles.sidebarActions}>
          {onAdmin && (
            <button onClick={onAdmin} style={styles.adminBtn}>
              👥 Users
            </button>
          )}
          <button onClick={onLogout} style={styles.logoutBtn}>
            ↩ Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="app-main" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Mobile stats bar */}
        <div className="mobile-stats">
          {stats.map(({ label, val }) => (
            <div key={label} style={styles.mobileStatCell}>
              <span style={styles.mobileStatVal}>{val}</span>
              <span style={styles.mobileStatLabel}>{label}</span>
            </div>
          ))}
        </div>

        {/* Mobile header */}
        <div className="mobile-only" style={styles.mobileHeader}>
          <div>
            <h1 style={styles.title}>🃏 Flashi</h1>
            <p style={styles.subtitle}>Spaced Repetition</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {onAdmin && (
              <button onClick={onAdmin} style={styles.adminBtnMobile}>
                👥
              </button>
            )}
            <button onClick={onLogout} style={styles.logoutBtnMobile}>
              ↩
            </button>
          </div>
        </div>

        <div style={styles.list}>
          {/* ── Topics grid ────────────────────────────── */}
          {(data.topics.length > 0 || data.decks.length === 0) && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>Topics</span>
                <button onClick={() => setShowNewTopic(true)} style={styles.newTopicBtn}>
                  + New topic
                </button>
              </div>

              {data.topics.length === 0 && data.decks.length === 0 && (
                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>📚</div>
                  <p style={styles.emptyTitle}>No decks yet</p>
                  <p style={styles.emptyHint}>
                    Create a topic to organise your decks, then import a deck — or ask an AI to
                    generate flashcards in JSON format for you!
                  </p>
                </div>
              )}

              <div className="topic-grid">
                {data.topics.map((t) => {
                  const due = topicDue(t);
                  const cards = topicCards(t);
                  const deckCount = topicDeckCount(t);
                  return (
                    <button key={t.id} onClick={() => onOpenTopic(t.id)} style={styles.topicCard}>
                      <div style={styles.topicEmoji}>📂</div>
                      <div style={styles.topicName}>{t.name}</div>
                      <div style={styles.topicMeta}>
                        {deckCount} deck{deckCount !== 1 ? 's' : ''} · {cards} cards
                      </div>
                      {due > 0 && <div style={styles.topicDue}>{due} due</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* New topic form */}
          {showNewTopic && (
            <div style={styles.newTopicForm}>
              <input
                autoFocus
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTopic();
                  if (e.key === 'Escape') setShowNewTopic(false);
                }}
                placeholder="Topic name…"
                style={styles.newTopicInput}
              />
              <button onClick={handleCreateTopic} style={styles.createTopicConfirm}>
                Create
              </button>
              <button onClick={() => setShowNewTopic(false)} style={styles.createTopicCancel}>
                Cancel
              </button>
            </div>
          )}

          {/* ── Unassigned decks ───────────────────────── */}
          {unassignedDecks.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>
                  {data.topics.length > 0 ? 'Uncategorised' : 'Decks'}
                </span>
                {data.topics.length === 0 && (
                  <button onClick={() => setShowNewTopic(true)} style={styles.newTopicBtn}>
                    + New topic
                  </button>
                )}
              </div>

              {unassignedDecks.map((deck) => {
                const due = dueCount(deck.id);
                const total = data.cards[deck.id]?.length ?? 0;
                const allDone = due === 0;
                return (
                  <div key={deck.id} style={styles.deckCard}>
                    <div style={styles.deckInfo}>
                      <div style={styles.deckName}>{deck.name}</div>
                      <div style={styles.deckMeta}>
                        <span>{total} cards</span>
                        <span style={{ opacity: 0.4 }}>·</span>
                        {allDone ? (
                          <span style={{ color: C.good }}>✓ Done</span>
                        ) : (
                          <span style={{ color: C.accent }}>{due} due</span>
                        )}
                      </div>
                    </div>
                    {onAssignTopic && (
                      <button
                        onClick={() => setAssignTarget(deck.id)}
                        style={styles.assignBtn}
                        aria-label="Add to topic"
                        title="Add to topic"
                      >
                        📂
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(deck.id)}
                      style={styles.deleteBtn}
                      aria-label="Delete"
                    >
                      🗑
                    </button>
                    <button
                      onClick={() => onStudy(deck.id)}
                      disabled={allDone}
                      style={{
                        ...styles.studyBtn,
                        background: allDone ? 'transparent' : C.accent,
                        border: allDone ? `1px solid ${C.border}` : 'none',
                        color: allDone ? C.muted : '#0d0d14',
                        cursor: allDone ? 'default' : 'pointer',
                        boxShadow: allDone ? 'none' : `0 2px 12px rgba(232,160,48,0.25)`,
                      }}
                    >
                      {allDone ? 'Done' : 'Study'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete modal */}
        {deleteConfirm && (
          <div style={styles.modalBackdrop}>
            <div style={styles.modal}>
              <p style={styles.modalTitle}>Delete deck?</p>
              <p style={styles.modalName}>
                &ldquo;{data.decks.find((d) => d.id === deleteConfirm)?.name}&rdquo;
              </p>
              <div style={styles.modalBtns}>
                <button onClick={() => setDeleteConfirm(null)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(deleteConfirm);
                    setDeleteConfirm(null);
                  }}
                  style={styles.confirmDeleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign to topic modal */}
        {assignTarget && onAssignTopic && (
          <div style={styles.modalBackdrop} onClick={() => setAssignTarget(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <p style={styles.modalTitle}>Add to topic</p>
              <p style={styles.modalName}>
                &ldquo;{data.decks.find((d) => d.id === assignTarget)?.name}&rdquo;
              </p>
              <div style={styles.topicPickerList}>
                {data.topics.map((t) => (
                  <button
                    key={t.id}
                    style={styles.topicPickerItem}
                    onClick={() => {
                      onAssignTopic(assignTarget, t.id);
                      setAssignTarget(null);
                    }}
                  >
                    <span>📂</span>
                    <span style={styles.topicPickerName}>{t.name}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setAssignTarget(null)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* FABs */}
        <button onClick={onImport} style={styles.fab}>
          + Import deck
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebarLogo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  sidebarIcon: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 36,
    color: C.accent,
    lineHeight: 1,
    marginBottom: 4,
  },
  sidebarTitle: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 22,
    fontWeight: 600,
  },
  sidebarSub: { color: C.muted, fontSize: 11, marginTop: 2, letterSpacing: '0.06em' },
  sidebarStat: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    padding: '10px 0',
    borderBottom: `1px solid ${C.border}`,
  },
  sidebarStatVal: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 26,
    fontWeight: 600,
    lineHeight: 1,
  },
  sidebarStatLabel: { color: C.muted, fontSize: 12 },
  mobileStatCell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 0',
    borderRight: `1px solid ${C.border}`,
  },
  mobileStatVal: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 20,
    fontWeight: 600,
  },
  mobileStatLabel: { color: C.muted, fontSize: 10, marginTop: 1 },
  mobileHeader: {
    padding: '20px 20px 14px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sidebarActions: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignSelf: 'stretch',
  },
  adminBtn: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 12,
    padding: '8px 12px',
    alignSelf: 'flex-start',
  },
  logoutBtn: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 12,
    padding: '8px 12px',
    alignSelf: 'flex-start',
  },
  adminBtnMobile: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 16,
    padding: '6px 10px',
  },
  logoutBtnMobile: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 16,
    padding: '6px 10px',
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 28,
    fontWeight: 600,
  },
  subtitle: { color: C.muted, fontSize: 11, marginTop: 2, letterSpacing: '0.05em' },
  list: { padding: '20px 16px 120px', maxWidth: 560, width: '100%', margin: '0 auto' },
  section: { marginBottom: 28 },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  newTopicBtn: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    color: C.mutedLight,
    cursor: 'pointer',
    fontSize: 12,
    padding: '5px 12px',
  },
  topicCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: '18px 14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    textAlign: 'left',
    transition: 'border-color 0.2s',
  },
  topicEmoji: { fontSize: 28, marginBottom: 4 },
  topicName: {
    color: C.text,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  topicMeta: { color: C.muted, fontSize: 11 },
  topicDue: {
    marginTop: 4,
    color: C.accent,
    fontSize: 11,
    fontWeight: 600,
  },
  newTopicForm: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  newTopicInput: {
    flex: 1,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.text,
    fontSize: 14,
    padding: '10px 14px',
  },
  createTopicConfirm: {
    background: C.accent,
    border: 'none',
    borderRadius: 12,
    color: '#0d0d14',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 16px',
  },
  createTopicCancel: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 13,
    padding: '10px 14px',
  },
  empty: { textAlign: 'center', padding: '48px 24px', color: C.muted },
  emptyIcon: { fontSize: 52, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { fontSize: 16, color: C.mutedLight, marginBottom: 8 },
  emptyHint: { fontSize: 13, lineHeight: 1.7 },
  deckCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: '15px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  deckInfo: { flex: 1, minWidth: 0 },
  deckName: {
    color: C.text,
    fontSize: 14.5,
    fontWeight: 500,
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deckMeta: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted },
  assignBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: C.muted,
    padding: '6px 6px',
    fontSize: 15,
    flexShrink: 0,
  },
  deleteBtn: {
    background: 'none',
    border: `1px solid ${C.again}44`,
    borderRadius: 8,
    cursor: 'pointer',
    color: C.again,
    padding: '5px 8px',
    fontSize: 14,
    flexShrink: 0,
  },
  studyBtn: {
    borderRadius: 11,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap',
    flexShrink: 0,
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
  modalName: { color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 22 },
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
  confirmDeleteBtn: {
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
  topicPickerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
    maxHeight: 240,
    overflowY: 'auto',
  },
  topicPickerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  topicPickerName: {
    color: C.text,
    fontSize: 14,
    fontWeight: 500,
  },
  fab: {
    position: 'fixed',
    bottom: 28,
    right: 20,
    background: C.accent,
    color: '#0d0d14',
    border: 'none',
    borderRadius: 16,
    padding: '14px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 6px 28px rgba(232,160,48,0.3)',
  },
};
