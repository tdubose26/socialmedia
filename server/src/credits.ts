import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { users } from './db/schema.js';

/** Spec: 4 credits for 5 days of content, 8 credits for 10 days. */
export function creditCostForDayLimit(dayLimit: number): number {
  return dayLimit === 10 ? 8 : 4;
}

/**
 * Atomically deducts credits only if the user still has at least `amount`.
 * Returns true if the deduction happened, false if the balance was too low.
 */
export async function deductCredits(userId: number, amount: number): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ credits: sql`${users.credits} - ${amount}` })
    .where(and(eq(users.id, userId), gte(users.credits, amount)))
    .returning({ id: users.id });
  return result.length > 0;
}
