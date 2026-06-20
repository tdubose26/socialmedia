import '../env.js';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, pool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsFolder = path.resolve(__dirname, '../../drizzle');

console.log(`Applying migrations from ${migrationsFolder}...`);
await migrate(db, { migrationsFolder });
console.log('Migrations complete.');
await pool.end();
