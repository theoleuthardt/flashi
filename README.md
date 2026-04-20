# Flashi

A self-hosted, mobile-first flashcard app powered by the SM-2 spaced repetition algorithm. Built with React, TypeScript, Vite, and Express. Installable as a PWA.

## Features

- **Spaced repetition** — SM-2 algorithm with Again / Hard / Good / Easy ratings
- **3D card flip** — smooth CSS perspective animation on every card
- **Skip cards** — skip to the next card with a slide animation, no rating needed
- **Topics & folders** — organise decks into topic folders with a grid layout; drag uncategorised decks onto topic cards to assign them
- **Dashboard** — live stats (decks, cards, due today) in a sidebar on desktop and a top bar on mobile; progress bars on every deck card
- **Daily Mix** — one button in any topic starts a randomised study session of up to 20 cards from all the topic's decks
- **Daily Quiz Mix** — one button in any topic assembles a mixed quiz of up to 20 random questions across all quizzes in the topic
- **Fault repeat** — cards marked "Again" are tracked per topic; a **Repeat faults** button appears after each study session
- **Read-aloud** — tap the speaker icon on any card to hear it read with the browser's built-in Speech Synthesis API (great for language learning)
- **Discord reminders** — configure a webhook URL and a daily time in Settings to get a message when cards are due (see below)
- **Quizzes** — import multiple-choice quizzes (JSON) per topic; each answer option can carry its own explanation that is revealed inline after selecting (like NotebookLM); score screen with fault review
- **Quiz progress** — unfinished quizzes are saved to localStorage and resume from the right question; a restart FAB (↺) lets you start over with a confirmation
- **Progression** — overview screen with overall % learned and per-topic stacked bars (learned / due / new)
- **Multi-user** — admin can create and remove additional user accounts; per-user data stored on the server volume
- **Auth** — bcrypt password hashing, JWT sessions (30 days); users can change their own password in Settings
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

Ask an AI to generate flashcard decks in the following JSON format and paste it in the app under **+ Create deck**:

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

In the app: **+ Create deck** → paste JSON → optionally assign to a topic → **Create Deck**.

---

## Importing Quizzes

Ask an AI to generate quizzes in the following JSON format. Each answer option can be a plain string or a `[text, explanation]` tuple — the explanation is revealed inline after the user selects an answer.

```json
{
  "name": "Lesson 1 – Cyrillic Alphabet Quiz",
  "questions": [
    {
      "question": "What sound does 'А а' make?",
      "options": [
        ["A (as in father)", "Correct — А а is the first letter and sounds like the 'a' in 'father'."],
        ["B (as in book)", "Incorrect — that is Б б."],
        ["V (as in victory)", "Incorrect — that is В в."],
        ["G (as in go)", "Incorrect — that is Г г."]
      ],
      "correct": 0
    }
  ]
}
```

`correct` is the zero-based index of the right answer. Plain strings work too if you don't need per-option explanations.

To import multiple quizzes at once, wrap them in a JSON array.

In the app: **+ Create quiz** (inside a topic) → paste JSON → **Create Quiz**.

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
