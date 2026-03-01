/**
 * Keyword lists for keyword-based sentiment detection.
 *
 * Shared between the server-side sync pipeline (`sync.ts`) and client-side
 * UI components (e.g. `Dashboard.tsx`). Extracted into its own module so
 * client components do not need to import the server-only sync pipeline.
 */

export const POSITIVE_WORDS: ReadonlySet<string> = new Set([
  "awesome",
  "great",
  "excellent",
  "love",
  "good",
  "amazing",
  "thanks",
  "helpful",
]);

export const NEGATIVE_WORDS: ReadonlySet<string> = new Set([
  "terrible",
  "bad",
  "awful",
  "hate",
  "unhelpful",
  "wrong",
  "broken",
  "issue",
  "bug",
]);
