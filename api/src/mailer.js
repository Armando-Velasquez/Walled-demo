import nodemailer from 'nodemailer';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { pool } from './db.js';

const POLL_INTERVAL_MS = 5_000;
const MAX_ATTEMPTS = 6;
let transporter;
let processing = false;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function getTransporter() {
  if (transporter) return transporter;
  const auth = { user: config.mail.user, pass: config.mail.password };
  transporter = config.mail.service
    ? nodemailer.createTransport({ service: config.mail.service, auth })
    : nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth,
    });
  return transporter;
}

function emailLayout(title, intro, rows = [], footer = 'Si no reconoces esta actividad, cambia tu contraseña cuanto antes.') {
  const details = rows.map(([label, value]) => `<tr><td class="detail-label" style="padding:10px 12px;color:#667085">${escapeHtml(label)}</td><td class="detail-value" style="padding:10px 12px;color:#111827;text-align:right;font-weight:600">${escapeHtml(value)}</td></tr>`).join('');
  return `<!doctype html>
<html><head><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<style>
  :root{color-scheme:light dark;supported-color-schemes:light dark}
  body{margin:0;background:#F3F5FA;color:#111827;font-family:Arial,sans-serif}
  .shell{max-width:560px;margin:0 auto;padding:32px 18px}.hero{background:#696DFF;background-image:linear-gradient(135deg,#8A5CFF,#536CFF 52%,#35BCEB);border-radius:24px;padding:28px;color:#FFF}.details{width:100%;margin-top:18px;background:#FFF;border:1px solid #E2E7F0;border-radius:18px;padding:10px;border-spacing:0}.footer{color:#667085;font-size:13px;line-height:1.55;margin:22px 4px}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.16);font-size:12px;font-weight:700;letter-spacing:1.7px}
  @media (prefers-color-scheme:dark){body{background:#070A12!important;color:#F7F8FC!important}.details{background:#10151F!important;border-color:#252D3B!important}.detail-label,.footer{color:#939BAC!important}.detail-value{color:#F7F8FC!important}}
</style></head><body><div class="shell"><div class="hero"><div class="badge">WALLET • SEGURIDAD</div><h1 style="font-size:26px;margin:18px 0 10px">${escapeHtml(title)}</h1><p style="margin:0;line-height:1.6">${escapeHtml(intro)}</p></div>${details ? `<table role="presentation" class="details">${details}</table>` : ''}<p class="footer">${escapeHtml(footer)}<br><br>Este mensaje fue generado automáticamente; no respondas a este correo.</p></div></body></html>`;
}

export function createVerificationCode(userId) {
  const code = String(randomInt(100000, 1_000_000));
  return { code, hash: verificationHash(userId, code) };
}

export function verificationHash(userId, code) {
  return createHmac('sha256', config.mail.verificationSecret).update(`${userId}:${code}`).digest('hex');
}

export function matchesVerificationCode(userId, code, expectedHash) {
  const actual = Buffer.from(verificationHash(userId, code), 'hex');
  const expected = Buffer.from(String(expectedHash || ''), 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verificationMessage({ email, displayName, code }) {
  return {
    to: email,
    subject: `${code} es tu código de verificación de Wallet`,
    text: `Hola ${displayName}. Tu código de verificación de Wallet es ${code}. Caduca en 15 minutos.`,
    html: emailLayout('Confirma tu correo', `Hola ${displayName}, usa este código para activar tu cuenta.`, [['Código', code], ['Vigencia', '15 minutos']], 'Si no creaste esta cuenta, puedes ignorar este mensaje.'),
  };
}

export function passwordResetMessage({ email, displayName, temporaryPassword }) {
  return {
    to: email,
    subject: 'Tu contraseña temporal de Wallet',
    text: `Hola ${displayName}. Administración restableció tu acceso. Tu contraseña temporal es ${temporaryPassword}. Inicia sesión y cámbiala cuanto antes.`,
    html: emailLayout('Contraseña restablecida', `Hola ${displayName}, administración generó una contraseña temporal para recuperar tu acceso.`, [['Contraseña temporal', temporaryPassword]], 'Inicia sesión con esta clave y cámbiala cuanto antes. Si no solicitaste el cambio, contacta al administrador.'),
  };
}

export function accountVerifiedMessage({ email, displayName }) {
  return {
    to: email,
    subject: 'Tu cuenta de Wallet fue verificada',
    text: `Hola ${displayName}. Administración verificó tu cuenta de Wallet. Ya puedes iniciar sesión normalmente.`,
    html: emailLayout('Cuenta verificada', `Hola ${displayName}, tu correo fue validado por administración y tu cuenta ya está activa.`, [['Estado', 'Verificada'], ['Acceso', 'Habilitado']], 'Ya puedes iniciar sesión en Wallet con tus credenciales.'),
  };
}

export function loginMessage({ email, displayName, ip, userAgent, occurredAt }) {
  return {
    to: email,
    subject: 'Nuevo inicio de sesión en Wallet',
    text: `Hola ${displayName}. Se inició sesión en tu cuenta el ${occurredAt}. IP: ${ip}. Dispositivo: ${userAgent}.`,
    html: emailLayout('Nuevo inicio de sesión', `Hola ${displayName}, detectamos un acceso correcto a tu cuenta.`, [['Fecha', occurredAt], ['IP', ip], ['Dispositivo', userAgent]]),
  };
}

export function transactionMessage({ email, displayName, title, type, amount, asset, valueUsd, counterparty, occurredAt }) {
  const rows = [['Operación', type], ['Cantidad', `${amount} ${asset}`], ['Valor referencial', `$${Number(valueUsd).toFixed(2)}`], ['Fecha', occurredAt]];
  if (counterparty) rows.splice(3, 0, ['Contraparte', counterparty]);
  return {
    to: email,
    subject: `${title} en Wallet`,
    text: `Hola ${displayName}. ${title}: ${amount} ${asset}, valor referencial $${Number(valueUsd).toFixed(2)}${counterparty ? `, contraparte ${counterparty}` : ''}.`,
    html: emailLayout(title, `Hola ${displayName}, la operación fue registrada correctamente.`, rows),
  };
}

export function mailTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'America/Guayaquil',
  }).format(date);
}

export async function queueMail(connection, message) {
  await connection.query(
    `INSERT INTO email_outbox (to_email, subject, text_body, html_body)
     VALUES (?, ?, ?, ?)`,
    [message.to, message.subject, message.text, message.html],
  );
}

async function deliver(message) {
  if (config.mail.mode === 'console') {
    console.log(`[Correo local] Para: ${message.to_email} | ${message.subject}\n${message.text_body}`);
    return;
  }
  await getTransporter().sendMail({
    from: config.mail.from,
    to: message.to_email,
    subject: message.subject,
    text: message.text_body,
    html: message.html_body,
  });
}

export async function verifyMailer() {
  if (config.mail.mode === 'console') {
    console.log('Correo en modo local: los mensajes se imprimirán en esta terminal.');
    return;
  }
  if (config.mail.mode !== 'smtp') throw new Error('MAIL_MODE debe ser console o smtp');
  if ((!config.mail.service && !config.mail.host) || !config.mail.user || !config.mail.password) {
    throw new Error('Faltan credenciales SMTP para enviar correos');
  }
  await getTransporter().verify();
  console.log('Servidor SMTP verificado.');
}

export async function processMailOutbox() {
  if (processing) return;
  processing = true;
  try {
    const [messages] = await pool.query(
      `SELECT * FROM email_outbox
       WHERE status IN ('pending','failed') AND attempts < ? AND next_attempt_at <= NOW()
       ORDER BY id LIMIT 10`,
      [MAX_ATTEMPTS],
    );
    for (const message of messages) {
      const [claim] = await pool.query(
        `UPDATE email_outbox SET status = 'sending', attempts = attempts + 1
         WHERE id = ? AND status IN ('pending','failed')`,
        [message.id],
      );
      if (!claim.affectedRows) continue;
      try {
        await deliver(message);
        await pool.query("UPDATE email_outbox SET status = 'sent', sent_at = NOW(), last_error = NULL WHERE id = ?", [message.id]);
      } catch (error) {
        const delayMinutes = Math.min(60, 2 ** Number(message.attempts || 0));
        const nextAttempt = new Date(Date.now() + delayMinutes * 60_000);
        await pool.query(
          "UPDATE email_outbox SET status = 'failed', next_attempt_at = ?, last_error = ? WHERE id = ?",
          [nextAttempt, String(error?.message || error).slice(0, 500), message.id],
        );
        console.error(`No se pudo enviar el correo ${message.id}:`, error);
      }
    }
  } finally {
    processing = false;
  }
}

export async function startMailWorker() {
  await pool.query("UPDATE email_outbox SET status = 'pending' WHERE status = 'sending'");
  await pool.query("DELETE FROM email_verification_tokens WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)");
  await pool.query("DELETE FROM email_outbox WHERE status = 'sent' AND sent_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");
  await processMailOutbox();
  const timer = setInterval(() => void processMailOutbox(), POLL_INTERVAL_MS);
  timer.unref();
}
