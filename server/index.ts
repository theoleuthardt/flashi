import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import https from 'https';
import cors from 'cors';
import cron from 'node-cron';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '..', '.data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production-please';
const DIST_DIR = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface User {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
}

interface Config {
  users: User[];
  passwordHash?: string;
}

interface JwtPayload {
  username: string;
  isAdmin: boolean;
}

interface UserSettings {
  discordWebhook: string;
  notificationTime: string; // HH:MM
  notificationsEnabled: boolean;
}

interface FlashiCard {
  id: string;
  due: string;
}

interface FlashiUserData {
  decks: Array<{ id: string }>;
  cards: Record<string, FlashiCard[]>;
}

function loadConfig(): Config {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as Config;

    if (raw.passwordHash && (!raw.users || raw.users.length === 0)) {
      raw.users = [{ username: 'admin', passwordHash: raw.passwordHash, isAdmin: true }];
      delete raw.passwordHash;
      saveConfig(raw);
    }
    if (!raw.users) raw.users = [];
    return raw;
  } catch {
    return { users: [] };
  }
}

function saveConfig(config: Config): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload;
    if (!payload.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
}

app.get('/api/auth/status', (_req: Request, res: Response) => {
  const config = loadConfig();
  res.json({ setup: config.users.length === 0 });
});

app.post('/api/auth/setup', async (req: Request, res: Response) => {
  const config = loadConfig();
  if (config.users.length > 0) {
    res.status(400).json({ message: 'Password already set' });
    return;
  }
  const { username, password } = req.body as { username?: string; password?: string };
  const uname = (username ?? 'admin').trim() || 'admin';
  if (!password || password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' });
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  config.users = [{ username: uname, passwordHash: hash, isAdmin: true }];
  saveConfig(config);
  const token = signToken({ username: uname, isAdmin: true });
  res.json({ token });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const config = loadConfig();
  if (config.users.length === 0) {
    res.status(400).json({ message: 'No password set – run setup first' });
    return;
  }
  const { username, password } = req.body as { username?: string; password?: string };
  if (!password) {
    res.status(400).json({ message: 'Password missing' });
    return;
  }

  const user =
    config.users.length === 1 && !username
      ? config.users[0]
      : config.users.find((u) => u.username === username);

  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'Incorrect password' });
    return;
  }
  const token = signToken({ username: user.username, isAdmin: user.isAdmin });
  res.json({ token, username: user.username, isAdmin: user.isAdmin });
});

app.get('/api/auth/verify', requireAuth, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

function getUsernameFromToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload;
    return payload.username;
  } catch {
    return null;
  }
}

function userDataPath(username: string): string {
  return path.join(DATA_DIR, `data-${username}.json`);
}

function userSettingsPath(username: string): string {
  return path.join(DATA_DIR, `settings-${username}.json`);
}

function loadUserSettings(username: string): UserSettings {
  try {
    const raw = fs.readFileSync(userSettingsPath(username), 'utf-8');
    return JSON.parse(raw) as UserSettings;
  } catch {
    return { discordWebhook: '', notificationTime: '08:00', notificationsEnabled: false };
  }
}

function saveUserSettingsFile(username: string, settings: UserSettings): void {
  fs.writeFileSync(userSettingsPath(username), JSON.stringify(settings, null, 2));
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function sendDiscordWebhook(url: string, message: string): void {
  try {
    const body = JSON.stringify({ content: message });
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options);
    req.on('error', () => {});
    req.write(body);
    req.end();
  } catch {
    // Invalid URL or network error
  }
}

app.get('/api/data', requireAuth, (req: Request, res: Response) => {
  const username = getUsernameFromToken(req);
  if (!username) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const filePath = userDataPath(username);
  try {
    if (!fs.existsSync(filePath)) {
      res.json({ topics: [], decks: [], cards: {} });
      return;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(raw));
  } catch {
    res.json({ topics: [], decks: [], cards: {} });
  }
});

app.put('/api/data', requireAuth, (req: Request, res: Response) => {
  const username = getUsernameFromToken(req);
  if (!username) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const filePath = userDataPath(username);
  try {
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: 'Failed to save your data — please try again' });
  }
});

app.get('/api/user/settings', requireAuth, (req: Request, res: Response) => {
  const username = getUsernameFromToken(req);
  if (!username) { res.status(401).json({ message: 'Unauthorized' }); return; }
  res.json(loadUserSettings(username));
});

app.put('/api/user/settings', requireAuth, (req: Request, res: Response) => {
  const username = getUsernameFromToken(req);
  if (!username) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const settings = req.body as UserSettings;
  saveUserSettingsFile(username, settings);
  res.json({ ok: true });
});

app.post('/api/auth/change-password', requireAuth, async (req: Request, res: Response) => {
  const username = getUsernameFromToken(req);
  if (!username) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Current and new password are required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ message: 'New password must be at least 6 characters' });
    return;
  }
  const config = loadConfig();
  const user = config.users.find((u) => u.username === username);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'Current password is incorrect' });
    return;
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  saveConfig(config);
  res.json({ ok: true });
});

app.get('/api/admin/users', requireAdmin, (_req: Request, res: Response) => {
  const config = loadConfig();
  res.json({ users: config.users.map(({ username, isAdmin }) => ({ username, isAdmin })) });
});

app.post('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
  const config = loadConfig();
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' });
    return;
  }
  if (config.users.find((u) => u.username === username)) {
    res.status(400).json({ message: 'Username already exists' });
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  config.users.push({ username, passwordHash: hash, isAdmin: false });
  saveConfig(config);
  res.json({ ok: true });
});

app.patch('/api/admin/users/:username', requireAdmin, async (req: Request, res: Response) => {
  const config = loadConfig();
  const auth = req.headers.authorization!;
  const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload;
  const targetUsername = req.params.username;
  const { password, isAdmin } = req.body as { password?: string; isAdmin?: boolean };

  const userIndex = config.users.findIndex((u) => u.username === targetUsername);
  if (userIndex === -1) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  if (isAdmin === false && payload.username === targetUsername) {
    res.status(400).json({ message: 'Cannot remove your own admin status' });
    return;
  }
  if (password !== undefined) {
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }
    config.users[userIndex].passwordHash = await bcrypt.hash(password, 12);
  }
  if (isAdmin !== undefined) {
    config.users[userIndex].isAdmin = isAdmin;
  }
  saveConfig(config);
  res.json({ ok: true });
});

app.delete('/api/admin/users/:username', requireAdmin, (req: Request, res: Response) => {
  const config = loadConfig();
  const auth = req.headers.authorization!;
  const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload;
  if (payload.username === req.params.username) {
    res.status(400).json({ message: 'Cannot delete your own account' });
    return;
  }
  config.users = config.users.filter((u) => u.username !== req.params.username);
  saveConfig(config);
  res.json({ ok: true });
});

app.use(express.static(DIST_DIR));
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Runs every minute, checks if any user's notification time matches
cron.schedule('* * * * *', () => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = todayStr();

  const config = loadConfig();
  for (const user of config.users) {
    try {
      const settings = loadUserSettings(user.username);
      if (!settings.notificationsEnabled || !settings.discordWebhook || settings.notificationTime !== currentTime) continue;

      const dataPath = userDataPath(user.username);
      if (!fs.existsSync(dataPath)) continue;
      const userData = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as FlashiUserData;

      let dueCount = 0;
      for (const deckId of Object.keys(userData.cards ?? {})) {
        dueCount += (userData.cards[deckId] ?? []).filter((c) => c.due <= today).length;
      }

      if (dueCount > 0) {
        const message = `📚 **Flashi reminder**: You have **${dueCount}** card${dueCount !== 1 ? 's' : ''} due today, ${user.username}! Time to study.`;
        sendDiscordWebhook(settings.discordWebhook, message);
      }
    } catch {
      // Skip this user on error
    }
  }
});

app.listen(PORT, () => {
  console.log(`✓ Flashi running at http://localhost:${PORT}`);
  if (JWT_SECRET === 'change-me-in-production-please') {
    console.warn('⚠  JWT_SECRET not set – please update podman-compose.yml!');
  }
});
