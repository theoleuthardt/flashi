import { useState, useEffect } from 'react';
import type { AppState, Screen, Card, Deck, Topic, FlashiData, Rating, Quiz, QuizQuestion, QuizAnswer } from './types';
import { getAuthStatus, verifyToken, setToken, clearToken, decodeToken, loadUserData, saveUserData } from './utils/api';
import { loadData, saveData } from './utils/storage';
import { getDueCards, newCard, applyRating, todayStr } from './utils/srs';
import { C } from './theme';
import {
  AdminScreen,
  DoneScreen,
  HomeScreen,
  ImportScreen,
  LoginScreen,
  ProgressionScreen,
  QuizImportScreen,
  QuizResultsScreen,
  QuizScreen,
  SetupScreen,
  SettingsScreen,
  StudyScreen,
  TopicScreen,
} from './screens';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [screen, setScreen] = useState<Screen>('home');
  const [data, setData] = useState<FlashiData>({ topics: [], decks: [], cards: {} });
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  // fault tracking: topicId → fault card IDs accumulated in the topic session
  const [topicFaults, setTopicFaults] = useState<Record<string, Set<string>>>({});
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [mixQuiz, setMixQuiz] = useState<Quiz | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('flashi-theme') as 'dark' | 'light') ?? 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    localStorage.setItem('flashi-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  useEffect(() => {
    void checkAuth();
  }, []);

  async function loadAndSetData() {
    try {
      const serverData = await loadUserData();
      const localData = loadData();
      // One-time migration: only when server is completely empty but local has data
      const serverEmpty =
        serverData.decks.length === 0 &&
        serverData.topics.length === 0 &&
        (serverData.quizzes ?? []).length === 0;
      const localHasData =
        localData.decks.length > 0 ||
        localData.topics.length > 0 ||
        (localData.quizzes ?? []).length > 0;
      if (serverEmpty && localHasData) {
        setData(localData);
        void saveUserData(localData);
      } else {
        setData(serverData);
      }
    } catch {
      setData(loadData());
    }
  }

  async function checkAuth() {
    const token = localStorage.getItem('flashi-token');
    if (token) {
      const valid = await verifyToken();
      if (valid) {
        await loadAndSetData();
        setAppState('app');
        return;
      }
      clearToken();
    }
    try {
      const { setup } = await getAuthStatus();
      setAppState(setup ? 'setup' : 'login');
    } catch {
      setAppState('login');
    }
  }

  function mutate(next: FlashiData) {
    setData(next);
    saveData(next);
    void saveUserData(next);
  }

  async function handleAuth(token: string) {
    setToken(token);
    await loadAndSetData();
    setAppState('app');
  }

  function handleLogout() {
    clearToken();
    setData({ topics: [], decks: [], cards: {} });
    setAppState('login');
    setScreen('home');
  }

  function dueCount(deckId: string): number {
    const t = todayStr();
    return (data.cards[deckId] ?? []).filter((c) => c.due <= t).length;
  }

  function startStudy(deckId: string) {
    const due = getDueCards(data.cards[deckId] ?? []);
    if (!due.length) return;
    setStudyDeckId(deckId);
    setQueue(due);
    setFlipped(false);
    setSessionCount(0);
    setScreen('study');
  }

  function startMultiDeckStudy(cards: Card[]) {
    if (!cards.length) return;
    setStudyDeckId('__multi__');
    setQueue(cards);
    setFlipped(false);
    setSessionCount(0);
    setScreen('study');
  }

  function startDailyMix(topicId: string) {
    const topicDecks = data.decks.filter((d) => d.topicId === topicId);
    const allCards: Card[] = topicDecks.flatMap((d) => data.cards[d.id] ?? []);
    if (!allCards.length) return;
    const shuffled = [...allCards].sort(() => Math.random() - 0.5).slice(0, 20);
    startMultiDeckStudy(shuffled);
  }

  function startDailyQuizMix(topicId: string) {
    const topicQuizzes = (data.quizzes ?? []).filter((q) => q.topicId === topicId);
    if (!topicQuizzes.length) return;
    const allQuestions = topicQuizzes.flatMap((q) => q.questions);
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 20);
    if (!shuffled.length) return;
    const quiz: Quiz = {
      id: '__quiz-mix__',
      name: 'Daily Quiz Mix',
      created: todayStr(),
      topicId,
      questions: shuffled,
    };
    setMixQuiz(quiz);
    setActiveQuizId(quiz.id);
    setQuizAnswers([]);
    setScreen('quiz');
  }

  function repeatTopicFaults(topicId: string) {
    const faultIds = topicFaults[topicId];
    if (!faultIds?.size) return;
    const faultCards: Card[] = [];
    for (const cards of Object.values(data.cards)) {
      for (const c of cards) {
        if (faultIds.has(c.id)) faultCards.push(c);
      }
    }
    if (!faultCards.length) return;
    setTopicFaults((prev) => ({ ...prev, [topicId]: new Set() }));
    startMultiDeckStudy(faultCards);
  }

  function skip() {
    if (!queue.length) return;
    setQueue([...queue.slice(1), queue[0]]);
    setFlipped(false);
  }

  function goBack() {
    if (queue.length < 2) return;
    setQueue([queue[queue.length - 1], ...queue.slice(0, -1)]);
    setFlipped(false);
  }

  function rate(r: Rating) {
    if (!studyDeckId || !queue.length) return;
    const card = queue[0];
    const updated = applyRating(card, r);

    if (r === 0 && activeTopicId) {
      setTopicFaults((prev) => {
        const existing = prev[activeTopicId] ?? new Set<string>();
        return { ...prev, [activeTopicId]: new Set([...existing, card.id]) };
      });
    }

    let newData = data;
    if (studyDeckId === '__multi__') {
      for (const [deckId, cards] of Object.entries(data.cards)) {
        if (cards.some((c) => c.id === card.id)) {
          const dc = cards.map((c) => (c.id === card.id ? updated : c));
          newData = { ...data, cards: { ...data.cards, [deckId]: dc } };
          break;
        }
      }
    } else {
      const dc = (data.cards[studyDeckId] ?? []).map((c) => (c.id === card.id ? updated : c));
      newData = { ...data, cards: { ...data.cards, [studyDeckId]: dc } };
    }
    mutate(newData);

    setSessionCount((s) => s + 1);
    let newQ = queue.slice(1);
    if (r === 0) newQ = [...newQ, updated];
    if (newQ.length === 0) {
      setScreen('done');
    } else {
      setQueue(newQ);
      setFlipped(false);
    }
  }

  function importDecks(drafts: Array<{ name: string; cards: Array<{ front: string; back: string }>; topicId?: string }>) {
    let next = data;
    for (const { name, cards, topicId } of drafts) {
      const deckId = Math.random().toString(36).slice(2);
      const deck: Deck = { id: deckId, name, created: todayStr(), topicId };
      next = {
        ...next,
        decks: [...next.decks, deck],
        cards: { ...next.cards, [deckId]: cards.map((c) => newCard(c.front, c.back)) },
      };
    }
    mutate(next);
  }

  function deleteDeck(deckId: string) {
    const nc = { ...data.cards };
    delete nc[deckId];
    mutate({ ...data, decks: data.decks.filter((d) => d.id !== deckId), cards: nc });
  }

  function assignDeckToTopic(deckId: string, topicId: string) {
    mutate({
      ...data,
      decks: data.decks.map((d) => (d.id === deckId ? { ...d, topicId } : d)),
    });
  }

  function createTopic(name: string) {
    const topic: Topic = { id: Math.random().toString(36).slice(2), name, created: todayStr() };
    mutate({ ...data, topics: [...data.topics, topic] });
  }

  function importQuizzes(drafts: Array<{ name: string; questions: QuizQuestion[]; topicId?: string }>) {
    const newQuizzes: Quiz[] = drafts.map(({ name, questions, topicId }) => ({
      id: Math.random().toString(36).slice(2),
      name,
      created: todayStr(),
      topicId,
      questions,
    }));
    mutate({ ...data, quizzes: [...(data.quizzes ?? []), ...newQuizzes] });
  }

  function deleteQuiz(quizId: string) {
    mutate({ ...data, quizzes: (data.quizzes ?? []).filter((q) => q.id !== quizId) });
  }

  function deleteTopic(topicId: string) {
    const nc = { ...data.cards };
    const decksToRemove = data.decks.filter((d) => d.topicId === topicId).map((d) => d.id);
    decksToRemove.forEach((id) => delete nc[id]);
    mutate({
      ...data,
      topics: data.topics.filter((t) => t.id !== topicId),
      decks: data.decks.filter((d) => d.topicId !== topicId),
      cards: nc,
    });
  }

  const themeToggle = (
    <button className="theme-toggle" onClick={toggleTheme} title="Toggle dark/light mode">
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );

  if (appState === 'loading') {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.bg,
          color: C.muted,
        }}
      >
        Loading…
      </div>
    );
  }
  if (appState === 'setup')
    return (
      <>
        <SetupScreen onSetup={handleAuth} />
        {themeToggle}
      </>
    );
  if (appState === 'login')
    return (
      <>
        <LoginScreen onLogin={handleAuth} />
        {themeToggle}
      </>
    );

  const me = decodeToken();

  if (screen === 'study' && studyDeckId) {
    const deck = studyDeckId === '__multi__'
      ? { id: '__multi__', name: activeTopicId ? (data.topics.find(t => t.id === activeTopicId)?.name ?? 'Mix') : 'Study', created: '', topicId: activeTopicId ?? undefined }
      : data.decks.find((d) => d.id === studyDeckId);
    if (!deck) {
      setScreen('home');
      return null;
    }
    return (
      <>
        <StudyScreen
          deck={deck}
          queue={queue}
          flipped={flipped}
          setFlipped={setFlipped}
          sessionCount={sessionCount}
          onRate={rate}
          onSkip={skip}
          onGoBack={goBack}
          onBack={() => setScreen(activeTopicId ? 'topic' : 'home')}
        />
        {themeToggle}
      </>
    );
  }

  if (screen === 'done')
    return (
      <>
        <DoneScreen
          sessionCount={sessionCount}
          onBack={() => setScreen(activeTopicId ? 'topic' : 'home')}
        />
        {themeToggle}
      </>
    );

  if (screen === 'import')
    return (
      <>
        <ImportScreen
          topics={data.topics}
          initialTopicId={activeTopicId ?? undefined}
          onImport={(decks) => {
            importDecks(decks);
            setScreen(activeTopicId ? 'topic' : 'home');
          }}
          onBack={() => setScreen(activeTopicId ? 'topic' : 'home')}
        />
        {themeToggle}
      </>
    );

  if (screen === 'admin') {
    if (!me?.isAdmin) {
      setScreen('home');
      return null;
    }
    return (
      <>
        <AdminScreen currentUsername={me.username} onBack={() => setScreen('home')} />
        {themeToggle}
      </>
    );
  }

  if (screen === 'settings')
    return (
      <>
        <SettingsScreen onBack={() => setScreen('home')} />
        {themeToggle}
      </>
    );

  if (screen === 'progression')
    return (
      <>
        <ProgressionScreen data={data} onBack={() => setScreen('home')} />
        {themeToggle}
      </>
    );

  if (screen === 'quiz-import')
    return (
      <>
        <QuizImportScreen
          topics={data.topics}
          initialTopicId={activeTopicId ?? undefined}
          onImport={(quizzes) => {
            importQuizzes(quizzes);
            setScreen(activeTopicId ? 'topic' : 'home');
          }}
          onBack={() => setScreen(activeTopicId ? 'topic' : 'home')}
        />
        {themeToggle}
      </>
    );

  if (screen === 'quiz' && activeQuizId) {
    const quiz = mixQuiz ?? (data.quizzes ?? []).find((q) => q.id === activeQuizId);
    if (!quiz) { setScreen('topic'); return null; }
    return (
      <>
        <QuizScreen
          quiz={quiz}
          onDone={(answers) => { setQuizAnswers(answers); setScreen('quiz-results'); }}
          onBack={() => { setMixQuiz(null); setScreen(activeTopicId ? 'topic' : 'home'); }}
        />
        {themeToggle}
      </>
    );
  }

  if (screen === 'quiz-results' && activeQuizId) {
    const quiz = mixQuiz ?? (data.quizzes ?? []).find((q) => q.id === activeQuizId);
    if (!quiz) { setScreen('topic'); return null; }
    return (
      <>
        <QuizResultsScreen
          quiz={quiz}
          answers={quizAnswers}
          onBack={() => { setMixQuiz(null); setScreen(activeTopicId ? 'topic' : 'home'); }}
          onRetry={() => { setQuizAnswers([]); setScreen('quiz'); }}
        />
        {themeToggle}
      </>
    );
  }

  if (screen === 'topic' && activeTopicId) {
    const topic = data.topics.find((t) => t.id === activeTopicId);
    if (!topic) {
      setScreen('home');
      return null;
    }
    const faultCount = topicFaults[activeTopicId]?.size ?? 0;
    return (
      <>
        <TopicScreen
          topic={topic}
          data={data}
          dueCount={dueCount}
          onStudy={(deckId) => startStudy(deckId)}
          onDelete={deleteDeck}
          onDeleteTopic={(topicId) => {
            deleteTopic(topicId);
            setTopicFaults((prev) => { const n = { ...prev }; delete n[topicId]; return n; });
            setActiveTopicId(null);
            setScreen('home');
          }}
          onCreateDeck={() => setScreen('import')}
          onCreateQuiz={() => setScreen('quiz-import')}
          onStartQuiz={(quizId) => { setActiveQuizId(quizId); setQuizAnswers([]); setScreen('quiz'); }}
          onDeleteQuiz={deleteQuiz}
          onDailyMix={() => startDailyMix(activeTopicId)}
          onDailyQuizMix={() => startDailyQuizMix(activeTopicId)}
          faultCount={faultCount}
          onRepeatFaults={() => repeatTopicFaults(activeTopicId)}
          onBack={() => setScreen('home')}
        />
        {themeToggle}
      </>
    );
  }

  return (
    <>
      <HomeScreen
        data={data}
        dueCount={dueCount}
        onStudy={startStudy}
        onImport={() => setScreen('import')}
        onDelete={deleteDeck}
        onOpenTopic={(topicId) => {
          setActiveTopicId(topicId);
          setScreen('topic');
        }}
        onCreateTopic={createTopic}
        onAssignTopic={data.topics.length > 0 ? assignDeckToTopic : undefined}
        onAdmin={me?.isAdmin ? () => setScreen('admin') : undefined}
        onSettings={() => setScreen('settings')}
        onProgression={() => setScreen('progression')}
        onLogout={handleLogout}
      />
      {themeToggle}
    </>
  );
}
