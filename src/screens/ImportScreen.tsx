import { useState } from 'react';
import type { Topic } from '../types';
import { C } from '../theme';

interface CardDraft { front: string; back: string }

interface DeckDraft {
  name: string;
  cards: CardDraft[];
  topicId?: string;
}

interface Props {
  topics: Topic[];
  initialTopicId?: string;
  onImport: (decks: DeckDraft[]) => void;
  onBack: () => void;
}

const EXAMPLE = `// Single deck
{
  "name": "Lesson 1 – Cyrillic Alphabet",
  "cards": [
    { "front": "А а", "back": "A (as in father)" },
    { "front": "Б б", "back": "B (as in book)" }
  ]
}

// Or multiple decks at once
[
  { "name": "Deck 1", "cards": [{ "front": "...", "back": "..." }] },
  { "name": "Deck 2", "cards": [{ "front": "...", "back": "..." }] }
]`;

export default function ImportScreen({ topics, initialTopicId, onImport, onBack }: Props) {
  const [mode, setMode] = useState<'json' | 'manual'>('json');
  const [topicId, setTopicId] = useState(initialTopicId ?? '');

  // JSON mode state
  const [json, setJson] = useState('');
  const [error, setError] = useState('');

  // Manual mode state
  const [deckName, setDeckName] = useState('');
  const [cards, setCards] = useState<CardDraft[]>([{ front: '', back: '' }]);

  function parseDeck(obj: unknown, label: string) {
    if (
      typeof obj !== 'object' || obj === null ||
      !('name' in obj) || !('cards' in obj) ||
      typeof (obj as { name: unknown }).name !== 'string' ||
      !Array.isArray((obj as { cards: unknown }).cards)
    ) {
      throw new Error(`${label}: Expected { "name": "...", "cards": [...] }`);
    }
    const { name, cards } = obj as { name: string; cards: unknown[] };
    const validated = cards.map((c, i) => {
      if (typeof c !== 'object' || c === null || !('front' in c) || !('back' in c)) {
        throw new Error(`${label}, card ${i + 1}: "front" and "back" are required`);
      }
      return {
        front: String((c as { front: unknown }).front),
        back: String((c as { back: unknown }).back),
      };
    });
    return { name, cards: validated };
  }

  function handleJsonImport() {
    setError('');
    try {
      const parsed = JSON.parse(json) as unknown;
      const tid = topicId || undefined;
      if (Array.isArray(parsed)) {
        const decks = parsed.map((item, i) => {
          const { name, cards } = parseDeck(item, `Deck ${i + 1}`);
          return { name, cards, topicId: tid };
        });
        onImport(decks);
      } else {
        const { name, cards } = parseDeck(parsed, 'Deck');
        onImport([{ name, cards, topicId: tid }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  function handleManualImport() {
    const name = deckName.trim();
    if (!name) return;
    const validCards = cards.filter((c) => c.front.trim() || c.back.trim());
    if (validCards.length === 0) return;
    onImport([{ name, cards: validCards, topicId: topicId || undefined }]);
  }

  function addCard() {
    setCards((prev) => [...prev, { front: '', back: '' }]);
  }

  function updateCard(idx: number, field: 'front' | 'back', value: string) {
    setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }

  function removeCard(idx: number) {
    setCards((prev) => prev.filter((_, i) => i !== idx));
  }

  function deckCount() {
    try {
      const parsed = JSON.parse(json) as unknown;
      if (Array.isArray(parsed)) return parsed.length;
    } catch { /* ignore */ }
    return 1;
  }

  const manualValid = deckName.trim() && cards.some((c) => c.front.trim() || c.back.trim());

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <h2 style={styles.heading}>Create Deck</h2>
        <div style={{ width: 70 }} />
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setMode('json')}
          style={{ ...styles.tab, ...(mode === 'json' ? styles.tabActive : {}) }}
        >
          JSON Import
        </button>
        <button
          onClick={() => setMode('manual')}
          style={{ ...styles.tab, ...(mode === 'manual' ? styles.tabActive : {}) }}
        >
          Manual
        </button>
      </div>

      <div style={styles.content}>
        {topics.length > 0 && (
          <div>
            <label style={styles.label}>Add to topic (optional)</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} style={styles.select}>
              <option value="">— No topic —</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {mode === 'json' && (
          <>
            <p style={styles.hint}>
              Paste JSON below. Ask an AI to generate decks in this format for you:
            </p>
            <pre style={styles.example}>{EXAMPLE}</pre>

            <textarea
              value={json}
              onChange={(e) => { setJson(e.target.value); setError(''); }}
              placeholder='{ "name": "...", "cards": [...] }  or  [{ ... }, { ... }]'
              rows={10}
              style={{ ...styles.textarea, borderColor: error ? C.again : C.border }}
            />

            {error && <p style={styles.error}>⚠ {error}</p>}

            <button
              onClick={handleJsonImport}
              disabled={!json.trim()}
              style={{
                ...styles.importBtn,
                opacity: json.trim() ? 1 : 0.4,
                cursor: json.trim() ? 'pointer' : 'default',
              }}
            >
              {json.trim() && deckCount() > 1 ? `Import ${deckCount()} Decks` : 'Create Deck'}
            </button>
          </>
        )}

        {mode === 'manual' && (
          <>
            <div>
              <label style={styles.label}>Deck name</label>
              <input
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g. Russian Vocabulary"
                style={styles.nameInput}
                autoFocus
              />
            </div>

            <div style={styles.cardsSection}>
              <div style={styles.cardsSectionHeader}>
                <span style={styles.cardsSectionTitle}>
                  Cards <span style={styles.cardCount}>{cards.filter((c) => c.front.trim() || c.back.trim()).length}</span>
                </span>
              </div>

              {cards.map((card, idx) => (
                <div key={idx} style={styles.cardRow}>
                  <div style={styles.cardNumber}>{idx + 1}</div>
                  <div style={styles.cardFields}>
                    <input
                      value={card.front}
                      onChange={(e) => updateCard(idx, 'front', e.target.value)}
                      placeholder="Front"
                      style={styles.cardInput}
                    />
                    <div style={styles.cardDivider}>→</div>
                    <input
                      value={card.back}
                      onChange={(e) => updateCard(idx, 'back', e.target.value)}
                      placeholder="Back"
                      style={styles.cardInput}
                    />
                  </div>
                  {cards.length > 1 && (
                    <button onClick={() => removeCard(idx)} style={styles.removeCardBtn} title="Remove card">
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button onClick={addCard} style={styles.addCardBtn}>
                + Add card
              </button>
            </div>

            <button
              onClick={handleManualImport}
              disabled={!manualValid}
              style={{
                ...styles.importBtn,
                opacity: manualValid ? 1 : 0.4,
                cursor: manualValid ? 'pointer' : 'default',
              }}
            >
              Create Deck ({cards.filter((c) => c.front.trim() || c.back.trim()).length} cards)
            </button>
          </>
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
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${C.border}`,
    padding: '0 20px',
    gap: 4,
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: C.muted,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    padding: '12px 16px',
    marginBottom: -1,
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: C.accent,
    borderBottomColor: C.accent,
  },
  content: {
    padding: '24px 16px 40px',
    maxWidth: 520,
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  hint: { color: C.mutedLight, fontSize: 13, lineHeight: 1.6 },
  label: {
    color: C.muted,
    fontSize: 12,
    letterSpacing: '0.04em',
    display: 'block',
    marginBottom: 6,
  },
  example: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '14px 16px',
    color: C.accent,
    fontSize: 12,
    overflowX: 'auto',
    lineHeight: 1.7,
    fontFamily: "'Fira Code', 'Fira Mono', monospace",
    whiteSpace: 'pre',
  },
  select: {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.text,
    fontSize: 14,
    padding: '11px 14px',
  },
  textarea: {
    background: C.surface,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 12,
    color: C.text,
    fontSize: 13,
    padding: '14px 16px',
    fontFamily: 'monospace',
    resize: 'vertical',
    lineHeight: 1.6,
    width: '100%',
  },
  error: { color: C.again, fontSize: 13 },
  importBtn: {
    background: C.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    width: '100%',
    boxShadow: '0 4px 20px var(--accent-shadow)',
    cursor: 'pointer',
  },
  nameInput: {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    color: C.text,
    fontSize: 15,
    fontWeight: 500,
    padding: '13px 16px',
  },
  cardsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardsSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardsSectionTitle: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,
  cardCount: {
    background: C.accent,
    color: '#fff',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
    padding: '1px 6px',
  },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: '12px 14px',
  },
  cardNumber: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    minWidth: 18,
    textAlign: 'center',
  } as React.CSSProperties,
  cardFields: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  cardInput: {
    flex: 1,
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 13,
    padding: '8px 10px',
    minWidth: 0,
  },
  cardDivider: {
    color: C.muted,
    fontSize: 14,
    flexShrink: 0,
  },
  removeCardBtn: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 18,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    lineHeight: 1,
  } as React.CSSProperties,
  addCardBtn: {
    background: 'none',
    border: `1px dashed ${C.border}`,
    borderRadius: 14,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    padding: '12px',
    textAlign: 'center',
    width: '100%',
    transition: 'border-color 0.15s, color 0.15s',
  },
};
