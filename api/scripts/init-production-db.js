import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const scrypt = promisify(scryptCallback);
const directory = path.dirname(fileURLToPath(import.meta.url));
const required = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_PIN'];

for (const name of required) {
  if (!process.env[name]) throw new Error(`Falta la variable de producción ${name}`);
}
if (!/^\d{6}$/.test(process.env.ADMIN_PIN)) {
  throw new Error('ADMIN_PIN debe contener exactamente 6 dígitos');
}
if (process.env.ADMIN_PASSWORD.length < 12) {
  throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres');
}

async function hashSecret(value) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(String(value), salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('hex')}`;
}

const [schema, catalog] = await Promise.all([
  fs.readFile(path.join(directory, '../../database/schema.sql'), 'utf8'),
  fs.readFile(path.join(directory, '../../database/production-seed.sql'), 'utf8'),
]);
const connection = await mysql.createConnection({
  ...config.db,
  multipleStatements: true,
});

try {
  const databaseName = config.db.database.replaceAll('`', '');
  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error('DB_NAME solo puede contener letras, números y guion bajo');
  }
  const schemaSql = schema
    .replace(/CREATE DATABASE IF NOT EXISTS[\s\S]*?;\s*/i, '')
    .replace(/USE\s+`\{\{DATABASE_NAME\}\}`;\s*/i, '');
  const catalogSql = catalog.replace(/USE\s+`\{\{DATABASE_NAME\}\}`;\s*/i, '');
  await connection.query(schemaSql);
  await connection.query(catalogSql);

  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const displayName = (process.env.ADMIN_DISPLAY_NAME || 'Administrador').trim();
  const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
  let userId = existing[0]?.id;

  if (!userId) {
    const passwordHash = await hashSecret(process.env.ADMIN_PASSWORD);
    const [userResult] = await connection.query(
      'INSERT INTO users (display_name, email, password_hash, role) VALUES (?, ?, ?, \'admin\')',
      [displayName, email, passwordHash],
    );
    userId = userResult.insertId;
  } else {
    await connection.query('UPDATE users SET role = \'admin\' WHERE id = ?', [userId]);
  }

  const [wallets] = await connection.query('SELECT id FROM wallets WHERE user_id = ?', [userId]);
  let walletId = wallets[0]?.id;
  if (!walletId) {
    const pinHash = await hashSecret(process.env.ADMIN_PIN);
    const address = `0x${randomBytes(20).toString('hex').toUpperCase()}`;
    const [walletResult] = await connection.query(
      `INSERT INTO wallets (user_id, name, address, pin_hash, onboarding_completed)
       VALUES (?, 'Wallet Administrador', ?, ?, TRUE)`,
      [userId, address, pinHash],
    );
    walletId = walletResult.insertId;
  }

  const [assets] = await connection.query('SELECT id FROM assets ORDER BY id');
  for (const [index, asset] of assets.entries()) {
    await connection.query(
      `INSERT INTO wallet_balances (wallet_id, asset_id, balance, sort_order)
       VALUES (?, ?, 0, ?) ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)`,
      [walletId, asset.id, index + 1],
    );
  }

  console.log(`Base de datos ${databaseName} preparada para producción.`);
} finally {
  await connection.end();
}
