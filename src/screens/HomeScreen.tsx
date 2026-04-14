import { useState } from 'react';
import type { FlashiData, Topic } from '../types';
import { C } from '../theme';

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M1 4h13M5 4V2h5v2M2 4l1 9a2 2 0 002 2h5a2 2 0 002-2l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7v4M9 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 9.5a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6.1 1.5l-.4 1.2a5 5 0 00-1.1.65L3.4 3l-1.4 2.4.9.9a5.1 5.1 0 000 1.4l-.9.9L3.4 11l1.2-.35a5 5 0 001.1.65l.4 1.2h2.8l.4-1.2a5 5 0 001.1-.65L11.6 11 13 8.6l-.9-.9a5.1 5.1 0 000-1.4l.9-.9L11.6 3l-1.2.35a5 5 0 00-1.1-.65L8.9 1.5H6.1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

function ProgressionIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M1 12l3.5-4 3 2.5 3-5.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

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
  onSettings: () => void;
  onProgression: () => void;
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
  onSettings,
  onProgression,
  onLogout,
}: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [dragOverTopicId, setDragOverTopicId] = useState<string | null>(null);
  const [draggingDeckId, setDraggingDeckId] = useState<string | null>(null);

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
      <aside className="app-sidebar">
        <div style={styles.sidebarLogo}>
          <img src="/icon-128.png" alt="Flashi" style={styles.sidebarIcon} />
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
          <button onClick={onProgression} style={{ ...styles.adminBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ProgressionIcon /> Progression
          </button>
          <button onClick={onSettings} style={{ ...styles.adminBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GearIcon /> Settings
          </button>
          <button onClick={onLogout} style={styles.logoutBtn}>
            ↩ Logout
          </button>
        </div>
      </aside>

      <div className="app-main" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="mobile-stats">
          {stats.map(({ label, val }) => (
            <div key={label} style={styles.mobileStatCell}>
              <span style={styles.mobileStatVal}>{val}</span>
              <span style={styles.mobileStatLabel}>{label}</span>
            </div>
          ))}
        </div>

        <div className="mobile-only" style={styles.mobileHeader}>
          <div>
            <h1 style={styles.title}>
              <img src="/icon-128.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain', verticalAlign: 'middle', marginRight: 8 }} />
              Flashi
            </h1>
            <p style={styles.subtitle}>Spaced Repetition</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {onAdmin && (
              <button onClick={onAdmin} style={styles.adminBtnMobile}>
                👥
              </button>
            )}
            <button onClick={onProgression} style={styles.adminBtnMobile} title="Progression">
              <ProgressionIcon />
            </button>
            <button onClick={onSettings} style={styles.adminBtnMobile} title="Settings">
              <GearIcon />
            </button>
            <button onClick={onLogout} style={styles.logoutBtnMobile}>
              ↩
            </button>
          </div>
        </div>

        <div style={styles.list}>
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
                  const topicPct = cards > 0 ? Math.round((1 - due / cards) * 100) : 100;
                  const isDropTarget = dragOverTopicId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onOpenTopic(t.id)}
                      style={{
                        ...styles.topicCard,
                        border: isDropTarget ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                        background: isDropTarget ? 'var(--easy-bg)' : C.surface,
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverTopicId(t.id); }}
                      onDragLeave={() => setDragOverTopicId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverTopicId(null);
                        if (draggingDeckId && onAssignTopic) {
                          onAssignTopic(draggingDeckId, t.id);
                          setDraggingDeckId(null);
                        }
                      }}
                    >
                      <div style={styles.topicEmoji}>📂</div>
                      <div style={styles.topicName}>{t.name}</div>
                      <div style={styles.topicMeta}>
                        {deckCount} deck{deckCount !== 1 ? 's' : ''} · {cards} cards
                      </div>
                      {cards > 0 && (
                        <div style={{ ...styles.topicPct, color: topicPct >= 80 ? C.good : topicPct >= 40 ? C.hard : C.muted }}>
                          {topicPct}%
                        </div>
                      )}
                      {due > 0 && <div style={styles.topicDue}>{due} due</div>}
                      {isDropTarget && <div style={styles.dropHint}>Drop here</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

              <div style={styles.deckScrollList}>
              {unassignedDecks.map((deck) => {
                const due = dueCount(deck.id);
                const total = data.cards[deck.id]?.length ?? 0;
                const allDone = due === 0;
                return (
                  <div
                    key={deck.id}
                    style={{ ...styles.deckCard, cursor: data.topics.length > 0 ? 'grab' : undefined }}
                    draggable={data.topics.length > 0}
                    onDragStart={() => setDraggingDeckId(deck.id)}
                    onDragEnd={() => { setDraggingDeckId(null); setDragOverTopicId(null); }}
                  >
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
                      {total > 0 && (
                        <>
                          <div style={styles.progressPctLabel}>
                            {Math.round((1 - due / total) * 100)}% complete
                          </div>
                          <div style={styles.progressTrack}>
                            <div style={{ ...styles.progressFill, width: `${Math.round((1 - due / total) * 100)}%` }} />
                          </div>
                        </>
                      )}
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
                      <TrashIcon />
                    </button>
                    <button
                      onClick={() => onStudy(deck.id)}
                      disabled={allDone}
                      style={{
                        ...styles.studyBtn,
                        background: allDone ? 'transparent' : C.accent,
                        border: allDone ? `1px solid ${C.border}` : 'none',
                        color: allDone ? C.muted : '#fff',
                        cursor: allDone ? 'default' : 'pointer',
                        boxShadow: allDone ? 'none' : '0 2px 12px var(--accent-shadow-sm)',
                      }}
                    >
                      {allDone ? 'Done' : 'Study'}
                    </button>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>

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

        <button onClick={onImport} style={styles.fab}>
          + Create deck
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebarLogo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  sidebarIcon: {
    width: 36,
    height: 36,
    objectFit: 'contain',
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
    background: C.accent,
    border: 'none',
    borderRadius: 20,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 14px',
    boxShadow: '0 2px 10px var(--accent-shadow-sm)',
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
  topicPct: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
    marginTop: 2,
  },
  topicDue: {
    marginTop: 2,
    color: C.accent,
    fontSize: 11,
    fontWeight: 600,
  },
  dropHint: {
    marginTop: 6,
    color: C.accent,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.04em',
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
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 16px',
  },
  deckScrollList: {
    maxHeight: '60vh',
    overflowY: 'auto',
    paddingRight: 2,
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
  progressPctLabel: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
    letterSpacing: '0.02em',
  },
  progressTrack: {
    height: 3,
    background: C.border,
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: C.good,
    borderRadius: 2,
    transition: 'width 0.3s ease',
    minWidth: 3,
  },
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
    background: C.again,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    color: '#fff',
    padding: '7px 9px',
    fontSize: 14,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    padding: '14px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 6px 28px var(--accent-shadow)',
  },
};
