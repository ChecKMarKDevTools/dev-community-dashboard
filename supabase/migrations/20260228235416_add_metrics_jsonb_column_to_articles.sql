-- Add metrics JSONB column to store per-article analytics computed during sync.
-- Contains velocity buckets, commenter shares, sentiment percentages,
-- constructiveness buckets, and risk component breakdown.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;
