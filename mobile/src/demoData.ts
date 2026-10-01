import type { Bootstrap } from './types';

export const demoData: Bootstrap = {
  user: { displayName: 'Administrador', email: 'demo@wallet.local', role: 'admin' },
  wallet: {
    id: 1,
    name: 'Mi Billetera',
    address: '0xA18270D9035B4B1238D4F9BA4A2B813E4F',
    owner: 'Administrador',
    onboardingCompleted: true,
    totalUsd: 12432.21,
    change24h: 5.32,
  },
  assets: [
    { id: 1, symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', color: '#F7931A', priceUsd: 64321.12, change24h: 2.4, balance: 0.037814, valueUsd: 2432.21 },
    { id: 2, symbol: 'ETH', name: 'Ethereum', network: 'Ethereum', color: '#627EEA', priceUsd: 3216.42, change24h: 3.1, balance: 1.0015, valueUsd: 3221.14 },
    { id: 3, symbol: 'SOL', name: 'Solana', network: 'Solana', color: '#14F195', priceUsd: 164.55, change24h: 5.6, balance: 7.4758, valueUsd: 1230.1 },
    { id: 4, symbol: 'USDT', name: 'Tether', network: 'Ethereum', color: '#26A17B', priceUsd: 1, change24h: 0.01, balance: 5000, valueUsd: 5000 },
    { id: 5, symbol: 'MATIC', name: 'Polygon', network: 'Polygon', color: '#8247E5', priceUsd: 0.91, change24h: -0.42, balance: 602.02, valueUsd: 548.76 },
  ],
  transactions: [
    { id: 1, type: 'receive', status: 'completed', symbol: 'BTC', color: '#F7931A', amount: 0.0042, amountUsd: 270.15, feeUsd: 0, counterparty: 'bc1q...d8f2', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 2, type: 'swap', status: 'completed', symbol: 'ETH', color: '#627EEA', amount: 0.15, amountUsd: 482.46, feeUsd: 0.72, counterparty: 'USDT:481.74', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, type: 'send', status: 'completed', symbol: 'SOL', color: '#14F195', amount: 1.2, amountUsd: 197.46, feeUsd: 0.02, counterparty: '9xQe...71pA', createdAt: new Date(Date.now() - 259200000).toISOString() },
  ],
  dapps: [
    { id: 1, name: 'Uniswap', category: 'DeFi', description: 'Intercambio descentralizado', color: '#FF4BCD' },
    { id: 2, name: 'Aave', category: 'DeFi', description: 'Préstamos y ahorros', color: '#7B61FF' },
    { id: 3, name: 'Lido', category: 'DeFi', description: 'Staking líquido', color: '#35A6FF' },
    { id: 4, name: 'OpenSea', category: 'NFT', description: 'Mercado de coleccionables', color: '#2081E2' },
    { id: 5, name: 'PancakeSwap', category: 'DeFi', description: 'Intercambio multicadena', color: '#D1884F' },
  ],
  cards: [
    { id: 1, nickname: 'Principal', holderName: 'ADMINISTRADOR', brand: 'Visa', lastFour: '4242', expiryMonth: 12, expiryYear: 2030, color: '#625EFF', isDefault: true },
  ],
};
