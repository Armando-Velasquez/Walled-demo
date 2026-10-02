export type Asset = {
  id: number;
  symbol: string;
  name: string;
  network: string;
  color: string;
  priceUsd: number;
  change24h: number;
  balance: number;
  valueUsd: number;
};

export type Wallet = {
  id: number;
  name: string;
  address: string;
  owner: string;
  onboardingCompleted: boolean;
  totalUsd: number;
  change24h: number;
};

export type Transaction = {
  id: number;
  type: 'send' | 'receive' | 'swap' | 'buy';
  status: 'pending' | 'completed' | 'failed';
  symbol: string;
  color: string;
  amount: number;
  amountUsd: number;
  feeUsd: number;
  counterparty?: string;
  createdAt: string;
};

export type Dapp = {
  id: number;
  name: string;
  category: string;
  description: string;
  color: string;
};

export type PaymentCard = {
  id: number;
  nickname: string;
  holderName: string;
  brand: 'Visa' | 'Mastercard' | 'Amex';
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  color: string;
  isDefault: boolean;
};

export type Bootstrap = {
  user: User;
  wallet: Wallet;
  assets: Asset[];
  transactions: Transaction[];
  dapps: Dapp[];
  cards: PaymentCard[];
};

export type User = {
  displayName: string;
  email: string;
  role: 'admin' | 'user';
};

export type AdminUser = User & {
  id: number;
  address: string;
  totalUsd: number;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: User & { id: number };
};

export type RegistrationResponse = {
  requiresEmailVerification: true;
  email: string;
  expiresInMinutes: number;
};

export type AppScreen =
  | 'onboarding1'
  | 'onboarding2'
  | 'onboarding3'
  | 'welcome'
  | 'login'
  | 'register'
  | 'verifyEmail'
  | 'create'
  | 'recovery'
  | 'pin'
  | 'home'
  | 'asset'
  | 'send'
  | 'receive'
  | 'swap'
  | 'explore'
  | 'activity'
  | 'profile'
  | 'admin'
  | 'cards'
  | 'buy';
