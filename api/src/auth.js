import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from './db.js';

const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;

export async function hashSecret(value) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(String(value), salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
}

export async function verifySecret(value, encoded) {
  const [algorithm, salt, expectedHex] = String(encoded || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(await scrypt(String(value), salt, expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const tokenHash = (token) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId, connection = pool) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await connection.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash(token), expiresAt],
  );
  return { token, expiresAt };
}

export async function findSession(token) {
  if (!token) return null;
  const [rows] = await pool.query(`SELECT s.user_id, s.expires_at, u.display_name, u.email, u.role,
      w.id AS wallet_id FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN wallets w ON w.user_id = u.id
    WHERE s.token_hash = ? AND s.expires_at > NOW()`, [tokenHash(token)]);
  return rows[0] || null;
}

export async function revokeSession(token) {
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = ?', [tokenHash(token)]);
}

export function readBearer(request) {
  const value = String(request.headers.authorization || '');
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

export async function requireAuth(request, response, next) {
  try {
    const token = readBearer(request);
    const session = await findSession(token);
    if (!session) return response.status(401).json({ message: 'Sesión inválida o expirada' });
    request.auth = { ...session, token };
    next();
  } catch (error) {
    next(error);
  }
}
