import { config } from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set in .env');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
});
