import './env.js';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { clerkMiddleware } from '@clerk/express';
import { apiRequireAuth, withDbUser } from './auth.js';
import { requireEnv } from './env.js';
import {
  listCreditPacks,
  createCheckout,
  createPortal,
  stripeWebhook,
} from './routes/stripeRoutes.js';
import {
  createContentRequest,
  getContentStatus,
  getContentCsv,
  listContentHistory,
} from './routes/contentRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// IMPORTANT: the Stripe webhook needs the RAW request body to verify its signature.
// It must be registered BEFORE express.json(), which would otherwise consume/parse
// the body and break verification.
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook,
);

// All other routes use parsed JSON bodies.
app.use(express.json({ limit: '2mb' }));

// Attach Clerk auth context to every request (does NOT block unauthenticated requests).
app.use(
  clerkMiddleware({
    publishableKey: requireEnv('VITE_CLERK_PUBLISHABLE_KEY'),
    secretKey: requireEnv('CLERK_SECRET_KEY'),
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV ?? 'development' });
});

// Protected: returns the DB row for the current user (creating it on first sign-in).
app.get('/api/me', apiRequireAuth, withDbUser, (req, res) => {
  res.json({ user: req.dbUser });
});

// --- Stripe ---
app.get('/api/credit-packs', listCreditPacks);
app.post('/api/stripe/checkout', apiRequireAuth, withDbUser, createCheckout);
app.post('/api/stripe/portal', apiRequireAuth, withDbUser, createPortal);

// --- Content generation ---
app.post('/api/content-generate', apiRequireAuth, withDbUser, createContentRequest);
app.get('/api/content-status/:requestId', apiRequireAuth, withDbUser, getContentStatus);
app.get('/api/content-csv/:requestId', apiRequireAuth, withDbUser, getContentCsv);
app.get('/api/content-history', apiRequireAuth, withDbUser, listContentHistory);

if (isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
