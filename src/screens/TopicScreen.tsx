import { useState } from 'react';
import type { FlashiData, Topic, Quiz } from '../types';
import { C } from '../theme';

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M1 4h13M5 4V2h5v2M2 4l1 9a2 2 0 002 2h5a2 2 0 002-2l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7v4M9 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

interface Props {
  topic: Topic;
  data: FlashiData;
  dueCount: (deckId: string) => number;
  onStudy: (deckId: string) => void;
  onDelete: (deckId: string) => void;
  onDeleteTopic: (topicId: string) => void;
  onCreateDeck: () => void;
  onCreateQuiz: () => void;
  onStartQuiz: (quizId: string) => void;
  onDeleteQuiz: (quizId: string) => void;
  onDeleteBatch: (deckIds: string[], quizIds: string[]) => void;
  onDailyMix: () => void;
  onDailyQuizMix: () => void;
  faultCount: number;
  onRepeatFaults: () => void;
  onBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function TopicScreen({
  topic,
  data,
  dueCount,
  onStudy,
  onDelete,
  onDeleteTopic,
  onCreateDeck,
  onCreateQuiz,
  onStartQuiz,
  onDeleteQuiz,
  onDeleteBatch,
  onDailyMix,
  onDailyQuizMix,
  faultCount,
  onRepeatFaults,
  onBack,
  theme,
  onToggleTheme,
}: Props) {
  const [confirmTopic, setConfirmTopic] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [mixOpen, setMixOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const decks = data.decks.filter((d) => d.topicId === topic.id);
  const quizzes: Quiz[] = (data.quizzes ?? []).filter((q) => q.topicId === topic.id);
  const totalCards = decks.reduce((s, d) => s + (data.cards[d.id]?.length ?? 0), 0);
  const totalDue = decks.reduce((s, d) => s + dueCount(d.id), 0);
  const totalQuestions = quizzes.reduce((s, q) => s + q.questions.length, 0);

  function quizStatus(quiz: Quiz): { label: string; color: string } {
    const results = quiz.results ?? [];
    if (results.length === 0) {
      try {
        const saved = localStorage.getItem(`flashi-quiz-progress-${quiz.id}`);
        if (saved) {
          const p = JSON.parse(saved) as { currentIndex: number; answers: unknown[] };
          if (p.currentIndex > 0 || p.answers?.length > 0) {
            return { label: 'In progress', color: C.hard };
          }
        }
      } catch { /* ignore */ }
      return { label: 'Not started', color: C.muted };
    }
    const last = results[results.length - 1];
    const pct = last.total > 0 ? Math.round((last.correct / last.total) * 100) : 0;
    const daysDiff = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
    if (daysDiff >= 7 || pct < 70) return { label: 'Due', color: C.accent };
    return { label: `${pct}% last time`, color: pct >= 80 ? C.good : C.hard };
  }

  function toggleSelect(key: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function enterDeleteMode() {
    setDeleteMode(true);
    setFabOpen(false);
    setMixOpen(false);
  }

  function exitDeleteMode() {
    setDeleteMode(false);
    setSelectedIds(new Set());
  }

  function executeDelete() {
    const deckIds = [...selectedIds].filter((k) => k.startsWith('deck:')).map((k) => k.slice(5));
    const quizIds = [...selectedIds].filter((k) => k.startsWith('quiz:')).map((k) => k.slice(5));
    onDeleteBatch(deckIds, quizIds);
    setSelectedIds(new Set());
    setDeleteMode(false);
    setConfirmDelete(false);
  }

  const stats = [
    { label: 'Decks', val: decks.length },
    { label: 'Quizzes', val: quizzes.length },
    { label: 'Cards', val: totalCards },
    { label: 'Questions', val: totalQuestions },
    { label: 'Due', val: totalDue },
  ];

  const selectedCount = selectedIds.size;

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div style={styles.sidebarTopRow}>
          <button onClick={onBack} style={styles.backBtn}>← Back</button>
          <button onClick={onToggleTheme} style={styles.sidebarThemeBtn} title="Toggle theme">
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </div>
        <div style={{ marginTop: 20 }}>
          <p style={styles.sidebarTopicLabel}>Topic</p>
          <h2 style={styles.sidebarTopicName}>{topic.name}</h2>
        </div>
        <div style={{ marginTop: 24 }}>
          {stats.map(({ label, val }) => (
            <div key={label} style={styles.sidebarStat}>
              <span style={styles.sidebarStatVal}>{val}</span>
              <span style={styles.sidebarStatLabel}>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={enterDeleteMode} style={styles.deleteItemsBtn}>
          <TrashIcon /> Delete items
        </button>
        <button onClick={() => setConfirmTopic(true)} style={styles.deleteTopicBtn}>
          <TrashIcon /> Delete topic
        </button>
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
          <button onClick={onBack} style={styles.backBtn}>
            ← Back
          </button>
          <h2 style={styles.mobileTopicName}>{topic.name}</h2>
          <button onClick={() => setConfirmTopic(true)} style={styles.mobileDeleteTopicBtn}>
            <TrashIcon />
          </button>
        </div>

        {deleteMode && (
          <div style={styles.deleteModeBanner}>
            <span style={styles.deleteModeLabel}>
              {selectedCount === 0 ? 'Tap items to select them' : `${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected`}
            </span>
            <button onClick={exitDeleteMode} style={styles.deleteModeCancel}>Cancel</button>
          </div>
        )}

        <div style={styles.list}>
          {decks.length === 0 && quizzes.length === 0 && (
            <div style={styles.emptyFull}>
              <div style={styles.emptyIcon}>📂</div>
              <p style={styles.emptyTitle}>Nothing here yet</p>
              <p style={styles.emptyHint}>
                Use the + button below to create a deck or quiz for this topic.
              </p>
            </div>
          )}
          {(decks.length > 0 || quizzes.length > 0) && (
            <div className="topic-lists-grid">
              <div style={styles.listsColumn}>
                <p style={styles.deckSectionTitle}>Flashcards</p>
                {decks.length === 0 && (
                  <div style={styles.empty}>
                    <div style={styles.emptyIcon}>📂</div>
                    <p style={styles.emptyTitle}>No decks in this topic</p>
                    <p style={styles.emptyHint}>
                      Use the + button below to add your first deck.
                    </p>
                  </div>
                )}

                {decks.map((deck) => {
                  const due = dueCount(deck.id);
                  const total = data.cards[deck.id]?.length ?? 0;
                  const allDone = due === 0;
                  const selKey = `deck:${deck.id}`;
                  const isSelected = selectedIds.has(selKey);

                  function handleClick() {
                    if (deleteMode) {
                      toggleSelect(selKey);
                    } else if (!allDone) {
                      onStudy(deck.id);
                    }
                  }

                  const classNames = [
                    'topic-island',
                    allDone && !deleteMode ? 'island-done' : '',
                    isSelected ? 'island-selected' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <button
                      key={deck.id}
                      className={classNames}
                      style={{
                        ...styles.deckCard,
                        cursor: deleteMode ? 'pointer' : allDone ? 'default' : 'pointer',
                      }}
                      onClick={handleClick}
                      disabled={!deleteMode && allDone}
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
                      {isSelected && <span style={styles.selectCheckmark}>✓</span>}
                    </button>
                  );
                })}
              </div>

              <div style={styles.listsColumn}>
                {quizzes.length > 0 && (
                  <div>
                    <p style={styles.quizSectionTitle}>Quizzes</p>
                    {quizzes.map((quiz) => {
                      const status = quizStatus(quiz);
                      const selKey = `quiz:${quiz.id}`;
                      const isSelected = selectedIds.has(selKey);

                      function handleClick() {
                        if (deleteMode) {
                          toggleSelect(selKey);
                        } else {
                          onStartQuiz(quiz.id);
                        }
                      }

                      const classNames = [
                        'topic-island',
                        isSelected ? 'island-selected' : '',
                      ].filter(Boolean).join(' ');

                      return (
                        <button
                          key={quiz.id}
                          className={classNames}
                          style={styles.quizCard}
                          onClick={handleClick}
                        >
                          <div style={styles.quizInfo}>
                            <div style={styles.quizName}>{quiz.name}</div>
                            <div style={styles.quizMeta}>
                              {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                              {' · '}
                              <span style={{ color: status.color, fontWeight: 600 }}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                          {isSelected && <span style={styles.selectCheckmark}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {(fabOpen || mixOpen) && (
          <div className="fab-menu-backdrop" onClick={() => { setFabOpen(false); setMixOpen(false); }} />
        )}

        <div style={styles.fabGroup}>
          {deleteMode && selectedCount > 0 && (
            <button onClick={() => setConfirmDelete(true)} style={styles.fabDeleteConfirm}>
              <TrashIcon /> Delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}
            </button>
          )}

          <div style={styles.fabRow}>
            {(totalCards > 0 || quizzes.length > 0) && (
              <div style={styles.fabCol}>
                {mixOpen && (
                  <div style={styles.fabMenuFloating}>
                    {quizzes.length > 0 && (
                      <button onClick={() => { onDailyQuizMix(); setMixOpen(false); }} style={styles.fabMenuItem}>
                        🎯 Daily quiz mix
                      </button>
                    )}
                    {totalCards > 0 && (
                      <button onClick={() => { onDailyMix(); setMixOpen(false); }} style={styles.fabMenuItem}>
                        ✨ Daily mix
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={() => { setMixOpen((o) => !o); setFabOpen(false); }}
                  className="fab-mix-btn"
                  style={{
                    ...styles.fabMix,
                    boxShadow: mixOpen ? '0 0 0 2px var(--accent), 0 4px 20px var(--accent-shadow-sm)' : undefined,
                  }}
                  aria-label={mixOpen ? 'Close mix menu' : 'Open mix menu'}
                >
                  🎲
                </button>
              </div>
            )}

            <div style={styles.fabCol}>
              {fabOpen && (
                <div style={styles.fabMenuFloating}>
                  {faultCount > 0 && (
                    <button onClick={() => { onRepeatFaults(); setFabOpen(false); }} style={styles.fabMenuItem}>
                      ↩ Repeat {faultCount} fault{faultCount !== 1 ? 's' : ''}
                    </button>
                  )}
                  <button onClick={() => { onCreateQuiz(); setFabOpen(false); }} style={styles.fabMenuItem}>
                    + Create quiz
                  </button>
                  <button onClick={() => { onCreateDeck(); setFabOpen(false); }} style={styles.fabMenuItemPrimary}>
                    + Create deck
                  </button>
                </div>
              )}
              <button
                onClick={() => { setFabOpen((o) => !o); setMixOpen(false); }}
                className={`fab-btn${fabOpen ? ' fab-btn--open' : ''}`}
                style={styles.fab}
                aria-label={fabOpen ? 'Close menu' : 'Open menu'}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {confirmDelete && (
          <div style={styles.modalBackdrop}>
            <div style={styles.modal}>
              <p style={styles.modalTitle}>Delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}?</p>
              <p style={styles.modalName}>This cannot be undone.</p>
              <div style={styles.modalBtns}>
                <button onClick={() => setConfirmDelete(false)} style={styles.cancelBtn}>Cancel</button>
                <button onClick={executeDelete} style={styles.confirmDeleteBtn}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {confirmTopic && (
          <div style={styles.modalBackdrop}>
            <div style={styles.modal}>
              <p style={styles.modalTitle}>Delete topic?</p>
              <p style={styles.modalName}>
                &ldquo;{topic.name}&rdquo; and all {decks.length} deck
                {decks.length !== 1 ? 's' : ''} inside will be permanently deleted.
              </p>
              <div style={styles.modalBtns}>
                <button onClick={() => setConfirmTopic(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteTopic(topic.id);
                    onBack();
                  }}
                  style={styles.confirmDeleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebarTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
  },
  sidebarTopicLabel: { color: C.muted, fontSize: 11, letterSpacing: '0.08em', marginBottom: 4 },
  sidebarTopicName: {
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.3,
  },
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
  },
  sidebarStatLabel: { color: C.muted, fontSize: 12 },
  deleteItemsBtn: {
    marginTop: 'auto',
    background: 'var(--again-bg)',
    border: `1px solid var(--again-border)`,
    borderRadius: 10,
    color: C.again,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    padding: '8px 12px',
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  deleteTopicBtn: {
    marginTop: 8,
    background: C.again,
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    padding: '8px 12px',
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
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
    padding: '14px 16px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  mobileTopicName: {
    flex: 1,
    fontFamily: "'Playfair Display', serif",
    color: C.text,
    fontSize: 17,
    fontWeight: 600,
  },
  mobileDeleteTopicBtn: {
    background: C.again,
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 15,
    padding: '6px 9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModeBanner: {
    background: 'var(--again-bg)',
    borderBottom: `1px solid var(--again-border)`,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  deleteModeLabel: {
    color: C.again,
    fontSize: 13,
    fontWeight: 500,
  },
  deleteModeCancel: {
    background: 'none',
    border: `1px solid var(--again-border)`,
    borderRadius: 10,
    color: C.again,
    cursor: 'pointer',
    fontSize: 12,
    padding: '5px 12px',
  },
  list: { padding: '20px 16px 200px', maxWidth: 1080, width: '100%', margin: '0 auto' },
  listsColumn: { flex: 1, minWidth: 0 },
  emptyFull: {
    textAlign: 'center',
    padding: '80px 24px',
    color: C.muted,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  empty: { textAlign: 'center', padding: '64px 24px', color: C.muted },
  emptyIcon: { fontSize: 52, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { fontSize: 16, color: C.mutedLight, marginBottom: 8 },
  emptyHint: { fontSize: 13, lineHeight: 1.7 },
  deckCard: {
    width: '100%',
    background: C.surface,
    border: 'none',
    borderRadius: 18,
    padding: '15px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textAlign: 'left',
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
  deckSectionTitle: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  quizSectionTitle: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  quizCard: {
    width: '100%',
    background: C.surface,
    border: 'none',
    borderRadius: 18,
    padding: '14px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textAlign: 'left',
    cursor: 'pointer',
  },
  quizInfo: { flex: 1, minWidth: 0 },
  quizName: {
    color: C.text,
    fontSize: 14.5,
    fontWeight: 500,
    marginBottom: 3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  quizMeta: { color: C.muted, fontSize: 12 },
  selectCheckmark: {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: C.again,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
  } as React.CSSProperties,
  fabGroup: {
    position: 'fixed',
    bottom: 28,
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 100,
  },
  fabRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  fabCol: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },
  fab: {
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 52,
    height: 52,
    fontSize: 26,
    fontWeight: 300,
    cursor: 'pointer',
    boxShadow: '0 6px 28px var(--accent-shadow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  fabMenu: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 4,
  },
  fabMenuFloating: {
    position: 'absolute',
    bottom: 'calc(100% + 10px)',
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  fabMenuItem: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    color: C.mutedLight,
    borderRadius: 14,
    padding: '11px 18px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
    whiteSpace: 'nowrap' as const,
  },
  fabMenuItemPrimary: {
    background: C.accent,
    border: 'none',
    color: '#fff',
    borderRadius: 14,
    padding: '11px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 20px var(--accent-shadow)',
    whiteSpace: 'nowrap' as const,
  },
  fabMix: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    color: C.mutedLight,
    borderRadius: '50%',
    width: 52,
    height: 52,
    fontSize: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    transition: 'box-shadow 0.2s',
  },
  fabDeleteConfirm: {
    background: C.again,
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '11px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(224,82,82,0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap' as const,
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
};
