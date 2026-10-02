import { randomBytes } from 'node:crypto';
import { createSession, hashSecret, verifySecret } from './auth.js';
import { pool, withTransaction } from './db.js';
import {
  accountVerifiedMessage,
  createVerificationCode,
  loginMessage,
  mailTimestamp,
  matchesVerificationCode,
  passwordResetMessage,
  queueMail,
  transactionMessage,
  verificationMessage,
} from './mailer.js';

function mapAsset(row) {
  return {
    id: row.id, symbol: row.symbol, name: row.name, network: row.network, color: row.color,
    priceUsd: Number(row.price_usd), change24h: Number(row.change_24h),
    balance: Number(row.balance), valueUsd: Number(row.balance) * Number(row.price_usd),
  };
}

export async function registerUser({ displayName, email, password, pin }) {
  return withTransaction(async (connection) => {
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ? FOR UPDATE', [normalizedEmail]);
    if (existing.length) throw Object.assign(new Error('Ya existe una cuenta con ese correo'), { status: 409 });
    const [passwordHash, pinHash] = await Promise.all([hashSecret(password), hashSecret(pin)]);
    const [userResult] = await connection.query(
      'INSERT INTO users (display_name, email, password_hash, email_verified_at) VALUES (?, ?, ?, NULL)',
      [displayName.trim(), normalizedEmail, passwordHash],
    );
    const address = `0x${randomBytes(20).toString('hex').toUpperCase()}`;
    const walletName = `${displayName.trim().split(' ')[0]} Wallet`;
    const [walletResult] = await connection.query(
      `INSERT INTO wallets (user_id, name, address, pin_hash, onboarding_completed)
       VALUES (?, ?, ?, ?, TRUE)`,
      [userResult.insertId, walletName, address, pinHash],
    );
    const [assets] = await connection.query('SELECT id, symbol FROM assets ORDER BY id');
    for (const [sortOrder, asset] of assets.entries()) {
      await connection.query(
        'INSERT INTO wallet_balances (wallet_id, asset_id, balance, sort_order) VALUES (?, ?, ?, ?)',
        [walletResult.insertId, asset.id, 0, sortOrder + 1],
      );
    }
    const verification = createVerificationCode(userResult.insertId);
    await connection.query(
      'INSERT INTO email_verification_tokens (user_id, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
      [userResult.insertId, verification.hash],
    );
    await queueMail(connection, verificationMessage({
      email: normalizedEmail,
      displayName: displayName.trim(),
      code: verification.code,
    }));
    return { requiresEmailVerification: true, email: normalizedEmail, expiresInMinutes: 15 };
  });
}

export async function loginUser({ email, password, ip = 'No disponible', userAgent = 'No disponible' }) {
  const normalizedEmail = email.trim().toLowerCase();
  const [rows] = await pool.query('SELECT id, display_name, email, password_hash, role, email_verified_at FROM users WHERE email = ?', [normalizedEmail]);
  const user = rows[0];
  if (!user || !(await verifySecret(password, user.password_hash))) {
    throw Object.assign(new Error('Correo o contraseña incorrectos'), { status: 401 });
  }
  if (!user.email_verified_at) {
    throw Object.assign(new Error('Debes confirmar tu correo antes de iniciar sesión'), { status: 403, code: 'EMAIL_NOT_VERIFIED' });
  }
  return withTransaction(async (connection) => {
    const session = await createSession(user.id, connection);
    await queueMail(connection, loginMessage({
      email: user.email,
      displayName: user.display_name,
      ip,
      userAgent,
      occurredAt: mailTimestamp(),
    }));
    return { ...session, user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role } };
  });
}

export async function resendEmailVerification(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      'SELECT id, display_name, email, email_verified_at FROM users WHERE email = ? FOR UPDATE',
      [normalizedEmail],
    );
    const user = rows[0];
    if (!user || user.email_verified_at) return { ok: true };
    const [recent] = await connection.query(
      `SELECT id FROM email_verification_tokens
       WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) LIMIT 1`,
      [user.id],
    );
    if (recent.length) throw Object.assign(new Error('Espera un minuto antes de solicitar otro código'), { status: 429 });
    await connection.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [user.id]);
    const verification = createVerificationCode(user.id);
    await connection.query(
      'INSERT INTO email_verification_tokens (user_id, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
      [user.id, verification.hash],
    );
    await queueMail(connection, verificationMessage({ email: user.email, displayName: user.display_name, code: verification.code }));
    return { ok: true };
  });
}

export async function verifyEmail({ email, code }) {
  const normalizedEmail = email.trim().toLowerCase();
  const outcome = await withTransaction(async (connection) => {
    const [users] = await connection.query(
      'SELECT id, display_name, email, role, email_verified_at FROM users WHERE email = ? FOR UPDATE',
      [normalizedEmail],
    );
    const user = users[0];
    if (!user) return { error: Object.assign(new Error('Código inválido o vencido'), { status: 400 }) };
    if (user.email_verified_at) {
      const session = await createSession(user.id, connection);
      return { ...session, user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role } };
    }
    const [tokens] = await connection.query(
      'SELECT id, code_hash, attempts, expires_at FROM email_verification_tokens WHERE user_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE',
      [user.id],
    );
    const token = tokens[0];
    if (!token || new Date(token.expires_at).getTime() < Date.now() || token.attempts >= 5) {
      return { error: Object.assign(new Error('Código inválido o vencido'), { status: 400 }) };
    }
    if (!matchesVerificationCode(user.id, code, token.code_hash)) {
      await connection.query('UPDATE email_verification_tokens SET attempts = attempts + 1 WHERE id = ?', [token.id]);
      return { error: Object.assign(new Error('El código no es correcto'), { status: 400 }) };
    }
    await connection.query('UPDATE users SET email_verified_at = NOW() WHERE id = ?', [user.id]);
    await connection.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [user.id]);
    const session = await createSession(user.id, connection);
    return { ...session, user: { id: user.id, displayName: user.display_name, email: user.email, role: user.role } };
  });
  if (outcome.error) throw outcome.error;
  return outcome;
}

export async function getBootstrap(walletId) {
  const [[wallet], balanceRows, transactionRows, dappRows, cardRows] = await Promise.all([
    pool.query(`SELECT w.id, w.name, w.address, w.onboarding_completed, u.display_name, u.email, u.role
      FROM wallets w JOIN users u ON u.id = w.user_id WHERE w.id = ?`, [walletId]),
    pool.query(`SELECT a.id, a.symbol, a.name, a.network, a.color, a.price_usd,
      a.change_24h, b.balance FROM wallet_balances b JOIN assets a ON a.id = b.asset_id
      WHERE b.wallet_id = ? ORDER BY b.sort_order`, [walletId]),
    pool.query(`SELECT t.id, t.type, t.status, t.amount, t.amount_usd, t.fee_usd,
      t.counterparty, t.created_at, a.symbol, a.color FROM transactions t
      JOIN assets a ON a.id = t.asset_id WHERE t.wallet_id = ? ORDER BY t.created_at DESC LIMIT 30`, [walletId]),
    pool.query('SELECT id, name, category, description, color FROM dapps ORDER BY sort_order'),
    pool.query(`SELECT id, nickname, holder_name, brand, last_four, expiry_month, expiry_year, color, is_default
      FROM payment_cards WHERE wallet_id = ? ORDER BY is_default DESC, created_at DESC`, [walletId]),
  ]);
  if (!wallet[0]) throw Object.assign(new Error('Billetera no encontrada'), { status: 404 });
  const assets = balanceRows[0].map(mapAsset);
  return {
    user: { displayName: wallet[0].display_name, email: wallet[0].email, role: wallet[0].role },
    wallet: {
      id: wallet[0].id, name: wallet[0].name, address: wallet[0].address,
      owner: wallet[0].display_name, onboardingCompleted: Boolean(wallet[0].onboarding_completed),
      totalUsd: assets.reduce((sum, asset) => sum + asset.valueUsd, 0), change24h: 5.32,
    },
    assets,
    transactions: transactionRows[0].map((row) => ({
      id: row.id, type: row.type, status: row.status, symbol: row.symbol, color: row.color,
      amount: Number(row.amount), amountUsd: Number(row.amount_usd), feeUsd: Number(row.fee_usd),
      counterparty: row.counterparty, createdAt: row.created_at,
    })),
    dapps: dappRows[0],
    cards: cardRows[0].map((row) => ({
      id: row.id,
      nickname: row.nickname,
      holderName: row.holder_name,
      brand: row.brand,
      lastFour: row.last_four,
      expiryMonth: Number(row.expiry_month),
      expiryYear: Number(row.expiry_year),
      color: row.color,
      isDefault: Boolean(row.is_default),
    })),
  };
}

export async function createPaymentCard({ walletId, nickname, holderName, brand, lastFour, expiryMonth, expiryYear, color }) {
  return withTransaction(async (connection) => {
    const [existingCards] = await connection.query('SELECT id FROM payment_cards WHERE wallet_id = ? LIMIT 1 FOR UPDATE', [walletId]);
    const isDefault = existingCards.length === 0;
    const [result] = await connection.query(
      `INSERT INTO payment_cards
        (wallet_id, nickname, holder_name, brand, last_four, expiry_month, expiry_year, color, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [walletId, nickname, holderName, brand, lastFour, expiryMonth, expiryYear, color, isDefault ? 1 : 0],
    );
    return { id: result.insertId, isDefault };
  });
}

export async function setDefaultPaymentCard({ walletId, cardId }) {
  return withTransaction(async (connection) => {
    const [cards] = await connection.query('SELECT id FROM payment_cards WHERE id = ? AND wallet_id = ? FOR UPDATE', [cardId, walletId]);
    if (!cards.length) throw Object.assign(new Error('Tarjeta virtual no encontrada'), { status: 404 });
    await connection.query('UPDATE payment_cards SET is_default = FALSE WHERE wallet_id = ?', [walletId]);
    await connection.query('UPDATE payment_cards SET is_default = TRUE WHERE id = ?', [cardId]);
    return { ok: true };
  });
}

export async function getAsset(walletId, symbol) {
  const [rows] = await pool.query(`SELECT a.id, a.symbol, a.name, a.network, a.color,
    a.price_usd, a.change_24h, b.balance FROM wallet_balances b JOIN assets a ON a.id = b.asset_id
    WHERE b.wallet_id = ? AND a.symbol = ?`, [walletId, symbol.toUpperCase()]);
  return rows[0] ? mapAsset(rows[0]) : null;
}

export async function createTransfer({ walletId, symbol, amount, recipient }) {
  return withTransaction(async (connection) => {
    const [senderRows] = await connection.query(`SELECT a.id, a.price_usd, b.balance, u.email, u.display_name
      FROM wallet_balances b JOIN assets a ON a.id = b.asset_id JOIN wallets w ON w.id = b.wallet_id
      JOIN users u ON u.id = w.user_id WHERE b.wallet_id = ? AND a.symbol = ? FOR UPDATE`, [walletId, symbol]);
    const sender = senderRows[0];
    if (!sender) throw Object.assign(new Error('Activo no encontrado'), { status: 404 });
    const [recipientRows] = await connection.query(`SELECT w.id AS wallet_id, u.display_name, u.email, b.asset_id
      FROM wallets w JOIN users u ON u.id = w.user_id JOIN wallet_balances b ON b.wallet_id = w.id
      JOIN assets a ON a.id = b.asset_id
      WHERE (LOWER(u.email) = LOWER(?) OR w.address = ?) AND a.symbol = ? FOR UPDATE`, [recipient, recipient, symbol]);
    const target = recipientRows[0];
    if (!target) throw Object.assign(new Error('No encontramos una cuenta con ese correo o dirección'), { status: 404 });
    if (Number(target.wallet_id) === Number(walletId)) throw Object.assign(new Error('No puedes transferirte a tu propia cuenta'), { status: 400 });
    if (Number(sender.balance) < amount) throw Object.assign(new Error('Saldo insuficiente'), { status: 409 });
    await connection.query('UPDATE wallet_balances SET balance = balance - ? WHERE wallet_id = ? AND asset_id = ?', [amount, walletId, sender.id]);
    await connection.query('UPDATE wallet_balances SET balance = balance + ? WHERE wallet_id = ? AND asset_id = ?', [amount, target.wallet_id, target.asset_id]);
    const [result] = await connection.query(`INSERT INTO transactions
      (wallet_id, asset_id, type, status, amount, amount_usd, fee_usd, counterparty)
      VALUES (?, ?, 'send', 'completed', ?, ?, 0, ?)`,
    [walletId, sender.id, amount, amount * sender.price_usd, target.email]);
    await connection.query(`INSERT INTO transactions
      (wallet_id, asset_id, type, status, amount, amount_usd, fee_usd, counterparty)
      VALUES (?, ?, 'receive', 'completed', ?, ?, 0, ?)`,
    [target.wallet_id, sender.id, amount, amount * sender.price_usd, sender.email]);
    const occurredAt = mailTimestamp();
    await queueMail(connection, transactionMessage({
      email: sender.email, displayName: sender.display_name, title: 'Transferencia enviada', type: 'Envío',
      amount, asset: symbol, valueUsd: amount * sender.price_usd, counterparty: target.email, occurredAt,
    }));
    await queueMail(connection, transactionMessage({
      email: target.email, displayName: target.display_name, title: 'Transferencia recibida', type: 'Recepción',
      amount, asset: symbol, valueUsd: amount * sender.price_usd, counterparty: sender.email, occurredAt,
    }));
    return { id: result.insertId, status: 'completed', recipientName: target.display_name };
  });
}

export async function createReceive({ walletId, symbol, amount, address = 'Wallet funding' }) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(`SELECT a.id, a.price_usd, u.email, u.display_name
      FROM assets a JOIN wallet_balances b ON b.asset_id = a.id
      JOIN wallets w ON w.id = b.wallet_id JOIN users u ON u.id = w.user_id
      WHERE a.symbol = ? AND w.id = ?`, [symbol, walletId]);
    const asset = rows[0];
    if (!asset) throw Object.assign(new Error('Activo no encontrado'), { status: 404 });
    await connection.query('UPDATE wallet_balances SET balance = balance + ? WHERE wallet_id = ? AND asset_id = ?', [amount, walletId, asset.id]);
    const [result] = await connection.query(`INSERT INTO transactions
      (wallet_id, asset_id, type, status, amount, amount_usd, fee_usd, counterparty)
      VALUES (?, ?, 'receive', 'completed', ?, ?, 0, ?)`,
    [walletId, asset.id, amount, amount * asset.price_usd, address]);
    await queueMail(connection, transactionMessage({
      email: asset.email, displayName: asset.display_name, title: 'Saldo recibido', type: 'Recepción',
      amount, asset: symbol, valueUsd: amount * asset.price_usd, counterparty: address, occurredAt: mailTimestamp(),
    }));
    return { id: result.insertId, status: 'completed' };
  });
}

export async function createSwap({ walletId, fromSymbol, toSymbol, amount }) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(`SELECT a.id, a.symbol, a.price_usd, b.balance, u.email, u.display_name
      FROM wallet_balances b JOIN assets a ON a.id = b.asset_id
      JOIN wallets w ON w.id = b.wallet_id JOIN users u ON u.id = w.user_id
      WHERE b.wallet_id = ? AND a.symbol IN (?, ?) FOR UPDATE`, [walletId, fromSymbol, toSymbol]);
    const from = rows.find((row) => row.symbol === fromSymbol);
    const to = rows.find((row) => row.symbol === toSymbol);
    if (!from || !to) throw Object.assign(new Error('Par no disponible'), { status: 404 });
    if (Number(from.balance) < amount) throw Object.assign(new Error('Saldo insuficiente'), { status: 409 });
    const feeUsd = amount * from.price_usd * 0.0015;
    const received = ((amount * from.price_usd) - feeUsd) / to.price_usd;
    await connection.query('UPDATE wallet_balances SET balance = balance - ? WHERE wallet_id = ? AND asset_id = ?', [amount, walletId, from.id]);
    await connection.query('UPDATE wallet_balances SET balance = balance + ? WHERE wallet_id = ? AND asset_id = ?', [received, walletId, to.id]);
    const [result] = await connection.query(`INSERT INTO transactions
      (wallet_id, asset_id, related_asset_id, type, status, amount, amount_usd, fee_usd, counterparty)
      VALUES (?, ?, ?, 'swap', 'completed', ?, ?, ?, ?)`,
    [walletId, from.id, to.id, amount, amount * from.price_usd, feeUsd, `${toSymbol}:${received}`]);
    await queueMail(connection, transactionMessage({
      email: from.email, displayName: from.display_name, title: 'Intercambio completado', type: `${fromSymbol} a ${toSymbol}`,
      amount, asset: fromSymbol, valueUsd: amount * from.price_usd, counterparty: `${received.toFixed(8)} ${toSymbol}`, occurredAt: mailTimestamp(),
    }));
    return { id: result.insertId, status: 'completed', received, feeUsd };
  });
}

export async function createBuy({ walletId, symbol, usdAmount, cardId }) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(`SELECT a.id, a.price_usd, u.email, u.display_name FROM wallet_balances b
      JOIN assets a ON a.id = b.asset_id JOIN wallets w ON w.id = b.wallet_id
      JOIN users u ON u.id = w.user_id WHERE b.wallet_id = ? AND a.symbol = ? FOR UPDATE`, [walletId, symbol]);
    const asset = rows[0];
    if (!asset) throw Object.assign(new Error('Activo no encontrado'), { status: 404 });
    const [cards] = await connection.query(
      'SELECT id, brand, last_four FROM payment_cards WHERE id = ? AND wallet_id = ? FOR UPDATE',
      [cardId, walletId],
    );
    const card = cards[0];
    if (!card) throw Object.assign(new Error('Selecciona una tarjeta virtual válida'), { status: 400 });
    const cardLabel = `${card.brand} •••• ${card.last_four}`;
    const feeUsd = usdAmount * 0.0125;
    const received = (usdAmount - feeUsd) / asset.price_usd;
    await connection.query('UPDATE wallet_balances SET balance = balance + ? WHERE wallet_id = ? AND asset_id = ?', [received, walletId, asset.id]);
    const [result] = await connection.query(`INSERT INTO transactions
      (wallet_id, asset_id, type, status, amount, amount_usd, fee_usd, counterparty)
      VALUES (?, ?, 'buy', 'completed', ?, ?, ?, ?)`,
    [walletId, asset.id, received, usdAmount, feeUsd, cardLabel]);
    await queueMail(connection, transactionMessage({
      email: asset.email, displayName: asset.display_name, title: 'Compra completada', type: 'Compra simulada',
      amount: received.toFixed(8), asset: symbol, valueUsd: usdAmount, counterparty: cardLabel, occurredAt: mailTimestamp(),
    }));
    return { id: result.insertId, status: 'completed', received, feeUsd };
  });
}

export async function updateOnboarding(walletId, completed) {
  await pool.query('UPDATE wallets SET onboarding_completed = ? WHERE id = ?', [completed ? 1 : 0, walletId]);
}

export async function listUsersForAdmin() {
  const [rows] = await pool.query(`SELECT u.id, u.display_name, u.email, u.role, u.email_verified_at, u.created_at, w.address,
      COALESCE(SUM(b.balance * a.price_usd), 0) AS total_usd
    FROM users u JOIN wallets w ON w.user_id = u.id
    LEFT JOIN wallet_balances b ON b.wallet_id = w.id
    LEFT JOIN assets a ON a.id = b.asset_id
    GROUP BY u.id, u.display_name, u.email, u.role, u.email_verified_at, u.created_at, w.address
    ORDER BY u.created_at DESC`);
  return rows.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    address: row.address,
    totalUsd: Number(row.total_usd),
    emailVerified: Boolean(row.email_verified_at),
    createdAt: row.created_at,
  }));
}

export async function verifyUserForAdmin(userId) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      'SELECT id, display_name, email, role, email_verified_at FROM users WHERE id = ? FOR UPDATE',
      [userId],
    );
    const user = rows[0];
    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    if (user.role === 'admin') throw Object.assign(new Error('No puedes modificar otra cuenta administrativa'), { status: 403 });
    if (!user.email_verified_at) {
      await connection.query('UPDATE users SET email_verified_at = NOW() WHERE id = ?', [user.id]);
      await connection.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [user.id]);
      await queueMail(connection, accountVerifiedMessage({ email: user.email, displayName: user.display_name }));
    }
    return { displayName: user.display_name, alreadyVerified: Boolean(user.email_verified_at) };
  });
}

export async function resetUserPasswordForAdmin(userId) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      'SELECT id, display_name, email, role FROM users WHERE id = ? FOR UPDATE',
      [userId],
    );
    const user = rows[0];
    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    if (user.role === 'admin') throw Object.assign(new Error('No puedes modificar otra cuenta administrativa'), { status: 403 });
    const temporaryPassword = `Wallet-${randomBytes(5).toString('hex').toUpperCase()}!a9`;
    const passwordHash = await hashSecret(temporaryPassword);
    await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
    await connection.query('DELETE FROM sessions WHERE user_id = ?', [user.id]);
    await queueMail(connection, passwordResetMessage({
      email: user.email,
      displayName: user.display_name,
      temporaryPassword,
    }));
    return { displayName: user.display_name, email: user.email };
  });
}

export async function deleteUserForAdmin(userId) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      `SELECT u.id, u.display_name, u.role, w.id AS wallet_id
       FROM users u JOIN wallets w ON w.user_id = u.id WHERE u.id = ? FOR UPDATE`,
      [userId],
    );
    const user = rows[0];
    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    if (user.role === 'admin') throw Object.assign(new Error('No puedes eliminar una cuenta administrativa'), { status: 403 });
    await connection.query('DELETE FROM payment_cards WHERE wallet_id = ?', [user.wallet_id]);
    await connection.query('DELETE FROM transactions WHERE wallet_id = ?', [user.wallet_id]);
    await connection.query('DELETE FROM wallet_balances WHERE wallet_id = ?', [user.wallet_id]);
    await connection.query('DELETE FROM sessions WHERE user_id = ?', [user.id]);
    await connection.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [user.id]);
    await connection.query('DELETE FROM wallets WHERE id = ?', [user.wallet_id]);
    await connection.query('DELETE FROM users WHERE id = ?', [user.id]);
    return { displayName: user.display_name };
  });
}

export async function fundUser({ userId, symbol, amount, adminEmail }) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(`SELECT w.id AS wallet_id, a.id AS asset_id, a.price_usd, u.display_name, u.email
      FROM users u JOIN wallets w ON w.user_id = u.id
      JOIN wallet_balances b ON b.wallet_id = w.id
      JOIN assets a ON a.id = b.asset_id
      WHERE u.id = ? AND a.symbol = ? FOR UPDATE`, [userId, symbol]);
    const target = rows[0];
    if (!target) throw Object.assign(new Error('Usuario o activo no encontrado'), { status: 404 });
    await connection.query('UPDATE wallet_balances SET balance = balance + ? WHERE wallet_id = ? AND asset_id = ?', [amount, target.wallet_id, target.asset_id]);
    const [result] = await connection.query(`INSERT INTO transactions
      (wallet_id, asset_id, type, status, amount, amount_usd, fee_usd, counterparty)
      VALUES (?, ?, 'receive', 'completed', ?, ?, 0, ?)`,
    [target.wallet_id, target.asset_id, amount, amount * target.price_usd, adminEmail]);
    const occurredAt = mailTimestamp();
    await queueMail(connection, transactionMessage({
      email: target.email, displayName: target.display_name, title: 'Saldo acreditado', type: 'Acreditación administrativa',
      amount, asset: symbol, valueUsd: amount * target.price_usd, counterparty: adminEmail, occurredAt,
    }));
    if (adminEmail.toLowerCase() !== target.email.toLowerCase()) {
      const [admins] = await connection.query('SELECT display_name FROM users WHERE email = ? LIMIT 1', [adminEmail]);
      await queueMail(connection, transactionMessage({
        email: adminEmail, displayName: admins[0]?.display_name || 'Administrador', title: 'Acreditación realizada', type: 'Acreditación administrativa',
        amount, asset: symbol, valueUsd: amount * target.price_usd, counterparty: target.email, occurredAt,
      }));
    }
    return { id: result.insertId, status: 'completed', recipientName: target.display_name };
  });
}
