import { useState } from 'react';
import type { Topic } from '../types';
import { C } from '../theme';

interface Props {
  topics: Topic[];
  onImport: (name: string, cards: Array<{ front: string; back: string }>, topicId?: string) => void;
  onBack: () => void;
}

const EXAMPLE = `{
  "name": "Lesson 1 – Cyrillic Alphabet",
  "cards": [
    { "front": "А а", "back": "A (as in father)" },
    { "front": "Б б", "back": "B (as in book)" }
  ]
}`;

export default function ImportScreen({ topics, onImport, onBack }: Props) {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const [topicId, setTopicId] = useState('');

  function handleImport() {
    setError('');
    try {
      const parsed = JSON.parse(json) as unknown;
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('name' in parsed) ||
        !('cards' in parsed) ||
        typeof (parsed as { name: unknown }).name !== 'string' ||
        !Array.isArray((parsed as { cards: unknown }).cards)
      ) {
        throw new Error(
          'Expected: { "name": "...", "cards": [{ "front": "...", "back": "..." }] }'
        );
      }
      const { name, cards } = parsed as { name: string; cards: unknown[] };
      const validated = cards.map((c, i) => {
        if (typeof c !== 'object' || c === null || !('front' in c) || !('back' in c)) {
          throw new Error(`Card ${i + 1}: "front" and "back" are required`);
        }
        return {
          front: String((c as { front: unknown }).front),
          back: String((c as { back: unknown }).back),
        };
      });
      onImport(name, validated, topicId || undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          ← Back
        </button>
        <h2 style={styles.heading}>Import Deck</h2>
        <div style={{ width: 70 }} />
      </div>

      <div style={styles.content}>
        <p style={styles.hint}>
          Paste JSON below. Ask an AI to generate decks in this format for you:
        </p>
        <pre style={styles.example}>{EXAMPLE}</pre>

        {topics.length > 0 && (
          <div>
            <label style={styles.label}>Add to topic (optional)</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              style={styles.select}
            >
              <option value="">— No topic —</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <textarea
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            setError('');
          }}
          placeholder='{ "name": "...", "cards": [...] }'
          rows={10}
          style={{ ...styles.textarea, borderColor: error ? C.again : C.border }}
        />

        {error && <p style={styles.error}>⚠ {error}</p>}

        <button
          onClick={handleImport}
          disabled={!json.trim()}
          style={{
            ...styles.importBtn,
            opacity: json.trim() ? 1 : 0.4,
            cursor: json.trim() ? 'pointer' : 'default',
          }}
        >
          Import
        </button>
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
    padding: '24px 16px 40px',
    maxWidth: 520,
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
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
    color: '#0d0d14',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    fontSize: 15,
    fontWeight: 600,
    width: '100%',
    boxShadow: '0 4px 20px rgba(232,160,48,0.3)',
  },
};
