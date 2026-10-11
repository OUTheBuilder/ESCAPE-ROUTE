import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 8080);
const jwtSecret = process.env.JWT_SECRET || '';
const databaseUrl = process.env.DATABASE_URL || '';
const rounds = Math.max(10, Math.min(14, Number(process.env.BCRYPT_ROUNDS || 12)));
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
}) : null;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: process.env.APP_ORIGIN ? process.env.APP_ORIGIN.split(',').map(v => v.trim()) : false,
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));

const attempts = new Map();
function rateLimit(req, res, next) {
  const key = `${req.ip}:${String(req.body?.identifier || req.body?.email || req.body?.username || 'general').toLowerCase()}`;
  const now = Date.now();
  const item = attempts.get(key) || { count: 0, reset: now + 15 * 60_000 };
  if (now > item.reset) { item.count = 0; item.reset = now + 15 * 60_000; }
  item.count++;
  attempts.set(key, item);
  if (attempts.size > 5000) for (const [k, v] of attempts) if (v.reset < now) attempts.delete(k);
  if (item.count > 12) return res.status(429).json({ message: 'Too many attempts. Try again later.' });
  next();
}
function ready(req, res, next) {
  if (!pool) return res.status(503).json({ message: 'Authentication service is not configured with DATABASE_URL.' });
  if (jwtSecret.length < 32) return res.status(503).json({ message: 'Authentication service is not configured with a secure JWT_SECRET.' });
  next();
}
function cleanEmail(v) { return typeof v === 'string' ? v.trim().toLowerCase() : ''; }
function cleanUsername(v) { return typeof v === 'string' ? v.trim().toLowerCase() : ''; }
function validPassword(v) { return typeof v === 'string' && v.length >= 8 && v.length <= 200; }
function validPin(v) { return typeof v === 'string' && /^\d{6}$/.test(v); }
async function tokenFor(user) {
  return new SignJWT({ username: user.username, email: user.email })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(String(user.id))
    .setIssuedAt().setExpirationTime('12h').sign(new TextEncoder().encode(jwtSecret));
}
async function authUser(req, res, next) {
  try {
    const value = req.headers.authorization || '';
    if (!value.startsWith('Bearer ')) return res.status(401).json({ message: 'Sign in required.' });
    const { payload } = await jwtVerify(value.slice(7), new TextEncoder().encode(jwtSecret));
    const result = await pool.query('SELECT id, email, username FROM app_users WHERE id = $1', [payload.sub]);
    if (!result.rowCount) return res.status(401).json({ message: 'Account not found.' });
    req.user = result.rows[0];
    next();
  } catch { return res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ou-escape-route-auth', configured: Boolean(pool && jwtSecret.length >= 32) }));
app.post('/v1/auth/register', ready, rateLimit, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = req.body?.password;
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return res.status(400).json({ message: 'Username must be 3–32 characters (letters, numbers, _, ., -).' });
  if (!validPassword(password)) return res.status(400).json({ message: 'Password must be 8–200 characters.' });
  try {
    const hash = await bcrypt.hash(password, rounds);
    const result = await pool.query('INSERT INTO app_users(email, username, password_hash) VALUES($1,$2,$3) RETURNING id,email,username', [email, username, hash]);
    const user = result.rows[0];
    res.status(201).json({ token: await tokenFor(user), user });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'That email or username is already registered.' });
    console.error('register failed', e.message);
    res.status(500).json({ message: 'Could not create account.' });
  }
});
app.post('/v1/auth/login', ready, rateLimit, async (req, res) => {
  const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
  const password = req.body?.password;
  if (!identifier || typeof password !== 'string') return res.status(400).json({ message: 'Enter your email or username and password.' });
  try {
    const result = await pool.query('SELECT id,email,username,password_hash FROM app_users WHERE email_normalized=$1 OR username_normalized=$1 LIMIT 1', [identifier.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Invalid sign-in details.' });
    res.json({ token: await tokenFor(user), user: { id: user.id, email: user.email, username: user.username } });
  } catch (e) { console.error('login failed', e.message); res.status(500).json({ message: 'Sign-in failed.' }); }
});
app.post('/v1/auth/pin', ready, authUser, rateLimit, async (req, res) => {
  const pin = req.body?.pin;
  if (!validPin(pin)) return res.status(400).json({ message: 'PIN must contain exactly 6 digits.' });
  try {
    const hash = await bcrypt.hash(pin, rounds);
    await pool.query('UPDATE app_users SET pin_hash=$1, updated_at=now() WHERE id=$2', [hash, req.user.id]);
    res.json({ ok: true, message: 'PIN saved securely. You can now use it to sign in on this service.' });
  } catch (e) { console.error('set PIN failed', e.message); res.status(500).json({ message: 'Could not save PIN.' }); }
});
app.post('/v1/auth/login-pin', ready, rateLimit, async (req, res) => {
  const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim().toLowerCase() : '';
  const pin = req.body?.pin;
  if (!identifier || !validPin(pin)) return res.status(400).json({ message: 'Enter your email or username and 6-digit PIN.' });
  try {
    const result = await pool.query('SELECT id,email,username,pin_hash FROM app_users WHERE email_normalized=$1 OR username_normalized=$1 LIMIT 1', [identifier]);
    const user = result.rows[0];
    if (!user?.pin_hash || !(await bcrypt.compare(pin, user.pin_hash))) return res.status(401).json({ message: 'Invalid sign-in details.' });
    res.json({ token: await tokenFor(user), user: { id: user.id, email: user.email, username: user.username } });
  } catch (e) { console.error('PIN login failed', e.message); res.status(500).json({ message: 'PIN sign-in failed.' }); }
});
app.get('/v1/auth/me', ready, authUser, (req, res) => res.json({ user: req.user }));
app.use((_req, res) => res.status(404).json({ message: 'Not found.' }));
async function start() {
  if (pool && jwtSecret.length >= 32) {
    // Apply the idempotent schema on startup so fresh hosted databases are ready.
    // Keep the schema limited to this service's own app_users table.
    const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
    await pool.query(schema);
    console.log('Authentication database schema is ready.');
  }
  app.listen(port, () => console.log(`OU Escape Route auth service listening on ${port}`));
}

start().catch(error => {
  console.error('Could not start authentication service:', error.message);
  process.exitCode = 1;
});
