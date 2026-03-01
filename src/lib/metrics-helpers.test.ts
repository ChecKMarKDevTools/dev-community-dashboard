import { describe, it, expect } from "vitest";
import type { ArticleMetrics } from "@/types/metrics";
import {
  hasAnalyticsData,
  getVelocityChartData,
  getVelocityBaseline,
  getParticipationData,
  getSentimentData,
  getConstructivenessData,
  getRiskMarkers,
} from "./metrics-helpers";

const EMPTY_RISK_COMPONENTS = {
  frequency_penalty: 0,
  short_content: false,
  no_engagement: false,
  promo_keywords: 0,
  repeated_links: 0,
  engagement_credit: 0,
};

function makeMetrics(overrides: Partial<ArticleMetrics> = {}): ArticleMetrics {
  return {
    velocity_buckets: [],
    comments_per_hour: 0,
    commenter_shares: [],
    positive_pct: 0,
    neutral_pct: 100,
    negative_pct: 0,
    constructiveness_buckets: [],
    avg_comment_length: 0,
    reply_ratio: 0,
    alternating_pairs: 0,
    risk_components: EMPTY_RISK_COMPONENTS,
    risk_score: 0,
    sentiment_flips: 0,
    is_first_post: false,
    help_keywords: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// hasAnalyticsData
// ---------------------------------------------------------------------------

describe("hasAnalyticsData", () => {
  it("returns false for null", () => {
    expect(hasAnalyticsData(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(hasAnalyticsData(undefined)).toBe(false);
  });

  it("returns false for empty metrics (no chart data)", () => {
    expect(hasAnalyticsData(makeMetrics())).toBe(false);
  });

  it("returns false for empty object (DB default '{}')", () => {
    // The JSONB default is '{}' — no fields present at all
    expect(hasAnalyticsData({} as ArticleMetrics)).toBe(false);
  });

  it("returns true when velocity_buckets has data", () => {
    expect(
      hasAnalyticsData(
        makeMetrics({ velocity_buckets: [{ hour: 0, count: 1 }] }),
      ),
    ).toBe(true);
  });

  it("returns true when commenter_shares has data", () => {
    expect(
      hasAnalyticsData(
        makeMetrics({
          commenter_shares: [{ username: "alice", share: 0.5 }],
        }),
      ),
    ).toBe(true);
  });

  it("returns true when sentiment has non-zero values", () => {
    expect(
      hasAnalyticsData(
        makeMetrics({ positive_pct: 30, neutral_pct: 70, negative_pct: 0 }),
      ),
    ).toBe(true);
  });

  it("returns true when constructiveness_buckets has data", () => {
    expect(
      hasAnalyticsData(
        makeMetrics({
          constructiveness_buckets: [{ hour: 0, depth_index: 1 }],
        }),
      ),
    ).toBe(true);
  });

  it("returns true when risk_score > 0", () => {
    expect(hasAnalyticsData(makeMetrics({ risk_score: 3 }))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getVelocityChartData
// ---------------------------------------------------------------------------

describe("getVelocityChartData", () => {
  it("transforms velocity_buckets into x/y points", () => {
    const m = makeMetrics({
      velocity_buckets: [
        { hour: 0, count: 3 },
        { hour: 1, count: 5 },
        { hour: 2, count: 1 },
      ],
    });
    const result = getVelocityChartData(m);
    expect(result).toEqual([
      { x: 0, y: 3 },
      { x: 1, y: 5 },
      { x: 2, y: 1 },
    ]);
  });

  it("returns empty array for no buckets", () => {
    expect(getVelocityChartData(makeMetrics())).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getVelocityBaseline
// ---------------------------------------------------------------------------

describe("getVelocityBaseline", () => {
  it("computes average across buckets", () => {
    const m = makeMetrics({
      velocity_buckets: [
        { hour: 0, count: 4 },
        { hour: 1, count: 6 },
      ],
    });
    expect(getVelocityBaseline(m)).toBe(5);
  });

  it("returns 0 for no buckets", () => {
    expect(getVelocityBaseline(makeMetrics())).toBe(0);
  });

  it("handles single bucket", () => {
    const m = makeMetrics({
      velocity_buckets: [{ hour: 0, count: 10 }],
    });
    expect(getVelocityBaseline(m)).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// getParticipationData
// ---------------------------------------------------------------------------

describe("getParticipationData", () => {
  it("transforms commenter_shares into label/value pairs", () => {
    const m = makeMetrics({
      commenter_shares: [
        { username: "alice", share: 0.4 },
        { username: "bob", share: 0.3 },
      ],
    });
    const result = getParticipationData(m);
    expect(result).toEqual([
      { label: "alice", value: 0.4 },
      { label: "bob", value: 0.3 },
    ]);
  });

  it("returns empty array for no shares", () => {
    expect(getParticipationData(makeMetrics())).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSentimentData
// ---------------------------------------------------------------------------

describe("getSentimentData", () => {
  it("extracts sentiment percentages", () => {
    const m = makeMetrics({
      positive_pct: 40,
      neutral_pct: 30,
      negative_pct: 30,
    });
    expect(getSentimentData(m)).toEqual({
      positive: 40,
      neutral: 30,
      negative: 30,
    });
  });

  it("returns zero percentages for default metrics", () => {
    const result = getSentimentData(makeMetrics());
    expect(result.positive).toBe(0);
    expect(result.neutral).toBe(100);
    expect(result.negative).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getConstructivenessData
// ---------------------------------------------------------------------------

describe("getConstructivenessData", () => {
  it("transforms constructiveness_buckets into x/y points", () => {
    const m = makeMetrics({
      constructiveness_buckets: [
        { hour: 0, depth_index: 0.5 },
        { hour: 1, depth_index: 1.5 },
      ],
    });
    const result = getConstructivenessData(m);
    expect(result).toEqual([
      { x: 0, y: 0.5 },
      { x: 1, y: 1.5 },
    ]);
  });

  it("returns empty array for no buckets", () => {
    expect(getConstructivenessData(makeMetrics())).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getRiskMarkers
// ---------------------------------------------------------------------------

describe("getRiskMarkers", () => {
  it("returns all markers with correct active states", () => {
    const m = makeMetrics({
      risk_components: {
        frequency_penalty: 2,
        short_content: true,
        no_engagement: false,
        promo_keywords: 1,
        repeated_links: 0,
        engagement_credit: 0,
      },
    });
    const markers = getRiskMarkers(m);

    expect(markers).toHaveLength(5);
    expect(markers[0]).toEqual({ label: "Freq", active: true });
    expect(markers[1]).toEqual({ label: "Short", active: true });
    expect(markers[2]).toEqual({ label: "No Eng", active: false });
    expect(markers[3]).toEqual({ label: "Promo", active: true });
    expect(markers[4]).toEqual({ label: "Links", active: false });
  });

  it("returns all inactive for zero risk", () => {
    const markers = getRiskMarkers(makeMetrics());
    expect(markers.every((m) => !m.active)).toBe(true);
  });

  it("activates no_engagement and links when set", () => {
    const m = makeMetrics({
      risk_components: {
        frequency_penalty: 0,
        short_content: false,
        no_engagement: true,
        promo_keywords: 0,
        repeated_links: 2,
        engagement_credit: 0,
      },
    });
    const markers = getRiskMarkers(m);
    expect(markers[2].active).toBe(true);
    expect(markers[4].active).toBe(true);
  });
});
