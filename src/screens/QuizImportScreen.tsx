import { useState } from 'react';
import type { Topic, QuizOption } from '../types';
import { C } from '../theme';

interface QuizDraft {
  name: string;
  questions: Array<{ question: string; options: QuizOption[]; correct: number | number[]; image?: string }>;
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
        ["Kyiv",   "Wrong – Kyiv is the capital of Ukraine."],
        ["Moscow", "Correct! Moscow has been Russia's capital since 1918."],
        ["Minsk",  "Wrong – Minsk is the capital of Belarus."],
        ["Warsaw", "Wrong – Warsaw is the capital of Poland."]
      ],
      "correct": 1
    },
    {
      "question": "What does 'Привет' mean?",
      "options": ["Goodbye", "Thank you", "Hello", "Please"],
      "correct": 2
    },
    {
      "question": "Which of these are Slavic languages?",
      "options": ["Russian", "French", "Polish", "Italian"],
      "correct": [0, 2]
    },
    {
      "question": "Identify this landmark",
      "image": "https://thumbs.dreamstime.com/b/above-st-basil-cathedral-red-square-kremlin-panorama-moscow-russia-above-impressive-st-basil-cathedral-red-square-kremlin-266629583.jpg",
      "options": ["Kremlin", "Big Ben", "Eiffel Tower", "Colosseum"],
      "correct": 0
    }
  ]
}`;

interface ManualQuestion {
  question: string;
  image: string;
  options: string[];
  correctIndices: number[];
}

function emptyQuestion(): ManualQuestion {
  return { question: '', image: '', options: ['', '', '', ''], correctIndices: [] };
}

export default function QuizImportScreen({ topics, initialTopicId, onImport, onBack }: Props) {
  const [mode, setMode] = useState<'json' | 'manual'>('json');
  const [topicId, setTopicId] = useState(initialTopicId ?? '');

  // JSON mode
  const [json, setJson] = useState('');
  const [error, setError] = useState('');

  // Manual mode
  const [quizName, setQuizName] = useState('');
  const [questions, setQuestions] = useState<ManualQuestion[]>([emptyQuestion()]);

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
        !Array.isArray((q as { options: unknown }).options)
      ) {
        throw new Error(`${label}, question ${i + 1}: needs "question" (string), "options" (array), "correct" (number or array)`);
      }
      const qObj = q as { question: string; options: unknown[]; correct: unknown; image?: unknown };
      if (qObj.options.length < 2) throw new Error(`${label}, question ${i + 1}: at least 2 options required`);

      let correct: number | number[];
      if (Array.isArray(qObj.correct)) {
        correct = qObj.correct.map((c, ci) => {
          if (typeof c !== 'number') throw new Error(`${label}, question ${i + 1}: correct[${ci}] must be a number`);
          if (c < 0 || c >= qObj.options.length) throw new Error(`${label}, question ${i + 1}: correct[${ci}] out of range`);
          return c;
        });
      } else if (typeof qObj.correct === 'number') {
        if (qObj.correct < 0 || qObj.correct >= qObj.options.length) {
          throw new Error(`${label}, question ${i + 1}: "correct" must be a valid index (0–${qObj.options.length - 1})`);
        }
        correct = qObj.correct;
      } else {
        throw new Error(`${label}, question ${i + 1}: "correct" must be a number or array of numbers`);
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
      const image = typeof qObj.image === 'string' ? qObj.image : undefined;
      return { question: qObj.question, options, correct, image };
    });
    return { name, questions: validated };
  }

  function handleJsonImport() {
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

  function handleManualImport() {
    const name = quizName.trim();
    if (!name) return;
    const validQuestions = questions.filter((q) => q.question.trim() && q.options.some((o) => o.trim()) && q.correctIndices.length > 0);
    if (validQuestions.length === 0) return;

    const mapped = validQuestions.map((q) => {
      const validOptions = q.options.filter((o) => o.trim());
      const correct = q.correctIndices.length === 1 ? q.correctIndices[0] : q.correctIndices;
      return {
        question: q.question.trim(),
        options: validOptions as QuizOption[],
        correct,
        image: q.image.trim() || undefined,
      };
    });
    onImport([{ name, questions: mapped, topicId: topicId || undefined }]);
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function updateQuestion(idx: number, field: keyof ManualQuestion, value: unknown) {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const newOpts = [...q.options];
      newOpts[oIdx] = value;
      return { ...q, options: newOpts };
    }));
  }

  function addOption(qIdx: number) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.options.length >= 6) return q;
      return { ...q, options: [...q.options, ''] };
    }));
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.options.length <= 2) return q;
      const newOpts = q.options.filter((_, oi) => oi !== oIdx);
      const newCorrect = q.correctIndices
        .filter((c) => c !== oIdx)
        .map((c) => (c > oIdx ? c - 1 : c));
      return { ...q, options: newOpts, correctIndices: newCorrect };
    }));
  }

  function toggleCorrect(qIdx: number, oIdx: number) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const has = q.correctIndices.includes(oIdx);
      return {
        ...q,
        correctIndices: has
          ? q.correctIndices.filter((c) => c !== oIdx)
          : [...q.correctIndices, oIdx],
      };
    }));
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function quizCount() {
    try {
      const parsed = JSON.parse(json) as unknown;
      if (Array.isArray(parsed)) return parsed.length;
    } catch { /* ignore */ }
    return 1;
  }

  const manualValid = quizName.trim() && questions.some(
    (q) => q.question.trim() && q.options.some((o) => o.trim()) && q.correctIndices.length > 0
  );
  const validQCount = questions.filter((q) => q.question.trim() && q.options.some((o) => o.trim()) && q.correctIndices.length > 0).length;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <h2 style={styles.heading}>Create Quiz</h2>
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
              Paste a single quiz or an array of quizzes. Use <code style={styles.code}>correct: [0, 2]</code> for multiple correct answers. Add <code style={styles.code}>"image": "url"</code> for picture questions.
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

            <textarea
              value={json}
              onChange={(e) => { setJson(e.target.value); setError(''); }}
              placeholder='{ "name": "...", "questions": [...] }  or  [{ ... }, { ... }]'
              rows={10}
              style={{ ...styles.textarea, borderColor: error ? C.again : C.border }}
            />

            {error && <p style={styles.error}>⚠ {error}</p>}

            <button
              onClick={handleJsonImport}
              disabled={!json.trim()}
              style={{ ...styles.importBtn, opacity: json.trim() ? 1 : 0.4, cursor: json.trim() ? 'pointer' : 'default' }}
            >
              {json.trim() && quizCount() > 1 ? `Import ${quizCount()} Quizzes` : 'Create Quiz'}
            </button>
          </>
        )}

        {mode === 'manual' && (
          <>
            <div>
              <label style={styles.label}>Quiz name</label>
              <input
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                placeholder="e.g. Russian Vocabulary Quiz"
                style={styles.nameInput}
                autoFocus
              />
            </div>

            <div style={styles.questionsSection}>
              {questions.map((q, qIdx) => (
                <div key={qIdx} style={styles.questionCard}>
                  <div style={styles.questionCardHeader}>
                    <span style={styles.questionNum}>Question {qIdx + 1}</span>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(qIdx)} style={styles.removeBtn} title="Remove question">
                        ×
                      </button>
                    )}
                  </div>

                  <textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                    placeholder="Enter your question…"
                    rows={2}
                    style={styles.questionTextarea}
                  />

                  <input
                    value={q.image}
                    onChange={(e) => updateQuestion(qIdx, 'image', e.target.value)}
                    placeholder="Image URL (optional)"
                    style={styles.imageInput}
                  />

                  <p style={styles.optionsLabel}>
                    Options — <span style={{ color: C.accent }}>tap ✓ to mark correct</span>
                    {q.correctIndices.length > 1 && <span style={{ color: C.good }}> (multiple correct)</span>}
                  </p>

                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correctIndices.includes(oIdx);
                    return (
                      <div key={oIdx} style={styles.optionRow}>
                        <button
                          onClick={() => toggleCorrect(qIdx, oIdx)}
                          style={{
                            ...styles.correctToggle,
                            background: isCorrect ? C.good : C.surface2,
                            border: `1px solid ${isCorrect ? C.good : C.border}`,
                            color: isCorrect ? '#fff' : C.muted,
                          }}
                          title={isCorrect ? 'Marked as correct' : 'Mark as correct'}
                        >
                          ✓
                        </button>
                        <span style={styles.optionLetter}>{String.fromCharCode(65 + oIdx)}</span>
                        <input
                          value={opt}
                          onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          style={styles.optionInput}
                        />
                        {q.options.length > 2 && (
                          <button onClick={() => removeOption(qIdx, oIdx)} style={styles.removeOptBtn} title="Remove option">
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {q.options.length < 6 && (
                    <button onClick={() => addOption(qIdx)} style={styles.addOptionBtn}>
                      + Add option
                    </button>
                  )}
                </div>
              ))}

              <button onClick={addQuestion} style={styles.addQuestionBtn}>
                + Add question
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
              Create Quiz ({validQCount} question{validQCount !== 1 ? 's' : ''})
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
    padding: '24px 16px 60px',
    maxWidth: 560,
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
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
  questionsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  questionCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  questionCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionNum: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  removeBtn: {
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
    lineHeight: 1,
  } as React.CSSProperties,
  questionTextarea: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 14,
    padding: '10px 12px',
    resize: 'vertical',
    lineHeight: 1.5,
    width: '100%',
    fontFamily: "'DM Sans', sans-serif",
  },
  imageInput: {
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    color: C.text,
    fontSize: 12,
    padding: '8px 12px',
    width: '100%',
  },
  optionsLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
  },
  optionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  correctToggle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s, border-color 0.15s',
  } as React.CSSProperties,
  optionLetter: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 700,
    width: 14,
    textAlign: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  optionInput: {
    flex: 1,
    background: C.surface2,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 13,
    padding: '8px 10px',
    minWidth: 0,
  },
  removeOptBtn: {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 16,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    lineHeight: 1,
  } as React.CSSProperties,
  addOptionBtn: {
    background: 'none',
    border: `1px dashed ${C.border}`,
    borderRadius: 10,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 12,
    padding: '8px',
    textAlign: 'center',
    width: '100%',
  },
  addQuestionBtn: {
    background: 'none',
    border: `1px dashed ${C.border}`,
    borderRadius: 14,
    color: C.muted,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    padding: '14px',
    textAlign: 'center',
    width: '100%',
  },
};
