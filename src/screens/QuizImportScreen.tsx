import { useState } from 'react';
import type { Topic, QuizOption } from '../types';
import { C } from '../theme';

interface QuizDraft {
  name: string;
  questions: Array<{ question: string; options: QuizOption[]; correct: number }>;
  topicId?: string;
}

interface Props {
  topics: Topic[];
  initialTopicId?: string;
  onImport: (quizzes: QuizDraft[]) => void;
  onBack: () => void;
}

const EXAMPLE = `{
  "name": "Russian Capitals Quiz",
  "questions": [
    {
      "question": "What is the capital of Russia?",
      "options": [
        ["Kyiv",   "Falsch – Kyiv ist die Hauptstadt der Ukraine."],
        ["Moscow", "Richtig! Moskau ist seit 1918 Russlands Hauptstadt."],
        ["Minsk",  "Falsch – Minsk ist die Hauptstadt von Belarus."],
        ["Warsaw", "Falsch – Warschau ist die Hauptstadt Polens."]
      ],
      "correct": 1
    },
    {
      "question": "What does 'Привет' mean?",
      "options": ["Goodbye", "Thank you", "Hello", "Please"],
      "correct": 2
    }
  ]
}`;

export default function QuizImportScreen({ topics, initialTopicId, onImport, onBack }: Props) {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const [topicId, setTopicId] = useState(initialTopicId ?? '');

  function parseQuiz(obj: unknown, label: string) {
    if (
      typeof obj !== 'object' || obj === null ||
      !('name' in obj) || !('questions' in obj) ||
      typeof (obj as { name: unknown }).name !== 'string' ||
      !Array.isArray((obj as { questions: unknown }).questions)
    ) {
      throw new Error(`${label}: Expected { "name": "...", "questions": [...] }`);
    }
    const { name, questions } = obj as { name: string; questions: unknown[] };
    const validated = questions.map((q, i) => {
      if (
        typeof q !== 'object' || q === null ||
        !('question' in q) || !('options' in q) || !('correct' in q) ||
        typeof (q as { question: unknown }).question !== 'string' ||
        !Array.isArray((q as { options: unknown }).options) ||
        typeof (q as { correct: unknown }).correct !== 'number'
      ) {
        throw new Error(`${label}, question ${i + 1}: needs "question" (string), "options" (array), "correct" (number)`);
      }
      const qObj = q as { question: string; options: unknown[]; correct: number };
      if (qObj.options.length < 2) throw new Error(`${label}, question ${i + 1}: at least 2 options required`);
      if (qObj.correct < 0 || qObj.correct >= qObj.options.length) {
        throw new Error(`${label}, question ${i + 1}: "correct" must be a valid index (0–${qObj.options.length - 1})`);
      }
      const options: QuizOption[] = qObj.options.map((o, oi) => {
        if (Array.isArray(o)) {
          if (o.length < 1) throw new Error(`${label}, question ${i + 1}, option ${oi + 1}: tuple must have at least one element`);
          return o.length >= 2
            ? [String(o[0]), String(o[1])] as [string, string]
            : String(o[0]);
        }
        return String(o);
      });
      return { question: qObj.question, options, correct: qObj.correct };
    });
    return { name, questions: validated };
  }

  function handleImport() {
    setError('');
    try {
      const parsed = JSON.parse(json) as unknown;
      const tid = topicId || undefined;
      if (Array.isArray(parsed)) {
        const quizzes = parsed.map((item, i) => {
          const { name, questions } = parseQuiz(item, `Quiz ${i + 1}`);
          return { name, questions, topicId: tid };
        });
        onImport(quizzes);
      } else {
        const { name, questions } = parseQuiz(parsed, 'Quiz');
        onImport([{ name, questions, topicId: tid }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  function quizCount() {
    try {
      const parsed = JSON.parse(json) as unknown;
      if (Array.isArray(parsed)) return parsed.length;
    } catch { /* ignore */ }
    return 1;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <h2 style={styles.heading}>Create Quiz</h2>
        <div style={{ width: 70 }} />
      </div>

      <div style={styles.content}>
        <p style={styles.hint}>
          Paste a single quiz or an array of quizzes. Each option can be a plain string <code style={styles.code}>"text"</code> or a pair <code style={styles.code}>["text", "explanation"]</code>.
        </p>
        <div style={{ position: 'relative' }}>
          <pre style={styles.example}>{EXAMPLE}</pre>
          <button
            onClick={() => { setJson(EXAMPLE); setError(''); }}
            style={styles.useExampleBtn}
          >
            Use example
          </button>
        </div>

        {topics.length > 0 && (
          <div>
            <label style={styles.label}>Add to topic (optional)</label>
            <select value={topicId} onChange={(e) => setTopicId(e.target.value)} style={styles.select}>
              <option value="">— No topic —</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        <textarea
          value={json}
          onChange={(e) => { setJson(e.target.value); setError(''); }}
          placeholder='{ "name": "...", "questions": [...] }  or  [{ ... }, { ... }]'
          rows={10}
          style={{ ...styles.textarea, borderColor: error ? C.again : C.border }}
        />

        {error && <p style={styles.error}>⚠ {error}</p>}

        <button
          onClick={handleImport}
          disabled={!json.trim()}
          style={{ ...styles.importBtn, opacity: json.trim() ? 1 : 0.4, cursor: json.trim() ? 'pointer' : 'default' }}
        >
          {json.trim() && quizCount() > 1 ? `Import ${quizCount()} Quizzes` : 'Create Quiz'}
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
  code: { fontFamily: 'monospace', fontSize: 12, color: C.accent },
  label: { color: C.muted, fontSize: 12, letterSpacing: '0.04em', display: 'block', marginBottom: 6 },
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
  useExampleBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.mutedLight,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
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
  },
};
