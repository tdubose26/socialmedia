import type { GeneratedPost } from '../ai/generate.js';
import {
  HEADER_ROW_1,
  HEADER_ROW_2,
  PLATFORM_COL_RANGE,
  TOTAL_COLUMNS,
} from './columns.js';

const BOM = '﻿';
const LINE_END = '\r\n'; // CRLF — matches the sample and Excel/GHL expectations

/** Returns the cell wrapped in double quotes if it contains a comma, quote, CR, or LF. */
function escapeCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function rowToCsv(row: string[]): string {
  return row.map(escapeCell).join(',');
}

/**
 * Assembles the "content" cell for a post: the AI-written body, then a blank
 * line, then space-separated hashtags. The AI already weaves the CTA into the
 * body, so we don't append it separately.
 */
function composeContent(post: GeneratedPost): string {
  const body = post.content.trim();
  if (post.hashtags.length === 0) return body;
  return `${body}\n\n${post.hashtags.join(' ')}`;
}

function buildDataRow(post: GeneratedPost): string[] {
  const row: string[] = new Array(TOTAL_COLUMNS).fill('');

  // Cols 1–12 (All Social) — populate the ones we have data for.
  row[0] = post.postAtSpecificTime;     // postAtSpecificTime (YYYY-MM-DD HH:mm:ss)
  row[1] = composeContent(post);        // content
  // 2..11 left empty by design (no OG URL, images, videos, tags, category, etc. yet).

  // The post's platform-specific column range stays empty (no platform-specific
  // toggles in MVP), but other platforms' ranges are equally untouched. The
  // important contract is positional: cells outside the post's range exist as
  // empty strings, never null.
  const range = PLATFORM_COL_RANGE[post.platform];
  if (!range) {
    throw new Error(`Unknown platform "${post.platform}" — no CSV column range mapped.`);
  }

  return row;
}

export type CsvBuildResult = {
  text: string;        // CSV including BOM
  base64: string;      // base64 of `text`
  filename: string;    // social-media-posting-{industry}-{date}.csv
  rowCount: number;    // data rows (excludes the 2 header rows)
};

export function buildCsvFilename(industry: string, dateStr?: string): string {
  const date = dateStr ?? new Date().toISOString().slice(0, 10);
  const slug = industry.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `social-media-posting-${slug || 'content'}-${date}.csv`;
}

export function buildGhlCsv(industry: string, posts: GeneratedPost[]): CsvBuildResult {
  if (HEADER_ROW_1.length !== TOTAL_COLUMNS || HEADER_ROW_2.length !== TOTAL_COLUMNS) {
    throw new Error('CSV header row length mismatch — columns.ts is inconsistent.');
  }

  const lines = [
    rowToCsv(HEADER_ROW_1),
    rowToCsv(HEADER_ROW_2),
    ...posts.map((p) => rowToCsv(buildDataRow(p))),
  ];
  const text = BOM + lines.join(LINE_END);
  const base64 = Buffer.from(text, 'utf8').toString('base64');

  return {
    text,
    base64,
    filename: buildCsvFilename(industry),
    rowCount: posts.length,
  };
}
