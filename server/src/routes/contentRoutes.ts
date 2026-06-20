import type { Request, Response } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { contentRequests } from '../db/schema.js';
import { startContentJob } from '../jobs/contentJob.js';
import { creditCostForDayLimit } from '../credits.js';

const AI_MODELS = ['chatgpt', 'claude'];
const PLATFORMS = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'TikTok',
  'YouTube',
  'Pinterest',
  'Google GBP',
  'Community',
];
const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

/**
 * POST /api/content-generate
 * Validates the wizard payload, creates a content_requests row (status "pending"),
 * kicks off the background job (fire-and-forget), and returns { requestId } at once.
 */
export async function createContentRequest(req: Request, res: Response) {
  const body = (req.body ?? {}) as Record<string, unknown>;

  const industry = String(body.industry ?? '').trim();
  const brandTone = String(body.brandTone ?? '').trim();
  const callToAction = String(body.callToAction ?? '').trim();
  const topics = asStringArray(body.topics);
  const aiModel = typeof body.aiModel === 'string' ? body.aiModel : '';
  const representation = asStringArray(body.representation);
  const location = asStringArray(body.location);
  const outfitStyle = asStringArray(body.outfitStyle);
  const platforms = asStringArray(body.platforms);
  const postingDate = String(body.postingDate ?? '').trim();
  const dayLimit = body.dayLimit;
  const times = asStringArray(body.times);

  const errors: string[] = [];
  if (!industry) errors.push('industry is required');
  if (!brandTone) errors.push('brandTone is required');
  if (!AI_MODELS.includes(aiModel)) errors.push('aiModel must be "chatgpt" or "claude"');
  if (platforms.length === 0) errors.push('at least one platform is required');
  if (platforms.some((p) => !PLATFORMS.includes(p))) errors.push('one or more platforms are unknown');
  if (!DATE_RE.test(postingDate) || postingDate < todayString())
    errors.push('postingDate must be today or later (YYYY-MM-DD)');
  if (dayLimit !== 5 && dayLimit !== 10) errors.push('dayLimit must be 5 or 10');
  if (times.length === 0 || times.some((t) => !TIME_RE.test(t)))
    errors.push('at least one valid posting time (HH:MM) is required');

  if (errors.length > 0) {
    res.status(400).json({ error: 'validation_failed', details: errors });
    return;
  }

  // Credit pre-check (charge-on-success: we only verify the balance here; the
  // background job deducts after a successful generation).
  const creditCost = creditCostForDayLimit(dayLimit as number);
  if (req.dbUser!.credits < creditCost) {
    res.status(402).json({
      error: 'insufficient_credits',
      needed: creditCost,
      have: req.dbUser!.credits,
    });
    return;
  }

  const [row] = await db
    .insert(contentRequests)
    .values({
      userId: req.dbUser!.id,
      industry,
      selectedTopics: topics,
      status: 'pending',
      brandTone,
      callToAction: callToAction || null,
      postingDate,
      platformSettings: {
        aiModel,
        platforms,
        dayLimit,
        times,
        representation,
        location,
        outfitStyle,
      },
      progressStage: 'queued',
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    })
    .returning({ id: contentRequests.id });

  // Fire-and-forget: do NOT await — the job runs independently of this response.
  startContentJob(row.id);

  res.status(202).json({ requestId: row.id });
}

/**
 * GET /api/content-status/:requestId
 * Lightweight poll target. Does NOT return the base64 payload — that would
 * waste bandwidth on every 3-second poll. Use /api/content-csv to download.
 */
export async function getContentStatus(req: Request, res: Response) {
  const requestId = String(req.params.requestId);
  const [row] = await db
    .select()
    .from(contentRequests)
    .where(eq(contentRequests.id, requestId));
  // Hide existence from non-owners: 404, not 403.
  if (!row || row.userId !== req.dbUser!.id) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({
    id: row.id,
    status: row.status,
    progressStage: row.progressStage,
    errorMessage: row.errorMessage,
    csvFilename: row.csvFilename,
    completedAt: row.completedAt,
  });
}

/**
 * GET /api/content-csv/:requestId
 * Returns the stored CSV as { filename, base64 }. Client decodes and downloads.
 * Only available once the request has reached "completed".
 */
export async function getContentCsv(req: Request, res: Response) {
  const requestId = String(req.params.requestId);
  const [row] = await db
    .select()
    .from(contentRequests)
    .where(eq(contentRequests.id, requestId));
  if (!row || row.userId !== req.dbUser!.id) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  if (row.status !== 'completed' || !row.csvBase64 || !row.csvFilename) {
    res.status(409).json({ error: 'not_ready', status: row.status });
    return;
  }
  res.json({ filename: row.csvFilename, base64: row.csvBase64 });
}

/**
 * GET /api/content-history
 * Returns the current user's past content requests (newest first).
 * Lightweight payload: omits csvBase64 / csvContent / generatedPosts blobs.
 */
export async function listContentHistory(req: Request, res: Response) {
  const rows = await db
    .select({
      id: contentRequests.id,
      status: contentRequests.status,
      progressStage: contentRequests.progressStage,
      industry: contentRequests.industry,
      createdAt: contentRequests.createdAt,
      completedAt: contentRequests.completedAt,
      errorMessage: contentRequests.errorMessage,
      csvFilename: contentRequests.csvFilename,
      platformSettings: contentRequests.platformSettings,
      generatedPosts: contentRequests.generatedPosts,
    })
    .from(contentRequests)
    .where(eq(contentRequests.userId, req.dbUser!.id))
    .orderBy(desc(contentRequests.createdAt))
    .limit(50);

  const items = rows.map((row) => {
    const ps = (row.platformSettings ?? {}) as Record<string, unknown>;
    const platforms = Array.isArray(ps.platforms) ? (ps.platforms as string[]) : [];
    const dayLimit = ps.dayLimit === 10 ? 10 : 5;
    const gp = row.generatedPosts as { posts?: unknown[] } | null;
    const postCount = Array.isArray(gp?.posts) ? gp!.posts!.length : 0;
    const hasCsv = Boolean(row.csvFilename);
    const creditsUsed = row.status === 'completed' ? creditCostForDayLimit(dayLimit) : null;
    return {
      id: row.id,
      status: row.status,
      progressStage: row.progressStage,
      industry: row.industry,
      platforms,
      dayLimit,
      postCount,
      creditsUsed,
      hasCsv,
      csvFilename: row.csvFilename,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    };
  });

  res.json({ items });
}
