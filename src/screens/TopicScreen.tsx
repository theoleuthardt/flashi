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
  onDailyMix: () => void;
  faultCount: number;
  onRepeatFaults: () => void;
  onBack: () => void;
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
  onDailyMix,
  faultCount,
  onRepeatFaults,
  onBack,
}: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [confirmTopic, setConfirmTopic] = useState(false);
  const [deleteQuizConfirm, setDeleteQuizConfirm] = useState<string | null>(null);

  const decks = data.decks.filter((d) => d.topicId === topic.id);
  const quizzes: Quiz[] = (data.quizzes ?? []).filter((q) => q.topicId === topic.id);
  const totalCards = decks.reduce((s, d) => s + (data.cards[d.id]?.length ?? 0), 0);
  const totalDue = decks.reduce((s, d) => s + dueCount(d.id), 0);

  const stats = [
    { label: 'Decks', val: decks.length },
    { label: 'Cards', val: totalCards },
    { label: 'Due today', val: totalDue },
  ];

  return (
    <div className="app-layout">
      {/* Desktop sidebar */}
      <aside className="app-sidebar">
        <button onClick={onBack} style={styles.backBtn}>
          ← Back
        </button>
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
        <button onClick={() => setConfirmTopic(true)} style={styles.deleteTopicBtn}>
          <TrashIcon /> Delete topic
        </button>
      </aside>

      {/* Main */}
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
          <button onClick={onBack} style={styles.backBtn}>
            ← Back
          </button>
          <h2 style={styles.mobileTopicName}>{topic.name}</h2>
          <button onClick={() => setConfirmTopic(true)} style={styles.mobileDeleteTopicBtn}>
            <TrashIcon />
          </button>
        </div>

        {/* Deck list */}
        <div style={styles.list}>
          {decks.length === 0 && (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📂</div>
              <p style={styles.emptyTitle}>No decks in this topic</p>
              <p style={styles.emptyHint}>
                Use the Create Deck button below to add your first deck to this topic.
              </p>
            </div>
          )}

          <div style={styles.deckScrollList}>
          {decks.map((deck) => {
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

          {/* Quizzes section */}
          {quizzes.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={styles.quizSectionTitle}>Quizzes</p>
              {quizzes.map((quiz) => (
                <div key={quiz.id} style={styles.quizCard}>
                  <div style={styles.quizInfo}>
                    <div style={styles.quizName}>{quiz.name}</div>
                    <div style={styles.quizMeta}>{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}</div>
                  </div>
                  <button
                    onClick={() => setDeleteQuizConfirm(quiz.id)}
                    style={styles.deleteBtn}
                    aria-label="Delete quiz"
                  >
                    <TrashIcon />
                  </button>
                  <button onClick={() => onStartQuiz(quiz.id)} style={styles.startQuizBtn}>
                    Start
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete quiz modal */}
        {deleteQuizConfirm && (
          <div style={styles.modalBackdrop}>
            <div style={styles.modal}>
              <p style={styles.modalTitle}>Delete quiz?</p>
              <p style={styles.modalName}>
                &ldquo;{(data.quizzes ?? []).find((q) => q.id === deleteQuizConfirm)?.name}&rdquo;
              </p>
              <div style={styles.modalBtns}>
                <button onClick={() => setDeleteQuizConfirm(null)} style={styles.cancelBtn}>Cancel</button>
                <button
                  onClick={() => { onDeleteQuiz(deleteQuizConfirm); setDeleteQuizConfirm(null); }}
                  style={styles.confirmDeleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.fabGroup}>
          {faultCount > 0 && (
            <button onClick={onRepeatFaults} style={styles.fabFaults}>
              ↩ Repeat {faultCount} fault{faultCount !== 1 ? 's' : ''}
            </button>
          )}
          <button onClick={onDailyMix} style={styles.fabMix}>
            🎲 Daily mix
          </button>
          <button onClick={onCreateQuiz} style={styles.fabMix}>
            + Create quiz
          </button>
          <button onClick={onCreateDeck} style={styles.fab}>
            + Create deck
          </button>
        </div>

        {/* Delete deck modal */}
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

        {/* Delete topic modal */}
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
  backBtn: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    color: C.mutedLight,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    padding: '7px 16px',
    alignSelf: 'flex-start',
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
  deleteTopicBtn: {
    marginTop: 'auto',
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
  list: { padding: '20px 16px 120px', maxWidth: 560, width: '100%', margin: '0 auto' },
  empty: { textAlign: 'center', padding: '64px 24px', color: C.muted },
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
  deckScrollList: {
    maxHeight: '55vh',
    overflowY: 'auto',
    paddingRight: 2,
  },
  fabGroup: {
    position: 'fixed',
    bottom: 28,
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
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
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: '14px 16px',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
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
  startQuizBtn: {
    background: C.accent,
    border: 'none',
    borderRadius: 11,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 10px var(--accent-shadow-sm)',
  },
  fabMix: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    color: C.mutedLight,
    borderRadius: 14,
    padding: '11px 18px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  },
  fabFaults: {
    background: C.again,
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '11px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 12px rgba(224,82,82,0.3)',
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
};
