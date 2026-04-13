import { useState, useEffect } from 'react';
import type { AppState, Screen, Card, Deck, Topic, FlashiData, Rating } from './types';
import { getAuthStatus, verifyToken, setToken, clearToken, decodeToken } from './utils/api';
import { loadData, saveData } from './utils/storage';
import { getDueCards, newCard, applyRating, todayStr } from './utils/srs';
import { C } from './theme';
import {
  AdminScreen,
  DoneScreen,
  HomeScreen,
  ImportScreen,
  LoginScreen,
  SetupScreen,
  StudyScreen,
  TopicScreen,
} from './screens';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [screen, setScreen] = useState<Screen>('home');
  const [data, setData] = useState<FlashiData>(loadData);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
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

  async function checkAuth() {
    const token = localStorage.getItem('flashi-token');
    if (token) {
      const valid = await verifyToken();
      if (valid) {
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
  }

  function handleAuth(token: string) {
    setToken(token);
    setAppState('app');
  }

  function handleLogout() {
    clearToken();
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
    const dc = (data.cards[studyDeckId] ?? []).map((c) => (c.id === card.id ? updated : c));
    mutate({ ...data, cards: { ...data.cards, [studyDeckId]: dc } });
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

  function importDeck(
    name: string,
    cards: Array<{ front: string; back: string }>,
    topicId?: string
  ) {
    const deckId = Math.random().toString(36).slice(2);
    const deck: Deck = { id: deckId, name, created: todayStr(), topicId };
    mutate({
      ...data,
      decks: [...data.decks, deck],
      cards: { ...data.cards, [deckId]: cards.map((c) => newCard(c.front, c.back)) },
    });
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
    const deck = data.decks.find((d) => d.id === studyDeckId);
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
          onImport={(name, cards, topicId) => {
            importDeck(name, cards, topicId);
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

  if (screen === 'topic' && activeTopicId) {
    const topic = data.topics.find((t) => t.id === activeTopicId);
    if (!topic) {
      setScreen('home');
      return null;
    }
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
            setActiveTopicId(null);
            setScreen('home');
          }}
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
        onLogout={handleLogout}
      />
      {themeToggle}
    </>
  );
}
