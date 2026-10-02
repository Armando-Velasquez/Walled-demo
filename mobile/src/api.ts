import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AdminUser, AuthResponse, Bootstrap, KycProfile, RegistrationResponse } from './types';

const TOKEN_KEY = 'wallet_demo_session';
const defaultBaseUrl = Platform.select({ android: 'http://10.0.2.2:4100', default: 'http://localhost:4100' });
const baseUrl = process.env.EXPO_PUBLIC_API_URL || defaultBaseUrl;
let authToken = '';

export class ApiRequestError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options?: RequestInit, authenticated = true): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options?.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiRequestError(data.message || 'No se pudo completar la operación', response.status, data.code);
  return data as T;
}

async function saveSession(result: AuthResponse) {
  authToken = result.token;
  await SecureStore.setItemAsync(TOKEN_KEY, result.token);
  return result;
}

export async function restoreSession() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return false;
  authToken = token;
  try {
    await request('/api/v1/auth/me');
    return true;
  } catch {
    authToken = '';
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return false;
  }
}

export async function loadWallet(): Promise<Bootstrap> {
  const wallet = await request<Bootstrap>('/api/v1/bootstrap');
  return { ...wallet, cards: wallet.cards || [] };
}

export const walletApi = {
  login: async (body: { email: string; password: string }) =>
    saveSession(await request<AuthResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }, false)),
  register: async (body: { displayName: string; email: string; password: string; pin: string }) =>
    request<RegistrationResponse>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }, false),
  verifyEmail: async (body: { email: string; code: string }) =>
    saveSession(await request<AuthResponse>('/api/v1/auth/verify-email', { method: 'POST', body: JSON.stringify(body) }, false)),
  resendVerification: (email: string) =>
    request<{ ok: true; message: string }>('/api/v1/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }, false),
  logout: async () => {
    try { await request('/api/v1/auth/logout', { method: 'POST' }); } finally {
      authToken = '';
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
  send: (body: { symbol: string; amount: number; recipient: string }) =>
    request('/api/v1/transactions/send', { method: 'POST', body: JSON.stringify(body) }),
  swap: (body: { fromSymbol: string; toSymbol: string; amount: number }) =>
    request<{ received: number; feeUsd: number }>('/api/v1/swap', { method: 'POST', body: JSON.stringify(body) }),
  buy: (body: { symbol: string; usdAmount: number; cardId: number }) =>
    request<{ received: number; feeUsd: number }>('/api/v1/transactions/buy', { method: 'POST', body: JSON.stringify(body) }),
  addPaymentCard: (body: { nickname: string; holderName: string; brand: string; lastFour: string; expiryMonth: number; expiryYear: number; color: string }) =>
    request<{ id: number; isDefault: boolean }>('/api/v1/payment-cards', { method: 'POST', body: JSON.stringify(body) }),
  setDefaultPaymentCard: (cardId: number) =>
    request<{ ok: true }>(`/api/v1/payment-cards/${cardId}/default`, { method: 'PUT' }),
  onboarding: (completed: boolean) =>
    request('/api/v1/onboarding', { method: 'PUT', body: JSON.stringify({ completed }) }),
  getKyc: () => request<{ kyc: KycProfile }>('/api/v1/kyc'),
  submitKyc: (body: Omit<KycProfile, 'status'>) => request<{ kyc: KycProfile }>('/api/v1/kyc', { method: 'POST', body: JSON.stringify(body) }),
  adminKyc: () => request<{ requests: KycProfile[] }>('/api/v1/admin/kyc'),
  adminReviewKyc: (userId: number, body: { status: 'approved' | 'rejected'; riskLevel: 'low' | 'medium' | 'high'; reviewNote: string }) =>
    request<{ displayName: string; status: string }>(`/api/v1/admin/kyc/${userId}/review`, { method: 'POST', body: JSON.stringify(body) }),
  adminUsers: () => request<{ users: AdminUser[] }>('/api/v1/admin/users'),
  adminFund: (body: { userId: number; symbol: string; amount: number }) =>
    request<{ recipientName: string }>('/api/v1/admin/fund', { method: 'POST', body: JSON.stringify(body) }),
  adminVerifyUser: (userId: number) =>
    request<{ displayName: string; alreadyVerified: boolean }>(`/api/v1/admin/users/${userId}/verify`, { method: 'POST' }),
  adminResetPassword: (userId: number) =>
    request<{ displayName: string; email: string }>(`/api/v1/admin/users/${userId}/reset-password`, { method: 'POST' }),
  adminDeleteUser: (userId: number) =>
    request<{ displayName: string }>(`/api/v1/admin/users/${userId}`, { method: 'DELETE' }),
};
