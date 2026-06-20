import '../src/env.js';
import { db, pool } from '../src/db/index.js';
import { users } from '../src/db/schema.js';

const rows = await db.select().from(users);
console.log(`users table (${rows.length} row${rows.length === 1 ? '' : 's'}):`);
for (const u of rows) console.log(u);
await pool.end();
