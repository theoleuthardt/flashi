# Flashi

A self-hosted learning app. Create flashcard decks and quizzes — organised by topics, studied with spaced repetition. Built to learn Russian, works for anything.

## Features

### Flashcards
- **Spaced repetition** — SM-2 algorithm with Again / Hard / Good / Easy ratings
- **3D card flip** — smooth CSS perspective animation; tap to flip, tap again to flip back
- **Scrollable card content** — long text scrolls inside the card without overflowing
- **Skip & navigate** — skip forward or go back to the previous card with slide animations
- **Read-aloud** — tap the speaker icon on any card to hear it read with the browser's Speech Synthesis API

### Quizzes
- **Multiple-choice** — import quizzes with 4 options per question; each option can carry an explanation revealed after answering (like NotebookLM)
- **Multi-correct answers** — use `"correct": [0, 2]` to require selecting multiple right answers; single `"correct": 0` keeps single-select mode
- **Image questions** — add `"image": "url"` to any question to render a photo above it
- **Question navigation** — left/right arrows let you move freely between questions; answers are saved per-question so you can go back and change them before finishing
- **Review faults** — the results screen shows every wrong answer with a "Review →" button that jumps back into the quiz at that exact question with all previous answers pre-loaded
- **Quiz progress** — unfinished quizzes are saved to localStorage and resume from the right question; a restart FAB (↺) lets you start over
- **Confetti** — a three-volley canvas confetti cannon fires on a 100% score (no external dependencies)
- **Score history** — each quiz result is stored; the topic screen shows "X% last time / Due / In progress / Not started" per quiz

### Organisation
- **Topics** — organise decks and quizzes into topic folders with a grid layout
- **Drag-and-drop sorting** — reorder topics on the home grid, and decks/quizzes inside a topic, by dragging; drop-line / ghost-slot indicators show where items will land
- **Search FAB** — a morphing circle-to-pill search button on both the home screen and topic screen for filtering topics, decks, and quizzes
- **Daily Mix** — one button in any topic starts a randomised study session of up to 20 cards from all the topic's decks
- **Daily Quiz Mix** — one button in any topic assembles a mixed quiz of up to 20 random questions across all quizzes in the topic
- **Fault repeat** — cards marked "Again" are tracked per topic; a **Repeat faults** button appears after each study session

### App
- **Dashboard** — live stats (decks, cards, quizzes, due today) in a sidebar on desktop and a top bar on mobile; progress bars on every deck card
- **Progression** — overview screen with overall % learned and per-topic stacked bars (learned / due / new)
- **Manual import** — create decks and quizzes via a form instead of JSON; both import screens have a JSON tab and a manual form tab side-by-side
- **Discord reminders** — configure a webhook URL and a daily time in Settings to get a message when cards are due
- **Multi-user** — admin can create and remove additional user accounts; per-user data stored on the server volume
- **Auth** — bcrypt password hashing, JWT sessions (30 days); users can change their own password in Settings
- **Dark / light theme** — toggle in the sidebar or top bar; preference saved to localStorage
- **PWA** — installable on iPhone, Android, and desktop via the browser

---

## Local Development

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173` — Backend: `http://localhost:3001`  
Vite proxies all `/api` requests to the backend automatically.

```bash
# Format code
npm run format
```

---

## Deployment

A `stable` image is published to the GitHub Container Registry automatically on every merge to `main`.

| Tag | Source | Recommended for |
|---|---|---|
| `stable` | `main` branch | self-hosting |
| — | `dev` branch | not published — build from source |

### 1. Download a compose file

| File | Runtime | Image |
|---|---|---|
| `podman-compose.yml` | Podman | pre-built `stable` |
| `podman-compose.build.yml` | Podman | build from source |
| `docker-compose.yml` | Docker | pre-built `stable` |
| `docker-compose.build.yml` | Docker | build from source |

```bash
# Example — Podman with pre-built image
curl -O https://raw.githubusercontent.com/theoleuthardt/flashi/main/podman-compose.yml
```

### 2. Set a secure JWT secret

```bash
openssl rand -hex 32
```

Paste the output into the compose file next to `JWT_SECRET=`.

### 3. Start

```bash
# Podman — pre-built stable image
podman-compose -f podman-compose.yml up -d

# Podman — build from source
git clone https://github.com/theoleuthardt/flashi.git && cd flashi
podman-compose -f podman-compose.build.yml up -d --build

# Docker — pre-built stable image
docker compose up -d

# Docker — build from source
git clone https://github.com/theoleuthardt/flashi.git && cd flashi
docker compose -f docker-compose.build.yml up -d --build
```

The app runs on `http://your-server:3001`.

### 4. First-time setup

Open the app in a browser — you will be prompted to create an admin account (username + password).

---

## Importing Decks

Paste JSON in the app under **+ Create deck**, or use the **Manual** tab to fill in a form directly.

Ask an AI to generate flashcard decks in the following JSON format:

```json
{ "name": "Lesson 1 – Cyrillic Alphabet", "cards": [
  { "front": "А а", "back": "A (as in father)" },
  { "front": "Б б", "back": "B (as in book)" }
]}
```

To import multiple decks at once, wrap them in a JSON array:

```json
[
  { "name": "Deck 1", "cards": [{ "front": "...", "back": "..." }] },
  { "name": "Deck 2", "cards": [{ "front": "...", "back": "..." }] }
]
```

---

## Importing Quizzes

Paste JSON in the app under **+ Create quiz**, or use the **Manual** tab to build questions one by one.

Each answer option can be a plain string or a `[text, explanation]` tuple — the explanation is revealed inline after answering. Use `"correct": [0, 2]` for questions with multiple right answers. Add `"image": "url"` for picture questions.

```json
{
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
}
```

To import multiple quizzes at once, wrap them in a JSON array.

---

## Discord Daily Reminders

Flashi can send you a Discord message every day when you have cards due.

### Setup

1. In Discord, open **Server Settings → Integrations → Webhooks** and create a new webhook. Copy the webhook URL.
2. In the Flashi app, tap **⚙ Settings** (sidebar on desktop, top-right on mobile).
3. Paste the webhook URL into **Discord webhook URL**.
4. Set your preferred **Notification time** (uses the server's local time zone).
5. Toggle **Enable daily reminder** on and click **Save notification settings**.

### What it sends

When you have cards due the server sends:

```
📚 **Reminder**: You have **12** cards due today, alice! Time to study.
```

No message is sent on days when you have zero cards due.

> **Note:** Notifications run on the server, not the browser, so they fire even when you have the app closed — as long as the container is running.

---

## User Management

Log in as admin → click the **👥 Users** button to open the admin panel.  
From there you can add or remove user accounts.

---

## PWA Installation (iPhone)

1. Open Safari → `http://your-server:3001`
2. Tap the Share button → **Add to Home Screen**
3. Done — Flashi runs as a native-looking app

> **Tip:** For HTTPS (required for reliable PWA behaviour) place an Nginx reverse proxy with Let's Encrypt in front.

---

## Project Structure

```
flashi/
├── src/
│   ├── screens/        # LoginScreen, SetupScreen, HomeScreen, TopicScreen,
│   │                   # StudyScreen, ImportScreen, DoneScreen, AdminScreen,
│   │                   # SettingsScreen, QuizImportScreen, QuizScreen,
│   │                   # QuizResultsScreen, ProgressionScreen
│   ├── utils/          # SRS algorithm, localStorage, API client
│   ├── App.tsx         # Routing & global state
│   ├── theme.ts        # Design tokens
│   └── types.ts        # TypeScript interfaces
├── server/
│   └── index.ts        # Express backend (auth + data API)
├── public/
│   └── manifest.json   # PWA manifest
├── Dockerfile
└── docker-compose.yml
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Inline styles + CSS animations |
| Backend | Express + bcryptjs + jsonwebtoken |
| Storage | JSON files per user (server volume) · localStorage cache (client) |
| Containerisation | Docker / Podman + Compose |

---

## Credits

- <a href="https://www.flaticon.com/free-icons/joker" title="joker icons">Joker icons created by riajulislam - Flaticon</a>
