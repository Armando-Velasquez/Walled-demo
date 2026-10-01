import { app } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
import { startMailWorker, verifyMailer } from './mailer.js';

await pool.query('SELECT 1');
await verifyMailer();
await startMailWorker();
app.listen(config.port, '0.0.0.0', () => {
  console.log(`Wallet API disponible en http://0.0.0.0:${config.port}`);
});
