import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { requireEnv } from '../env.js';

// Lazily constructed so we only require an API key for the provider we actually use.
let _openai: OpenAI | null = null;
let _anthropic: Anthropic | null = null;

function openai() {
  return (_openai ??= new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') }));
}

function anthropic() {
  return (_anthropic ??= new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') }));
}

/** Calls an OpenAI chat model in JSON mode and returns the raw string content. */
export async function callOpenAIJson(model: string, system: string, user: string): Promise<string> {
  const res = await openai().chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });
  return res.choices[0]?.message?.content ?? '';
}

/** Calls an Anthropic model and returns the concatenated text content. */
export async function callAnthropicJson(model: string, system: string, user: string): Promise<string> {
  const res = await anthropic().messages.create({
    model,
    max_tokens: 8000,
    temperature: 0.8,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return res.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
}
