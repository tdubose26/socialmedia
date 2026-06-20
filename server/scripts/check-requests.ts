import '../src/env.js';
import { desc } from 'drizzle-orm';
import { db, pool } from '../src/db/index.js';
import { contentRequests } from '../src/db/schema.js';

const rows = await db
  .select()
  .from(contentRequests)
  .orderBy(desc(contentRequests.createdAt))
  .limit(5);

console.log(`Latest ${rows.length} content_requests:\n`);
for (const r of rows) {
  console.log({
    id: r.id,
    status: r.status,
    progressStage: r.progressStage,
    industry: r.industry,
    brandTone: r.brandTone,
    callToAction: r.callToAction,
    selectedTopics: r.selectedTopics,
    postingDate: r.postingDate,
    platformSettings: r.platformSettings,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
  });
}
await pool.end();
