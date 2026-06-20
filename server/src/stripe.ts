import Stripe from 'stripe';
import { eq, sql } from 'drizzle-orm';
import { requireEnv } from './env.js';
import { db } from './db/index.js';
import { users, type User } from './db/schema.js';

export const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'));

/**
 * Credit packs. Pricing is a placeholder (TBD) — change `amountCents` freely.
 * `credits` follows the spec: 4 credits for 5 days, 8 credits for 10 days.
 */
export type CreditPack = {
  id: string;
  label: string;
  description: string;
  credits: number;
  amountCents: number;
};

export const CREDIT_PACKS: Record<string, CreditPack> = {
  '5day': {
    id: '5day',
    label: '5-Day Pack',
    description: '4 credits — enough for 5 days of content',
    credits: 4,
    amountCents: 1000,
  },
  '10day': {
    id: '10day',
    label: '10-Day Pack',
    description: '8 credits — enough for 10 days of content',
    credits: 8,
    amountCents: 1800,
  },
};

/**
 * Returns the user's Stripe customer id, creating the customer on first use
 * and persisting the id back to the users row.
 */
export async function ensureStripeCustomer(user: User): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { dbUserId: String(user.id), clerkId: user.clerkId },
  });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, user.id));

  return customer.id;
}

/** Atomically adds credits to a user. */
export async function addCredits(userId: number, credits: number): Promise<void> {
  await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${credits}` })
    .where(eq(users.id, userId));
}
