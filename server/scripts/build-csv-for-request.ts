import '../src/env.js';
import { eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { db, pool } from '../src/db/index.js';
import { contentRequests } from '../src/db/schema.js';
import { buildGhlCsv } from '../src/csv/buildCsv.js';
import type { GeneratedPost } from '../src/ai/generate.js';

const requestId = process.argv[2];
if (!requestId) {
  console.error('Usage: tsx build-csv-for-request.ts <requestId>');
  process.exit(1);
}

const [row] = await db.select().from(contentRequests).where(eq(contentRequests.id, requestId));
if (!row) {
  console.error('No row for', requestId);
  process.exit(1);
}

const gp = row.generatedPosts as { posts?: GeneratedPost[] } | null;
const posts = gp?.posts ?? [];
if (posts.length === 0) {
  console.error('Row has no generatedPosts to build from.');
  process.exit(1);
}

const csv = buildGhlCsv(row.industry ?? 'content', posts);
console.log(`Built CSV: ${csv.filename}`);
console.log(`  rows: ${csv.rowCount} data + 2 headers`);
console.log(`  size: ${csv.text.length} bytes`);

// Persist back to the DB.
await db
  .update(contentRequests)
  .set({
    csvFilename: csv.filename,
    csvContent: csv.text,
    csvBase64: csv.base64,
    status: 'completed',
    progressStage: 'completed',
    completedAt: new Date(),
  })
  .where(eq(contentRequests.id, requestId));
console.log('DB row updated: status=completed.');

// Also drop a copy on the Desktop so the user can open it directly.
const desktopPath = path.join(os.homedir(), 'Desktop', csv.filename);
fs.writeFileSync(desktopPath, csv.text, 'utf8');
console.log(`Wrote local copy: ${desktopPath}`);

await pool.end();
