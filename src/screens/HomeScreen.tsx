import { useState, useRef, useEffect, Fragment } from 'react';
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
  onDelete: (deckId: string) => void;
  onOpenTopic: (topicId: string) => void;
  onCreateTopic: (name: string) => void;
  onReorderTopics: (topicIds: string[]) => void;
  onAssignTopic?: (deckId: string, topicId: string) => void;
  onAdmin?: () => void;
  onSettings: () => void;
  onProgression: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function HomeScreen({
  data,
  dueCount,
  onStudy,
  onDelete,
  onOpenTopic,
  onCreateTopic,
  onReorderTopics,
  onAssignTopic,
  onAdmin,
  onSettings,
  onProgression,
  onLogout,
  theme,
  onToggleTheme,
}: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [dragOverTopicId, setDragOverTopicId] = useState<string | null>(null);
  const [draggingDeckId, setDraggingDeckId] = useState<string | null>(null);
  const [dragTopicIdx, setDragTopicIdx] = useState<number | null>(null);
  const [dropTopicIdx, setDropTopicIdx] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
    else setSearchQuery('');
  }, [searchOpen]);

  const sq = searchQuery.toLowerCase().trim();
  const filteredTopics = sq ? data.topics.filter((t) => t.name.toLowerCase().includes(sq)) : data.topics;

  const totalDue = data.decks.reduce((s, d) => s + dueCount(d.id), 0);
  const totalCards = data.decks.reduce((s, d) => s + (data.cards[d.id]?.length ?? 0), 0);
  const totalQuizzes = (data.quizzes ?? []).length;
  const totalQuestions = (data.quizzes ?? []).reduce((s, q) => s + q.questions.length, 0);
  const unassignedDecks = data.decks.filter((d) => !d.topicId);

  const stats = [
    { label: 'Decks', val: data.decks.length },
    { label: 'Cards', val: totalCards },
    { label: 'Quizzes', val: totalQuizzes },
    { label: 'Questions', val: totalQuestions },
    { label: 'Due', val: totalDue },
  ];

  const mobileStats = [
    { label: 'Decks', val: data.decks.length },
    { label: 'Cards', val: totalCards },
    { label: 'Quizzes', val: totalQuizzes },
    { label: 'Due', val: totalDue },
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
  function topicQuizCount(t: Topic) {
    return (data.quizzes ?? []).filter((q) => q.topicId === t.id).length;
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
            <button onClick={onAdmin} className="sidebar-btn" style={styles.adminBtn}>
              👥 Users
            </button>
          )}
          <button onClick={onProgression} className="sidebar-btn" style={styles.adminBtn}>
            <ProgressionIcon /> Progression
          </button>
          <button onClick={onSettings} className="sidebar-btn" style={styles.adminBtn}>
            <GearIcon /> Settings
          </button>
          <div style={styles.logoutRow}>
            <button onClick={onLogout} className="sidebar-btn" style={styles.logoutBtn}>
              ↩ Logout
            </button>
            <button onClick={onToggleTheme} style={styles.sidebarThemeBtn} title="Toggle theme">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="mobile-stats">
          {mobileStats.map(({ label, val }) => (
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
              {data.topics.length > 0 && (
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionTitle}>Topics</span>
                </div>
              )}

              {data.topics.length === 0 && data.decks.length === 0 && (
                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>📚</div>
                  <p style={styles.emptyTitle}>No topics yet</p>
                  <p style={styles.emptyHint}>
                    Create a topic to organise your decks, then import a deck — or ask an AI to
                    generate flashcards in JSON format for you!
                  </p>
                  <button onClick={() => setShowNewTopic(true)} style={styles.createFirstTopicBtn}>
                    + Create first topic
                  </button>
                </div>
              )}

              <div className="topic-grid">
                {filteredTopics.map((t, tIdx) => {
                  const due = topicDue(t);
                  const cards = topicCards(t);
                  const deckCount = topicDeckCount(t);
                  const topicPct = cards > 0 ? Math.round((1 - due / cards) * 100) : 100;
                  const isDeckDropTarget = dragOverTopicId === t.id && draggingDeckId !== null;
                  const quizCount = topicQuizCount(t);
                  const isDraggingTopic = dragTopicIdx === tIdx;
                  const isTopicDropTarget = dropTopicIdx === tIdx && dragTopicIdx !== null && dragTopicIdx !== tIdx;

                  function handleTopicDrop() {
                    if (dragTopicIdx !== null && dragTopicIdx !== tIdx) {
                      const reordered = [...data.topics];
                      const [item] = reordered.splice(dragTopicIdx, 1);
                      const insertAt = dragTopicIdx < tIdx ? tIdx - 1 : tIdx;
                      reordered.splice(insertAt, 0, item);
                      onReorderTopics(reordered.map((tp) => tp.id));
                    }
                    if (draggingDeckId && onAssignTopic) {
                      onAssignTopic(draggingDeckId, t.id);
                      setDraggingDeckId(null);
                    }
                    setDragOverTopicId(null);
                    setDragTopicIdx(null);
                    setDropTopicIdx(null);
                  }

                  return (
                    <Fragment key={t.id}>
                      {isTopicDropTarget && (
                        <div style={styles.topicDropSlot} />
                      )}
                      <button
                        className="topic-island"
                        draggable={!draggingDeckId}
                        onClick={() => { if (dragTopicIdx === null) onOpenTopic(t.id); }}
                        style={{
                          ...styles.topicCard,
                          border: isDeckDropTarget ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                          background: isDeckDropTarget ? 'var(--easy-bg)' : C.surface,
                          opacity: isDraggingTopic ? 0.35 : 1,
                          transition: 'opacity 0.15s',
                        }}
                        onDragStart={() => { setDragTopicIdx(tIdx); setDropTopicIdx(null); }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggingDeckId) setDragOverTopicId(t.id);
                          else setDropTopicIdx(tIdx);
                        }}
                        onDragLeave={() => { setDragOverTopicId(null); }}
                        onDrop={(e) => { e.preventDefault(); handleTopicDrop(); }}
                        onDragEnd={() => { setDragTopicIdx(null); setDropTopicIdx(null); setDragOverTopicId(null); }}
                      >
                        <div style={styles.topicEmoji}>📂</div>
                        <div style={styles.topicName}>{t.name}</div>
                        <div style={styles.topicMeta}>
                          {deckCount} deck{deckCount !== 1 ? 's' : ''} · {cards} cards
                          {quizCount > 0 && ` · ${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}`}
                        </div>
                        {cards > 0 && (
                          <div style={{ ...styles.topicPct, color: topicPct >= 80 ? C.good : topicPct >= 40 ? C.hard : C.muted }}>
                            {topicPct}%
                          </div>
                        )}
                        {due > 0 && <div style={styles.topicDue}>{due} due</div>}
                        {isDeckDropTarget && <div style={styles.dropHint}>Drop here</div>}
                      </button>
                    </Fragment>
                  );
                })}
                {/* Ghost slot at the end of the grid */}
                {dragTopicIdx !== null && (
                  <div
                    style={{
                      ...styles.topicDropSlot,
                      display: dropTopicIdx === data.topics.length ? 'block' : 'none',
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDropTopicIdx(data.topics.length); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragTopicIdx !== null) {
                        const reordered = [...data.topics];
                        const [item] = reordered.splice(dragTopicIdx, 1);
                        reordered.push(item);
                        onReorderTopics(reordered.map((tp) => tp.id));
                      }
                      setDragTopicIdx(null); setDropTopicIdx(null);
                    }}
                  />
                )}
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

        {data.topics.length > 0 && (
          <div style={styles.fabRow}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              background: C.surface2,
              border: `1px solid ${searchOpen ? C.accent : C.border}`,
              borderRadius: searchOpen ? 26 : '50%',
              width: searchOpen ? 220 : 52,
              height: 52,
              transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), border-radius 0.35s ease, border-color 0.25s',
              boxShadow: searchOpen
                ? `0 0 0 2px ${C.accent}55, 0 4px 20px var(--accent-shadow-sm)`
                : '0 2px 12px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false); }}
                placeholder="Search topics…"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: C.text,
                  fontSize: 13,
                  padding: '0 0 0 16px',
                  opacity: searchOpen ? 1 : 0,
                  transition: `opacity ${searchOpen ? '0.2s 0.18s' : '0.1s 0s'}`,
                  outline: 'none',
                  pointerEvents: searchOpen ? 'auto' : 'none',
                  minWidth: 0,
                }}
              />
              <button
                onClick={() => setSearchOpen((o) => !o)}
                style={{
                  width: 52,
                  height: 52,
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  color: searchOpen ? C.accent : C.mutedLight,
                  fontSize: searchOpen ? 15 : 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s, font-size 0.15s',
                }}
                aria-label={searchOpen ? 'Close search' : 'Search topics'}
              >
                {searchOpen ? '✕' : '🔍'}
              </button>
            </div>
            <button onClick={() => setShowNewTopic(true)} style={styles.fab}>
              + New topic
            </button>
          </div>
        )}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtn: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 12,
    padding: '8px 12px',
    flex: 1,
    textAlign: 'center',
  },
  sidebarThemeBtn: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: '50%',
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    cursor: 'pointer',
    flexShrink: 0,
  } as React.CSSProperties,
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
  topicDropSlot: {
    border: `2px dashed ${C.accent}`,
    borderRadius: 18,
    background: 'var(--easy-bg)',
    minHeight: 80,
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
  emptyHint: { fontSize: 13, lineHeight: 1.7, marginBottom: 24 },
  createFirstTopicBtn: {
    background: C.accent,
    border: 'none',
    borderRadius: 20,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    padding: '12px 24px',
    boxShadow: '0 4px 20px var(--accent-shadow)',
  },
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
  fabRow: {
    position: 'fixed',
    bottom: 28,
    right: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 100,
  },
  fabSearchWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    color: C.text,
    fontSize: 13,
    padding: '13px 16px',
    width: 180,
    outline: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
  },
  fabSearch: {
    borderRadius: '50%',
    width: 52,
    height: 52,
    border: `1px solid ${C.border}`,
    fontSize: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s, box-shadow 0.2s',
    flexShrink: 0,
  } as React.CSSProperties,
  fab: {
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    padding: '14px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 6px 28px var(--accent-shadow)',
    whiteSpace: 'nowrap',
  },
};
