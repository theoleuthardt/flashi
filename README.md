# Flashi

A self-hosted, mobile-first flashcard app powered by the SM-2 spaced repetition algorithm. Built with React, TypeScript, Vite, and Express. Installable as a PWA.

## Features

- **Spaced repetition** — SM-2 algorithm with Again / Hard / Good / Easy ratings
- **3D card flip** — smooth CSS perspective animation on every card
- **Skip cards** — skip to the next card with a slide animation, no rating needed
- **Topics & folders** — organise decks into topic folders with a grid layout; drag uncategorised decks onto topic cards to assign them
- **Dashboard** — live stats (decks, cards, due today) in a sidebar on desktop and a top bar on mobile; progress bars on every deck card
- **Daily Mix** — one button in any topic starts a randomised study session of up to 20 due cards from all the topic's decks
- **Fault repeat** — cards marked "Again" are tracked per topic; a **Repeat faults** button appears after each study session
- **Read-aloud** — tap the speaker icon on any card to hear it read with the browser's built-in Speech Synthesis API (great for language learning)
- **Discord reminders** — configure a webhook URL and a daily time in Settings to get a message when cards are due (see below)
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

## Docker Deployment

### 1. Set a secure JWT secret

```bash
# Generate a random secret
openssl rand -hex 32
```

Paste the output into `docker-compose.yml` next to `JWT_SECRET=`.

### 2. Start

```bash
docker compose up -d
```

The app runs on `http://your-server:3001`.

### 3. First-time setup

Open the app in a browser — you will be prompted to create an admin account (username + password).

---

## Importing Decks

Ask an AI to generate flashcard decks in the following JSON format:

```json
{
  "name": "Lesson 1 – Cyrillic Alphabet",
  "cards": [
    { "front": "А а", "back": "A (as in father)" },
    { "front": "Б б", "back": "B (as in book)" }
  ]
}
```

In the app: **+ Create deck** → paste JSON → optionally assign to a topic → **Create Deck**.

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
📚 Flashi reminder: You have 12 cards due today, alice! Time to study.
```

No message is sent on days when you have zero cards due.

> **Note:** Notifications run on the server, not the browser, so they fire even when you have the app closed — as long as the container is running.

---

## User Management

Log in as admin → click the **⚙ Users** button to open the admin panel.  
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
│   │                   # SettingsScreen
│   ├── utils/          # SRS algorithm, localStorage, API client
│   ├── App.tsx         # Routing & global state
│   ├── theme.ts        # Design tokens
│   └── types.ts        # TypeScript interfaces
├── server/
│   └── index.ts        # Express backend (auth + admin API)
├── public/
│   └── manifest.json   # PWA manifest
├── Dockerfile
└── docker-compose.yml
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 8 |
| Styling | Inline styles + CSS animations |
| Backend | Express + bcryptjs + jsonwebtoken |
| Storage | JSON files per user (server volume) · localStorage cache (client) |
| Containerisation | Docker + Docker Compose |

---

## Credits

- <a href="https://www.flaticon.com/free-icons/joker" title="joker icons">Joker icons created by riajulislam - Flaticon</a>
