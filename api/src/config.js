import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4100),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wallet_demo',
    decimalNumbers: true,
    connectionLimit: 8,
  },
  mail: {
    mode: process.env.MAIL_MODE || 'console',
    service: process.env.SMTP_SERVICE || '',
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || 'Wallet <no-reply@wallet.local>',
    verificationSecret: process.env.EMAIL_TOKEN_SECRET || 'wallet-local-verification-secret',
  },
};
