import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth, revokeSession } from './auth.js';
import {
  createBuy,
  createPaymentCard,
  createTransfer,
  createSwap,
  deleteUserForAdmin,
  getAsset,
  getBootstrap,
  getKycProfile,
  fundUser,
  listUsersForAdmin,
  listKycForAdmin,
  loginUser,
  registerUser,
  reviewKycForAdmin,
  resetUserPasswordForAdmin,
  resendEmailVerification,
  setDefaultPaymentCard,
  submitKycProfile,
  updateOnboarding,
  verifyUserForAdmin,
  verifyEmail,
} from './repository.js';

export const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '32kb' }));

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const packagedApkPath = path.resolve(sourceDirectory, '../public/downloads/Wallet-Android.apk');
const localApkPath = path.resolve(sourceDirectory, '../../artifacts/Wallet-demo-android.apk');

function getAvailableApkPath() {
  if (fs.existsSync(packagedApkPath)) return packagedApkPath;
  if (fs.existsSync(localApkPath)) return localApkPath;
  return null;
}

const asyncRoute = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response)).catch(next);

const processingDelay = () => new Promise((resolve) => setTimeout(resolve, 850));

function requirePositiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw Object.assign(new Error(`${field} debe ser mayor que cero`), { status: 400 });
  }
  return number;
}

function requireText(value, field, minimum = 1) {
  const text = String(value || '').trim();
  if (text.length < minimum) throw Object.assign(new Error(`${field} no es válido`), { status: 400 });
  return text;
}

function requireAdmin(request, response, next) {
  if (request.auth.role !== 'admin') return response.status(403).json({ message: 'Acceso exclusivo para administración' });
  next();
}

app.get('/health', asyncRoute(async (_request, response) => {
  response.json({ ok: true, service: 'wallet-demo-api', database: 'connected' });
}));

app.get('/', (_request, response) => {
  response.json({
    ok: true,
    service: 'Wallet REST API',
    health: '/health',
    androidApk: '/downloads/wallet-android.apk',
  });
});

app.get('/downloads/wallet-android.apk', (request, response, next) => {
  const apkPath = getAvailableApkPath();
  if (!apkPath) {
    return response.status(404).json({ message: 'El APK todavía no está disponible' });
  }

  response.setHeader('Cache-Control', 'no-cache');
  return response.download(apkPath, 'Wallet-Android.apk', (error) => {
    if (error && !response.headersSent) next(error);
  });
});

app.post('/api/v1/auth/register', asyncRoute(async (request, response) => {
  const displayName = requireText(request.body.displayName, 'Nombre', 2);
  const email = requireText(request.body.email, 'Correo', 5).toLowerCase();
  const password = requireText(request.body.password, 'Contraseña', 8);
  const pin = String(request.body.pin || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ message: 'Ingresa un correo válido' });
  if (!/^\d{6}$/.test(pin)) return response.status(400).json({ message: 'El PIN debe tener 6 dígitos' });
  await processingDelay();
  response.status(201).json(await registerUser({ displayName, email, password, pin }));
}));

app.post('/api/v1/auth/login', asyncRoute(async (request, response) => {
  const email = requireText(request.body.email, 'Correo', 5);
  const password = requireText(request.body.password, 'Contraseña', 1);
  await processingDelay();
  response.json(await loginUser({
    email,
    password,
    ip: request.ip || request.socket.remoteAddress || 'No disponible',
    userAgent: String(request.headers['user-agent'] || 'No disponible').slice(0, 240),
  }));
}));

app.post('/api/v1/auth/verify-email', asyncRoute(async (request, response) => {
  const email = requireText(request.body.email, 'Correo', 5);
  const code = String(request.body.code || '').trim();
  if (!/^\d{6}$/.test(code)) return response.status(400).json({ message: 'El código debe tener 6 dígitos' });
  response.json(await verifyEmail({ email, code }));
}));

app.post('/api/v1/auth/resend-verification', asyncRoute(async (request, response) => {
  const email = requireText(request.body.email, 'Correo', 5);
  await resendEmailVerification(email);
  response.json({ ok: true, message: 'Si la cuenta está pendiente, recibirás un código nuevo.' });
}));

app.use('/api/v1', requireAuth);

app.get('/api/v1/auth/me', asyncRoute(async (request, response) => {
  response.json({
    user: {
      id: request.auth.user_id,
      displayName: request.auth.display_name,
      email: request.auth.email,
      role: request.auth.role,
    },
  });
}));

app.post('/api/v1/auth/logout', asyncRoute(async (request, response) => {
  await revokeSession(request.auth.token);
  response.json({ ok: true });
}));

app.get('/api/v1/bootstrap', asyncRoute(async (request, response) => {
  response.json(await getBootstrap(request.auth.wallet_id));
}));

app.get('/api/v1/assets/:symbol', asyncRoute(async (request, response) => {
  const asset = await getAsset(request.auth.wallet_id, request.params.symbol);
  if (!asset) return response.status(404).json({ message: 'Activo no encontrado' });
  response.json(asset);
}));

app.post('/api/v1/transactions/send', asyncRoute(async (request, response) => {
  const amount = requirePositiveNumber(request.body.amount, 'El monto');
  const symbol = String(request.body.symbol || '').toUpperCase();
  const recipient = String(request.body.recipient || '').trim();
  if (recipient.length < 5) return response.status(400).json({ message: 'Ingresa el correo o dirección del destinatario' });
  await processingDelay();
  response.status(201).json(await createTransfer({ walletId: request.auth.wallet_id, symbol, amount, recipient }));
}));

app.post('/api/v1/transactions/buy', asyncRoute(async (request, response) => {
  const usdAmount = requirePositiveNumber(request.body.usdAmount, 'El monto');
  if (usdAmount > 10000) return response.status(400).json({ message: 'El máximo por compra es $10,000' });
  const symbol = String(request.body.symbol || '').toUpperCase();
  const cardId = requirePositiveNumber(request.body.cardId, 'La tarjeta');
  await processingDelay();
  response.status(201).json(await createBuy({ walletId: request.auth.wallet_id, symbol, usdAmount, cardId }));
}));

app.post('/api/v1/payment-cards', asyncRoute(async (request, response) => {
  const nickname = requireText(request.body.nickname, 'Alias', 2);
  const holderName = requireText(request.body.holderName, 'Titular', 2);
  const brand = String(request.body.brand || 'Visa');
  const lastFour = String(request.body.lastFour || '');
  const expiryMonth = Number(request.body.expiryMonth);
  const expiryYear = Number(request.body.expiryYear);
  const color = /^#[0-9A-F]{6}$/i.test(request.body.color) ? request.body.color : '#625EFF';
  const currentYear = new Date().getFullYear();
  if (!['Visa', 'Mastercard', 'Amex'].includes(brand)) return response.status(400).json({ message: 'Marca no válida' });
  if (!/^\d{4}$/.test(lastFour)) return response.status(400).json({ message: 'Ingresa cuatro dígitos ficticios' });
  if (!Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) return response.status(400).json({ message: 'Mes de expiración no válido' });
  if (!Number.isInteger(expiryYear) || expiryYear < currentYear || expiryYear > currentYear + 15) return response.status(400).json({ message: 'Año de expiración no válido' });
  response.status(201).json(await createPaymentCard({ walletId: request.auth.wallet_id, nickname, holderName, brand, lastFour, expiryMonth, expiryYear, color }));
}));

app.put('/api/v1/payment-cards/:id/default', asyncRoute(async (request, response) => {
  const cardId = requirePositiveNumber(request.params.id, 'La tarjeta');
  response.json(await setDefaultPaymentCard({ walletId: request.auth.wallet_id, cardId }));
}));

app.post('/api/v1/swap', asyncRoute(async (request, response) => {
  const amount = requirePositiveNumber(request.body.amount, 'El monto');
  const fromSymbol = String(request.body.fromSymbol || '').toUpperCase();
  const toSymbol = String(request.body.toSymbol || '').toUpperCase();
  if (fromSymbol === toSymbol) return response.status(400).json({ message: 'Selecciona activos diferentes' });
  await processingDelay();
  response.status(201).json(await createSwap({ walletId: request.auth.wallet_id, fromSymbol, toSymbol, amount }));
}));

app.put('/api/v1/onboarding', asyncRoute(async (request, response) => {
  await updateOnboarding(request.auth.wallet_id, Boolean(request.body.completed));
  response.json({ ok: true });
}));

app.get('/api/v1/kyc', asyncRoute(async (request, response) => {
  response.json({ kyc: await getKycProfile(request.auth.user_id) });
}));

app.post('/api/v1/kyc', asyncRoute(async (request, response) => {
  const fullLegalName = requireText(request.body.fullLegalName, 'Nombre legal', 3);
  const birthDate = requireText(request.body.birthDate, 'Fecha de nacimiento', 10);
  const nationality = requireText(request.body.nationality, 'Nacionalidad', 2);
  const residenceCountry = requireText(request.body.residenceCountry, 'País de residencia', 2);
  const residentialAddress = requireText(request.body.residentialAddress, 'Dirección', 8);
  const documentType = String(request.body.documentType || '');
  const documentNumber = requireText(request.body.documentNumber, 'Número de documento', 5);
  const documentReference = requireText(request.body.documentReference, 'Referencia del documento', 3);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(Date.parse(`${birthDate}T00:00:00Z`))) return response.status(400).json({ message: 'Usa una fecha válida con formato AAAA-MM-DD' });
  const age = (Date.now() - Date.parse(`${birthDate}T00:00:00Z`)) / 31_557_600_000;
  if (age < 18 || age > 120) return response.status(400).json({ message: 'La persona debe ser mayor de edad' });
  if (!['national_id', 'passport', 'driver_license'].includes(documentType)) return response.status(400).json({ message: 'Tipo de documento no válido' });
  response.status(201).json({ kyc: await submitKycProfile(request.auth.user_id, { fullLegalName, birthDate, nationality, residenceCountry, residentialAddress, documentType, documentNumber, documentReference }) });
}));

app.get('/api/v1/admin/users', requireAdmin, asyncRoute(async (_request, response) => {
  response.json({ users: await listUsersForAdmin() });
}));

app.get('/api/v1/admin/kyc', requireAdmin, asyncRoute(async (_request, response) => {
  response.json({ requests: await listKycForAdmin() });
}));

app.post('/api/v1/admin/kyc/:id/review', requireAdmin, asyncRoute(async (request, response) => {
  const userId = requirePositiveNumber(request.params.id, 'El usuario');
  const status = String(request.body.status || '');
  const riskLevel = String(request.body.riskLevel || '');
  const reviewNote = String(request.body.reviewNote || '').trim().slice(0, 500);
  if (!['approved', 'rejected'].includes(status)) return response.status(400).json({ message: 'Decisión KYC no válida' });
  if (!['low', 'medium', 'high'].includes(riskLevel)) return response.status(400).json({ message: 'Selecciona un nivel de riesgo' });
  if (status === 'rejected' && reviewNote.length < 5) return response.status(400).json({ message: 'Indica el motivo del rechazo' });
  response.json(await reviewKycForAdmin({ userId, reviewerId: request.auth.user_id, status, riskLevel, reviewNote }));
}));

app.post('/api/v1/admin/fund', requireAdmin, asyncRoute(async (request, response) => {
  const userId = requirePositiveNumber(request.body.userId, 'El usuario');
  const amount = requirePositiveNumber(request.body.amount, 'El monto');
  const symbol = String(request.body.symbol || '').toUpperCase();
  await processingDelay();
  response.status(201).json(await fundUser({ userId, symbol, amount, adminEmail: request.auth.email }));
}));

app.post('/api/v1/admin/users/:id/verify', requireAdmin, asyncRoute(async (request, response) => {
  const userId = requirePositiveNumber(request.params.id, 'El usuario');
  response.json(await verifyUserForAdmin(userId));
}));

app.post('/api/v1/admin/users/:id/reset-password', requireAdmin, asyncRoute(async (request, response) => {
  const userId = requirePositiveNumber(request.params.id, 'El usuario');
  response.json(await resetUserPasswordForAdmin(userId));
}));

app.delete('/api/v1/admin/users/:id', requireAdmin, asyncRoute(async (request, response) => {
  const userId = requirePositiveNumber(request.params.id, 'El usuario');
  response.json(await deleteUserForAdmin(userId));
}));

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.status || 500).json({ message: error.message || 'Error interno', ...(error.code ? { code: error.code } : {}) });
});
