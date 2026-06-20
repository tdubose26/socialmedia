import type { RequestHandler } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { users, type User } from './db/schema.js';

/**
 * API-style auth guard: returns 401 JSON if the request is unauthenticated.
 * Use this on `/api/*` routes instead of Clerk's `requireAuth()`, which 302-redirects.
 */
export const apiRequireAuth: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      dbUser?: User;
    }
  }
}

/**
 * Looks up (or creates) the local DB row for the currently authenticated Clerk user.
 * Must be used after `requireAuth()` so `userId` is guaranteed to be present.
 */
export const withDbUser: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: 'not_authenticated' });
      return;
    }

    const [existing] = await db.select().from(users).where(eq(users.clerkId, userId));
    if (existing) {
      req.dbUser = existing;
      return next();
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const primaryEmail =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      '';
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

    const [created] = await db
      .insert(users)
      .values({ clerkId: userId, email: primaryEmail, name: fullName })
      .returning();

    req.dbUser = created;
    next();
  } catch (err) {
    next(err);
  }
};
