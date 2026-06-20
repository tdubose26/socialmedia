// Suggested posting times per platform (24-hour HH:MM).
//
// These are STARTING GUESSES, loosely based on commonly-cited social media
// posting-time studies — not guarantees. Tweak any value freely; the wizard
// reads straight from this object. No external API is involved.
export const SUGGESTED_TIMES_BY_PLATFORM: Record<string, string[]> = {
  Instagram: ['11:00', '19:00'], // late morning + early evening
  Facebook: ['09:00', '15:00'], // mid-morning + early afternoon
  LinkedIn: ['08:00', '12:00'], // commute + lunch (weekday-oriented)
  TikTok: ['12:00', '20:00'], // midday + evening peak
  YouTube: ['14:00', '20:00'], // afternoon + prime-time evening
  Pinterest: ['20:00', '22:00'], // evening browsing
  'Google GBP': ['09:00', '12:00'], // business hours
  Community: ['10:00', '18:00'], // general daytime
};

// Used when the user selected several platforms — we keep it simple for MVP
// and don't try to reconcile per-platform peaks.
export const GENERAL_SUGGESTED_TIMES = ['11:00', '18:00'];

/**
 * Returns suggested times for the current platform selection.
 * - Exactly one platform → that platform's suggestion.
 * - Zero or multiple platforms → the general suggestion.
 * Always returns a fresh array so callers can mutate safely.
 */
export function suggestedTimesFor(platforms: string[]): string[] {
  if (platforms.length === 1) {
    const match = SUGGESTED_TIMES_BY_PLATFORM[platforms[0]];
    if (match) return [...match];
  }
  return [...GENERAL_SUGGESTED_TIMES];
}

/** Short, honest label describing where the current suggestion came from. */
export function suggestionBasis(platforms: string[]): string {
  if (platforms.length === 1 && SUGGESTED_TIMES_BY_PLATFORM[platforms[0]]) {
    return `Suggested for ${platforms[0]}`;
  }
  return 'General suggestions';
}
