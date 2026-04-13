# Flashi

A self-hosted, mobile-first flashcard app powered by the SM-2 spaced repetition algorithm. Built with React, TypeScript, Vite, and Express. Installable as a PWA.

## Features

- **Spaced repetition** — SM-2 algorithm with Again / Hard / Good / Easy ratings
- **3D card flip** — smooth CSS perspective animation on every card
- **Skip cards** — skip to the next card with a slide animation, no rating needed
- **Topics & folders** — organise decks into topic folders with a grid layout
- **Dashboard** — live stats (decks, cards, due today) in a sidebar on desktop and a top bar on mobile
- **Multi-user** — admin can create and remove additional user accounts
- **Auth** — bcrypt password hashing, JWT sessions (30 days)
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

In the app: **+ Import deck** → paste JSON → optionally assign to a topic → **Import**.

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

## PWA Icons

Place these files in `/public/`:
- `icon-192.png` (192 × 192 px)
- `icon-512.png` (512 × 512 px)

---

## Project Structure

```
flashi/
├── src/
│   ├── screens/        # LoginScreen, SetupScreen, HomeScreen, TopicScreen,
│   │                   # StudyScreen, ImportScreen, DoneScreen, AdminScreen
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
| Storage | localStorage (client) · JSON file (server config) |
| Containerisation | Docker + Docker Compose |
