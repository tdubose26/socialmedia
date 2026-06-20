import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { requireEnv } from '../env.js';
import * as schema from './schema.js';

// In a Node (non-edge) runtime, the Neon serverless driver needs a WebSocket
// implementation. The browser ships one natively; Node does not.
neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: requireEnv('DATABASE_URL') });
export const db = drizzle(pool, { schema });

export { schema };
