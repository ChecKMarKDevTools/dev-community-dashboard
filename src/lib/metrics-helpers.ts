import type { ArticleMetrics } from "@/types/metrics";

/** Check if metrics data exists and has meaningful content for charts. */
export function hasAnalyticsData(
  metrics?: ArticleMetrics | null,
): metrics is ArticleMetrics {
  if (!metrics) return false;
  // The DB default is '{}', so fields may be absent even when metrics is truthy
  return (
    (metrics.velocity_buckets?.length ?? 0) > 0 ||
    (metrics.commenter_shares?.length ?? 0) > 0 ||
    (metrics.positive_pct ?? 0) + (metrics.negative_pct ?? 0) > 0 ||
    (metrics.constructiveness_buckets?.length ?? 0) > 0 ||
    (metrics.risk_score ?? 0) > 0
  );
}

/** Transform velocity buckets into {x, y} points for LineChart. */
export function getVelocityChartData(
  metrics: ArticleMetrics,
): ReadonlyArray<{ x: number; y: number }> {
  return metrics.velocity_buckets.map((b) => ({ x: b.hour, y: b.count }));
}

/** Compute baseline (average comments per bucket) for velocity chart. */
export function getVelocityBaseline(metrics: ArticleMetrics): number {
  if (metrics.velocity_buckets.length === 0) return 0;
  const total = metrics.velocity_buckets.reduce((s, b) => s + b.count, 0);
  return total / metrics.velocity_buckets.length;
}

/** Transform commenter shares into bar chart data. */
export function getParticipationData(
  metrics: ArticleMetrics,
): ReadonlyArray<{ label: string; value: number }> {
  return metrics.commenter_shares.map((s) => ({
    label: s.username,
    value: s.share,
  }));
}

/** Extract sentiment percentages for diverging bar. */
export function getSentimentData(metrics: ArticleMetrics): {
  positive: number;
  neutral: number;
  negative: number;
} {
  return {
    positive: metrics.positive_pct,
    neutral: metrics.neutral_pct,
    negative: metrics.negative_pct,
  };
}

/** Transform constructiveness buckets into {x, y} points for LineChart. */
export function getConstructivenessData(
  metrics: ArticleMetrics,
): ReadonlyArray<{ x: number; y: number }> {
  return metrics.constructiveness_buckets.map((b) => ({
    x: b.hour,
    y: b.depth_index,
  }));
}

type RiskMarker = Readonly<{ label: string; active: boolean }>;

/** Build risk signal markers for MarkerTimeline. Only shown when risk > 0. */
export function getRiskMarkers(metrics: ArticleMetrics): RiskMarker[] {
  const { risk_components: rc } = metrics;
  return [
    { label: "Freq", active: rc.frequency_penalty > 0 },
    { label: "Short", active: rc.short_content },
    { label: "No Eng", active: rc.no_engagement },
    { label: "Promo", active: rc.promo_keywords > 0 },
    { label: "Links", active: rc.repeated_links > 0 },
  ];
}
