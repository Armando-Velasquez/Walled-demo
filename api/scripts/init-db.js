import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const schema = await fs.readFile(path.join(directory, '../../database/schema.sql'), 'utf8');
const seed = await fs.readFile(path.join(directory, '../../database/seed.sql'), 'utf8');
const connection = await mysql.createConnection({
  ...config.db,
  database: undefined,
  multipleStatements: true,
});

if (process.argv.includes('--reset')) {
  await connection.query(`DROP DATABASE IF EXISTS \`${config.db.database}\``);
}
await connection.query(schema.replaceAll('{{DATABASE_NAME}}', config.db.database));
await connection.query(seed.replaceAll('{{DATABASE_NAME}}', config.db.database));
await connection.end();
console.log(`Base de datos ${config.db.database} inicializada.`);

