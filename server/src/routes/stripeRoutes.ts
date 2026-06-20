import type { Request, Response } from 'express';
import {
  stripe,
  CREDIT_PACKS,
  ensureStripeCustomer,
  addCredits,
} from '../stripe.js';

const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

/** GET /api/credit-packs — public list of packs for the UI. */
export function listCreditPacks(_req: Request, res: Response) {
  res.json({ packs: Object.values(CREDIT_PACKS) });
}

/** POST /api/stripe/checkout — body: { packId }. Returns { url } to redirect to. */
export async function createCheckout(req: Request, res: Response) {
  const user = req.dbUser!;
  const { packId } = req.body ?? {};
  const pack = packId ? CREDIT_PACKS[packId] : undefined;
  if (!pack) {
    res.status(400).json({ error: 'invalid_pack' });
    return;
  }

  const customerId = await ensureStripeCustomer(user);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pack.amountCents,
          product_data: {
            name: pack.label,
            description: pack.description,
          },
        },
      },
    ],
    // Metadata the webhook reads to know who to credit and by how much.
    metadata: {
      dbUserId: String(user.id),
      packId: pack.id,
      credits: String(pack.credits),
    },
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=cancel`,
  });

  res.json({ url: session.url });
}

/** POST /api/stripe/portal — returns { url } to the Stripe billing portal. */
export async function createPortal(req: Request, res: Response) {
  const user = req.dbUser!;
  const customerId = await ensureStripeCustomer(user);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/settings`,
  });

  res.json({ url: session.url });
}

/**
 * POST /api/stripe/webhook — Stripe calls this server-to-server.
 * Must receive the RAW request body (registered with express.raw before express.json).
 */
export async function stripeWebhook(req: Request, res: Response) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set — cannot verify webhook.');
    res.status(500).json({ error: 'webhook_not_configured' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    res.status(400).json({ error: 'missing_signature' });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('Webhook signature verification failed:', message);
    res.status(400).json({ error: 'invalid_signature' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const dbUserId = Number(session.metadata?.dbUserId);
    const credits = Number(session.metadata?.credits);

    if (Number.isFinite(dbUserId) && Number.isFinite(credits) && credits > 0) {
      await addCredits(dbUserId, credits);
      console.log(`Granted ${credits} credits to user ${dbUserId} (session ${session.id}).`);
    } else {
      console.error('checkout.session.completed missing valid metadata:', session.metadata);
    }
  }

  // Acknowledge receipt so Stripe stops retrying.
  res.json({ received: true });
}
