USE `{{DATABASE_NAME}}`;

INSERT INTO users (id, display_name, email, password_hash, role) VALUES
  (1, 'Administrador', 'demo@wallet.local', 'scrypt$0a1d836f91db632d1f91b1590027de4c$76713c86636e06d50f4cc41d4b8bf716e13cd2d02db9f71ee836fe04c5eae6ee902aa134589e7e5d2b8131103eb359155c87f8e0a3d5bf8db3001056e2615f19', 'admin')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), password_hash = VALUES(password_hash), role = 'admin';

INSERT INTO wallets (id, user_id, name, address, pin_hash, onboarding_completed) VALUES
  (1, 1, 'Mi Billetera', '0xA18270D9035B4B1238D4F9BA4A2B813E4F', 'scrypt$d1907c53e9595561360439ba7ddb08fb$9bc7aff79b1dab0784f16a6c353304e4f6619e4244da1ddcf4742d8db738d3cabb05f83b9e18a2b7796165f87cf88768f606d3a3e614c6c6bea3dc6269be3653', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address);

INSERT INTO assets (id, symbol, name, network, color, price_usd, change_24h) VALUES
  (1, 'BTC', 'Bitcoin', 'Bitcoin', '#F7931A', 64321.12, 2.40),
  (2, 'ETH', 'Ethereum', 'Ethereum', '#627EEA', 3216.42, 3.10),
  (3, 'SOL', 'Solana', 'Solana', '#14F195', 164.55, 5.60),
  (4, 'USDT', 'Tether', 'Ethereum', '#26A17B', 1.00, 0.01),
  (5, 'MATIC', 'Polygon', 'Polygon', '#8247E5', 0.91, -0.42)
ON DUPLICATE KEY UPDATE name = VALUES(name), network = VALUES(network), color = VALUES(color),
  price_usd = VALUES(price_usd), change_24h = VALUES(change_24h);

INSERT INTO wallet_balances (wallet_id, asset_id, balance, sort_order) VALUES
  (1, 1, 0.0378135518, 1),
  (1, 2, 1.0014660000, 2),
  (1, 3, 7.4755393497, 3),
  (1, 4, 5000.0000000000, 4),
  (1, 5, 603.0329670330, 5)
ON DUPLICATE KEY UPDATE balance = VALUES(balance), sort_order = VALUES(sort_order);

INSERT INTO dapps (id, name, category, description, color, sort_order) VALUES
  (1, 'Uniswap', 'DeFi', 'Intercambio descentralizado', '#FF4BCD', 1),
  (2, 'Aave', 'DeFi', 'Préstamos y ahorros', '#7B61FF', 2),
  (3, 'Lido', 'DeFi', 'Staking líquido', '#35A6FF', 3),
  (4, 'OpenSea', 'NFT', 'Mercado de coleccionables', '#2081E2', 4),
  (5, 'PancakeSwap', 'DeFi', 'Intercambio multicadena', '#D1884F', 5)
ON DUPLICATE KEY UPDATE description = VALUES(description), color = VALUES(color), sort_order = VALUES(sort_order);

INSERT INTO payment_cards (id, wallet_id, nickname, holder_name, brand, last_four, expiry_month, expiry_year, color, is_default)
VALUES (1, 1, 'Principal', 'ADMINISTRADOR', 'Visa', '4242', 12, 2030, '#625EFF', TRUE)
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), holder_name = VALUES(holder_name), color = VALUES(color), is_default = TRUE;

INSERT INTO transactions (wallet_id, asset_id, related_asset_id, type, status, amount, amount_usd, fee_usd, counterparty, created_at)
SELECT 1, 1, NULL, 'receive', 'completed', 0.0042, 270.15, 0, 'bc1q...d8f2', NOW() - INTERVAL 2 HOUR
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE wallet_id = 1);
INSERT INTO transactions (wallet_id, asset_id, related_asset_id, type, status, amount, amount_usd, fee_usd, counterparty, created_at)
SELECT 1, 2, 4, 'swap', 'completed', 0.15, 482.46, 0.72, 'USDT:481.74', NOW() - INTERVAL 1 DAY
WHERE (SELECT COUNT(*) FROM transactions WHERE wallet_id = 1) = 1;
INSERT INTO transactions (wallet_id, asset_id, related_asset_id, type, status, amount, amount_usd, fee_usd, counterparty, created_at)
SELECT 1, 3, NULL, 'send', 'completed', 1.2, 197.46, 0.02, '9xQe...71pA', NOW() - INTERVAL 3 DAY
WHERE (SELECT COUNT(*) FROM transactions WHERE wallet_id = 1) = 2;
