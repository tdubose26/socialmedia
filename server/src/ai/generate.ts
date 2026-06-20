import { callOpenAIJson, callAnthropicJson } from './clients.js';

const STAGE1_MODEL = 'gpt-4o-mini';
const STAGE2_OPENAI_MODEL = 'gpt-4o';
const STAGE2_ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const MAX_ATTEMPTS = 3;

export type GenInput = {
  industry: string;
  brandTone: string;
  callToAction: string;
  topics: string[];
  aiModel: 'chatgpt' | 'claude';
  platforms: string[];
  dayLimit: number;
  times: string[];
  representation: string[];
  location: string[];
  outfitStyle: string[];
  postingDate: string; // YYYY-MM-DD
};

export type GeneratedPost = {
  platform: string;
  content: string;
  hashtags: string[];
  callToAction: string;
  postAtSpecificTime: string; // YYYY-MM-DD HH:mm:ss
  timeOfDay: string;
  engagement_tips: string;
};

export type GeneratedResult = {
  posts: GeneratedPost[];
  summary: string;
};

// ---------- helpers ----------

function addDaysISO(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function timeOfDayFromTime(t: string): string {
  const h = Number(t.split(':')[0]);
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// ---------- Stage 1: strategy / research (lenient) ----------

function buildResearchPrompt(input: GenInput): string {
  return `Produce a concise content strategy brief as JSON for this business.

- Industry: ${input.industry}
- Brand tone: ${input.brandTone}
- Topics: ${input.topics.join(', ') || 'general'}
- Platforms: ${input.platforms.join(', ')}
- Audience representation: ${input.representation.join(', ') || 'general'}

Return ONLY JSON with this shape:
{
  "targetAudience": "<who we're talking to>",
  "keyThemes": ["<theme>", "..."],
  "toneGuidance": "<how the voice should feel>",
  "contentAngles": ["<angle>", "..."],
  "platformNotes": { "<platform>": "<short note>" }
}`;
}

export async function runStage1Research(input: GenInput): Promise<unknown> {
  const system = 'You are a social media strategist. Respond ONLY with valid JSON, no markdown.';
  const user = buildResearchPrompt(input);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callOpenAIJson(STAGE1_MODEL, system, user);
      return JSON.parse(raw);
    } catch {
      // try again
    }
  }
  // Research is non-critical: fall back to a minimal brief rather than failing the job.
  return {
    note: 'research step unavailable — used fallback brief',
    industry: input.industry,
    brandTone: input.brandTone,
    topics: input.topics,
  };
}

// ---------- Stage 2: Dopamine Ladder post generation (strict) ----------

function buildPostsPrompt(input: GenInput, research: unknown, expectedCount: number): string {
  return `Create exactly ${expectedCount} social media posts for the following business.

BUSINESS CONTEXT
- Industry: ${input.industry}
- Brand tone: ${input.brandTone}
- Default call to action: ${input.callToAction || '(none provided — craft a fitting CTA)'}
- Topics/themes to focus on: ${input.topics.join(', ') || 'general'}
- Target platforms (assign each post to ONE of these, distribute them evenly): ${input.platforms.join(', ')}
- People representation: ${input.representation.join(', ') || 'no preference'}
- Location/setting vibe: ${input.location.join(', ') || 'no preference'}
- Outfit/style vibe: ${input.outfitStyle.join(', ') || 'no preference'}

STRATEGY RESEARCH (use this to guide angles and messaging):
${JSON.stringify(research)}

CONTENT FRAMEWORK — THE DOPAMINE LADDER
Every post's "content" must move the reader through these rungs, in order:
1. Hook — stop the scroll in the first line.
2. Intrigue — make them curious to keep reading.
3. Value — give something genuinely useful.
4. Proof — build credibility (specifics, results, social proof).
5. Emotion — make them feel something.
6. CTA — tell them exactly what to do next.
Write it as one natural post. Do NOT label the rungs.

REQUIREMENTS
- Exactly ${expectedCount} posts.
- Tailor each post to its assigned platform's style and length norms.
- 3-8 relevant hashtags per post (include the # symbol).
- Vary hooks and angles across posts; never repeat an opening line.

OUTPUT — return ONLY this JSON, nothing else (no markdown, no code fences):
{
  "posts": [
    {
      "platform": "<one of: ${input.platforms.join(' | ')}>",
      "content": "<the full post text following the Dopamine Ladder>",
      "hashtags": ["#example"],
      "callToAction": "<the specific CTA used in this post>",
      "timeOfDay": "Morning | Afternoon | Evening",
      "engagement_tips": "<one short tip to boost engagement for this post>"
    }
  ],
  "summary": "<2-3 sentence summary of the overall content strategy>"
}`;
}

/**
 * Validates the parsed model output and normalizes it: enforces the exact post
 * count, fills/repairs per-post fields, coerces platform to the selected set,
 * and computes the schedule deterministically. Returns null if invalid (→ retry).
 */
function normalizePosts(parsed: unknown, input: GenInput, expectedCount: number): GeneratedResult | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  const rawPosts = obj.posts;
  if (!Array.isArray(rawPosts) || rawPosts.length !== expectedCount) return null;

  const summary = typeof obj.summary === 'string' ? obj.summary : '';
  const posts: GeneratedPost[] = [];

  for (let i = 0; i < rawPosts.length; i++) {
    const p = rawPosts[i];
    if (!p || typeof p !== 'object') return null;
    const post = p as Record<string, unknown>;

    const content = typeof post.content === 'string' ? post.content.trim() : '';
    if (!content) return null; // a post with no content is a hard failure → retry

    const hashtags = Array.isArray(post.hashtags) ? post.hashtags.map((h) => String(h)) : [];
    const callToAction =
      typeof post.callToAction === 'string' && post.callToAction.trim()
        ? post.callToAction.trim()
        : input.callToAction;
    const engagement_tips = typeof post.engagement_tips === 'string' ? post.engagement_tips : '';

    // Coerce platform into the selected set (round-robin if the model picked an invalid one).
    let platform = typeof post.platform === 'string' ? post.platform : '';
    if (!input.platforms.includes(platform)) {
      platform = input.platforms[i % input.platforms.length];
    }

    // Deterministic schedule: 2 posts/day, slot 0 → times[0], slot 1 → times[1] || times[0].
    const day = Math.floor(i / 2);
    const slot = i % 2;
    const time = input.times[slot] ?? input.times[0];
    const date = addDaysISO(input.postingDate, day);

    posts.push({
      platform,
      content,
      hashtags,
      callToAction,
      postAtSpecificTime: `${date} ${time}:00`,
      timeOfDay: timeOfDayFromTime(time),
      engagement_tips,
    });
  }

  return { posts, summary };
}

export async function runStage2Posts(input: GenInput, research: unknown): Promise<GeneratedResult> {
  const expectedCount = input.dayLimit * 2;
  const system =
    'You are an elite social media copywriter who writes scroll-stopping, platform-native posts. You ALWAYS respond with valid JSON only — no markdown, no code fences, no commentary.';
  const user = buildPostsPrompt(input, research, expectedCount);

  let lastError = 'unknown error';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let raw = '';
    try {
      raw =
        input.aiModel === 'claude'
          ? await callAnthropicJson(STAGE2_ANTHROPIC_MODEL, system, user)
          : await callOpenAIJson(STAGE2_OPENAI_MODEL, system, user);
    } catch (err) {
      lastError = `model call failed: ${err instanceof Error ? err.message : String(err)}`;
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      lastError = 'response was not valid JSON';
      continue;
    }

    const normalized = normalizePosts(parsed, input, expectedCount);
    if (normalized) return normalized;
    lastError = `expected exactly ${expectedCount} valid posts`;
  }

  throw new Error(`Stage 2 generation failed after ${MAX_ATTEMPTS} attempts: ${lastError}`);
}
