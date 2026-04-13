import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

// ── Config ────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, '..', '.data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production-please';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── Types ─────────────────────────────────────────────────────────
interface User {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
}

interface Config {
  users: User[];
  // legacy field – migrated on first load
  passwordHash?: string;
}

interface JwtPayload {
  username: string;
  isAdmin: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────
function loadConfig(): Config {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as Config;
    // Migrate legacy single-password config
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

// ── App ───────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Auth middleware
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

// ── Auth Routes ───────────────────────────────────────────────────

// Check whether first-time setup is needed
app.get('/api/auth/status', (_req: Request, res: Response) => {
  const config = loadConfig();
  res.json({ setup: config.users.length === 0 });
});

// First-time admin setup (only works once – when no users exist)
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

// Login
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
  // If only one user exists and no username provided, log in as that user
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

// Token verification
app.get('/api/auth/verify', requireAuth, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ── Admin Routes ──────────────────────────────────────────────────

// List users (admin only)
app.get('/api/admin/users', requireAdmin, (_req: Request, res: Response) => {
  const config = loadConfig();
  res.json({ users: config.users.map(({ username, isAdmin }) => ({ username, isAdmin })) });
});

// Create user (admin only)
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

// Update user (admin only)
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

// Delete user (admin only, cannot delete self)
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

// ── Static Files ──────────────────────────────────────────────────
app.use(express.static(DIST_DIR));

// SPA fallback
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Flashi running at http://localhost:${PORT}`);
  if (JWT_SECRET === 'change-me-in-production-please') {
    console.warn('⚠  JWT_SECRET not set – please update docker-compose.yml!');
  }
});
