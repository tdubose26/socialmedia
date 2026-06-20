// Frozen to match server/templates/social-planner-advance-sample.csv exactly.
// Do NOT edit values without re-checking the sample — column order is positional.

export const HEADER_ROW_1: string[] = [
  // 1–12: All Social (cols 1..12)
  'All Social', 'All Social', 'All Social', 'All Social', 'All Social', 'All Social',
  'All Social', 'All Social', 'All Social', 'All Social', 'All Social', 'All Social',
  // 13: Facebook
  'Facebook',
  // 14: Instagram
  'Instagram',
  // 15–16: LinkedIn
  'LinkedIn', 'LinkedIn',
  // 17–26: Google (GBP)   — parentheses matter
  'Google (GBP)', 'Google (GBP)', 'Google (GBP)', 'Google (GBP)', 'Google (GBP)',
  'Google (GBP)', 'Google (GBP)', 'Google (GBP)', 'Google (GBP)', 'Google (GBP)',
  // 27–29: YouTube
  'YouTube', 'YouTube', 'YouTube',
  // 30–36: TikTok
  'TikTok', 'TikTok', 'TikTok', 'TikTok', 'TikTok', 'TikTok', 'TikTok',
  // 37–38: Community
  'Community', 'Community',
  // 39–40: Pinterest
  'Pinterest', 'Pinterest',
];

export const HEADER_ROW_2: string[] = [
  // 1–12: All Social
  'postAtSpecificTime (YYYY-MM-DD HH:mm:ss)',
  'content',
  'OGmetaUrl (url)',
  'imageUrls (comma-separated)',
  'gifUrl',
  'videoUrls (comma-separated)',
  'thumbnailUrl',
  'mediaOptimization (true/false)',
  'applyWatermark (true/false)',
  'tags (comma-separated)',
  'category',
  'followUpComment',
  // 13: Facebook
  'type (post/story/reel)',
  // 14: Instagram
  'type (post/story/reel)',
  // 15–16: LinkedIn
  'pdfTitle',
  'postAsPdf (true/false)',
  // 17–26: Google (GBP)
  'eventType (call_to_action/event/offer)',
  'actionType (none/order/book/shop/learn_more/call/sign_up)',
  'title',
  'offerTitle',
  'startDate (YYYY-MM-DD HH:mm:ss)',
  'endDate (YYYY-MM-DD HH:mm:ss)',
  'termsConditions',
  'couponCode',
  'redeemOnlineUrl',
  'actionUrl',
  // 27–29: YouTube
  'title',
  'privacyLevel (private/public/unlisted)',
  'type (video/short)',
  // 30–36: TikTok
  'privacyLevel (everyone/friends/only_me)',
  'promoteOtherBrand (true/false)',
  'enableComment (true/false)',
  'enableDuet (true/false)',
  'enableStitch (true/false)',
  'videoDisclosure (true/false)',
  'promoteYourBrand (true/false)',
  // 37–38: Community
  'title',
  'notifyAllGroupMembers (true/false)',
  // 39–40: Pinterest
  'title',
  'link',
];

export const TOTAL_COLUMNS = HEADER_ROW_2.length;

/**
 * Wizard platform name → 0-indexed column range owned by that platform.
 * `start` inclusive, `end` exclusive. All other rows in this range stay empty
 * for posts that aren't on that platform.
 */
export const PLATFORM_COL_RANGE: Record<string, { start: number; end: number }> = {
  Facebook:     { start: 12, end: 13 },
  Instagram:    { start: 13, end: 14 },
  LinkedIn:     { start: 14, end: 16 },
  'Google GBP': { start: 16, end: 26 }, // wizard label has no parens; GHL group label does
  YouTube:      { start: 26, end: 29 },
  TikTok:       { start: 29, end: 36 },
  Community:    { start: 36, end: 38 },
  Pinterest:    { start: 38, end: 40 },
};
