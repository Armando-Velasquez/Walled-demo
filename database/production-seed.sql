USE `{{DATABASE_NAME}}`;

INSERT INTO assets (id, symbol, name, network, color, price_usd, change_24h) VALUES
  (1, 'BTC', 'Bitcoin', 'Bitcoin', '#F7931A', 64321.12, 2.40),
  (2, 'ETH', 'Ethereum', 'Ethereum', '#627EEA', 3216.42, 3.10),
  (3, 'SOL', 'Solana', 'Solana', '#14F195', 164.55, 5.60),
  (4, 'USDT', 'Tether', 'Ethereum', '#26A17B', 1.00, 0.01),
  (5, 'MATIC', 'Polygon', 'Polygon', '#8247E5', 0.91, -0.42)
ON DUPLICATE KEY UPDATE name = VALUES(name), network = VALUES(network), color = VALUES(color),
  price_usd = VALUES(price_usd), change_24h = VALUES(change_24h);

INSERT INTO dapps (id, name, category, description, color, sort_order) VALUES
  (1, 'Uniswap', 'DeFi', 'Intercambio descentralizado', '#FF4BCD', 1),
  (2, 'Aave', 'DeFi', 'Préstamos y ahorros', '#7B61FF', 2),
  (3, 'Lido', 'DeFi', 'Staking líquido', '#35A6FF', 3),
  (4, 'OpenSea', 'NFT', 'Mercado de coleccionables', '#2081E2', 4),
  (5, 'PancakeSwap', 'DeFi', 'Intercambio multicadena', '#D1884F', 5)
ON DUPLICATE KEY UPDATE description = VALUES(description), color = VALUES(color), sort_order = VALUES(sort_order);

