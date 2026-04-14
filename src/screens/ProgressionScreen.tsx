import type { FlashiData } from '../types';
import { C } from '../theme';

interface Props {
  data: FlashiData;
  onBack: () => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function cardStats(cards: { reps: number; due: string }[]) {
  const today = todayStr();
  let newCount = 0, dueCount = 0, learnedCount = 0;
  for (const c of cards) {
    if (c.reps === 0) newCount++;
    else if (c.due <= today) dueCount++;
    else learnedCount++;
  }
  return { new: newCount, due: dueCount, learned: learnedCount, total: cards.length };
}

interface StackedBarProps {
  learned: number;
  due: number;
  newCards: number;
  total: number;
}

function StackedBar({ learned, due, newCards, total }: StackedBarProps) {
  if (total === 0) return <div style={barStyles.track}><div style={{ ...barStyles.seg, width: '100%', background: C.border }} /></div>;
  const learnedPct = (learned / total) * 100;
  const duePct = (due / total) * 100;
  const newPct = (newCards / total) * 100;
  return (
    <div style={barStyles.track}>
      {learned > 0 && <div style={{ ...barStyles.seg, width: `${learnedPct}%`, background: C.good }} title={`${learned} learned`} />}
      {due > 0 && <div style={{ ...barStyles.seg, width: `${duePct}%`, background: C.accent }} title={`${due} due`} />}
      {newCards > 0 && <div style={{ ...barStyles.seg, width: `${newPct}%`, background: C.border }} title={`${newCards} new`} />}
    </div>
  );
}

const barStyles: Record<string, React.CSSProperties> = {
  track: {
    height: 10,
    background: C.surface2,
    borderRadius: 5,
    overflow: 'hidden',
    display: 'flex',
    width: '100%',
  },
  seg: { height: '100%', transition: 'width 0.4s ease' },
};

export default function ProgressionScreen({ data, onBack }: Props) {
  const allCards = Object.values(data.cards).flat();
  const overall = cardStats(allCards);
  const overallPct = overall.total > 0 ? Math.round((overall.learned / overall.total) * 100) : 0;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <h2 style={styles.heading}>Progression</h2>
        <div style={{ width: 70 }} />
      </div>

      <div style={styles.body}>
        <div style={styles.overallCard}>
          <p style={styles.overallLabel}>Overall completion</p>
          <div style={styles.overallRow}>
            <span style={{ ...styles.overallPct, color: overallPct >= 80 ? C.good : overallPct >= 40 ? C.hard : C.muted }}>
              {overallPct}%
            </span>
            <div style={styles.overallMeta}>
              <span style={{ color: C.good }}>■ {overall.learned} learned</span>
              <span style={{ color: C.accent }}>■ {overall.due} due</span>
              <span style={{ color: C.muted }}>■ {overall.new} new</span>
            </div>
          </div>
          <StackedBar learned={overall.learned} due={overall.due} newCards={overall.new} total={overall.total} />
        </div>

        <div style={styles.legend}>
          <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: C.good }} /> Learned</span>
          <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: C.accent }} /> Due today</span>
          <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: C.border }} /> New</span>
        </div>

        {data.topics.length === 0 && data.decks.length === 0 && (
          <div style={styles.empty}>No decks yet — create a topic and import a deck to see your progression.</div>
        )}

        {data.topics.map((topic) => {
          const topicDecks = data.decks.filter((d) => d.topicId === topic.id);
          const topicCards = topicDecks.flatMap((d) => data.cards[d.id] ?? []);
          const stats = cardStats(topicCards);
          const pct = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0;
          return (
            <div key={topic.id} style={styles.topicCard}>
              <div style={styles.topicHeader}>
                <div style={styles.topicLeft}>
                  <span style={styles.topicName}>{topic.name}</span>
                  <span style={styles.topicMeta}>{topicDecks.length} deck{topicDecks.length !== 1 ? 's' : ''} · {stats.total} cards</span>
                </div>
                <span style={{ ...styles.topicPct, color: pct >= 80 ? C.good : pct >= 40 ? C.hard : C.muted }}>
                  {pct}%
                </span>
              </div>
              <StackedBar learned={stats.learned} due={stats.due} newCards={stats.new} total={stats.total} />

              {topicDecks.length > 0 && (
                <div style={styles.deckList}>
                  {topicDecks.map((deck) => {
                    const dc = data.cards[deck.id] ?? [];
                    const ds = cardStats(dc);
                    const dp = ds.total > 0 ? Math.round((ds.learned / ds.total) * 100) : 0;
                    return (
                      <div key={deck.id} style={styles.deckRow}>
                        <div style={styles.deckRowLeft}>
                          <span style={styles.deckName}>{deck.name}</span>
                          <span style={styles.deckMeta}>{ds.total} cards</span>
                        </div>
                        <span style={{ ...styles.deckPct, color: dp >= 80 ? C.good : dp >= 40 ? C.hard : C.muted }}>
                          {dp}%
                        </span>
                        <div style={{ flex: 1, minWidth: 60 }}>
                          <StackedBar learned={ds.learned} due={ds.due} newCards={ds.new} total={ds.total} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {data.decks.filter((d) => !d.topicId).length > 0 && (
          <div style={styles.topicCard}>
            <div style={styles.topicHeader}>
              <div style={styles.topicLeft}>
                <span style={styles.topicName}>Uncategorised</span>
              </div>
            </div>
            <div style={styles.deckList}>
              {data.decks.filter((d) => !d.topicId).map((deck) => {
                const dc = data.cards[deck.id] ?? [];
                const ds = cardStats(dc);
                const dp = ds.total > 0 ? Math.round((ds.learned / ds.total) * 100) : 0;
                return (
                  <div key={deck.id} style={styles.deckRow}>
                    <div style={styles.deckRowLeft}>
                      <span style={styles.deckName}>{deck.name}</span>
                      <span style={styles.deckMeta}>{ds.total} cards</span>
                    </div>
                    <span style={{ ...styles.deckPct, color: dp >= 80 ? C.good : dp >= 40 ? C.hard : C.muted }}>
                      {dp}%
                    </span>
                    <div style={{ flex: 1, minWidth: 60 }}>
                      <StackedBar learned={ds.learned} due={ds.due} newCards={ds.new} total={ds.total} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {overall.due > 0 && (
          <div style={styles.dueHint}>
            📅 You have <strong>{overall.due}</strong> card{overall.due !== 1 ? 's' : ''} due today across all decks.
          </div>
        )}
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
  body: {
    padding: '20px 16px 60px',
    maxWidth: 560,
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  overallCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  overallLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  overallRow: { display: 'flex', alignItems: 'baseline', gap: 16 },
  overallPct: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 42,
    fontWeight: 600,
    lineHeight: 1,
  },
  overallMeta: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12 },
  legend: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    padding: '6px 0',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.muted },
  legendDot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  empty: { textAlign: 'center', color: C.muted, fontSize: 13, padding: '40px 20px', lineHeight: 1.7 },
  topicCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  topicHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  topicLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  topicName: { color: C.text, fontSize: 15, fontWeight: 600 },
  topicMeta: { color: C.muted, fontSize: 11 },
  topicPct: { fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, flexShrink: 0 },
  deckList: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 },
  deckRow: { display: 'flex', alignItems: 'center', gap: 10 },
  deckRowLeft: { display: 'flex', flexDirection: 'column', gap: 1, width: 120, flexShrink: 0 },
  deckName: {
    color: C.mutedLight,
    fontSize: 12,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  deckMeta: { color: C.muted, fontSize: 10 },
  deckPct: { fontSize: 12, fontWeight: 600, width: 32, textAlign: 'right', flexShrink: 0 },
  dueHint: {
    background: 'var(--easy-bg)',
    border: `1px solid var(--easy-border)`,
    borderRadius: 14,
    padding: '14px 16px',
    color: C.mutedLight,
    fontSize: 13,
    lineHeight: 1.5,
    textAlign: 'center',
  },
};
