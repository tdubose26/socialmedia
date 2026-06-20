import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { contentRequests } from '../db/schema.js';
import { runStage1Research, runStage2Posts, type GenInput } from '../ai/generate.js';
import { buildGhlCsv } from '../csv/buildCsv.js';
import { creditCostForDayLimit, deductCredits } from '../credits.js';

type RequestPatch = Partial<typeof contentRequests.$inferInsert>;

async function updateRequest(id: string, patch: RequestPatch) {
  await db.update(contentRequests).set(patch).where(eq(contentRequests.id, id));
}

async function getRequest(id: string) {
  const [row] = await db.select().from(contentRequests).where(eq(contentRequests.id, id));
  return row;
}

function todayString() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function buildInput(row: typeof contentRequests.$inferSelect): GenInput {
  const ps = (row.platformSettings ?? {}) as Record<string, unknown>;
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  return {
    industry: row.industry ?? '',
    brandTone: row.brandTone ?? '',
    callToAction: row.callToAction ?? '',
    topics: Array.isArray(row.selectedTopics) ? (row.selectedTopics as string[]) : [],
    aiModel: ps.aiModel === 'claude' ? 'claude' : 'chatgpt',
    platforms: arr(ps.platforms),
    dayLimit: ps.dayLimit === 10 ? 10 : 5,
    times: arr(ps.times).length > 0 ? arr(ps.times) : ['09:00'],
    representation: arr(ps.representation),
    location: arr(ps.location),
    outfitStyle: arr(ps.outfitStyle),
    postingDate: row.postingDate ?? todayString(),
  };
}

/**
 * Fire-and-forget entry point. Starts the background job WITHOUT being awaited,
 * and never throws back to the caller — any failure is recorded on the row.
 */
export function startContentJob(requestId: string) {
  runContentJob(requestId).catch(async (err) => {
    console.error(`Content job ${requestId} failed:`, err);
    try {
      await updateRequest(requestId, {
        status: 'failed',
        progressStage: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    } catch (nested) {
      console.error(`Could not record failure for ${requestId}:`, nested);
    }
  });
}

async function runContentJob(requestId: string) {
  const row = await getRequest(requestId);
  if (!row) throw new Error('request row not found');
  const input = buildInput(row);

  // Stage 1 — strategy/research (lenient; falls back internally if it can't return JSON).
  await updateRequest(requestId, { status: 'processing', progressStage: 'researching' });
  const research = await runStage1Research(input);
  await updateRequest(requestId, { researchData: research, progressStage: 'generating posts' });

  // Stage 2 — Dopamine Ladder posts (strict; throws after retries → job marked failed).
  const result = await runStage2Posts(input, research);

  // Charge credits only now that generation succeeded.
  const cost = creditCostForDayLimit(input.dayLimit);
  const deducted = await deductCredits(row.userId, cost);
  if (!deducted) {
    console.warn(
      `Content job ${requestId}: could not deduct ${cost} credits from user ${row.userId} (insufficient at completion).`,
    );
  }

  await updateRequest(requestId, {
    generatedPosts: result,
    progressStage: 'building CSV',
  });

  // Build the GHL-formatted CSV and finalize the request.
  const csv = buildGhlCsv(input.industry, result.posts);
  await updateRequest(requestId, {
    csvFilename: csv.filename,
    csvContent: csv.text,
    csvBase64: csv.base64,
    status: 'completed',
    progressStage: 'completed',
    completedAt: new Date(),
  });
  console.log(
    `Content job ${requestId}: ${result.posts.length} posts → ${csv.filename} (${csv.text.length} bytes), creditsDeducted=${deducted}.`,
  );
}
