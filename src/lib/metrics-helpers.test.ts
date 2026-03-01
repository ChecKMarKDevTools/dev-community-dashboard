import { describe, it, expect } from "vitest";
import type { ArticleMetrics } from "@/types/metrics";
import {
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
// Null-safety: all getters handle null / undefined / empty metrics
// ---------------------------------------------------------------------------

describe("null-safety", () => {
  it("getVelocityChartData returns empty array for null", () => {
    expect(getVelocityChartData(null)).toEqual([]);
  });

  it("getVelocityChartData returns empty array for undefined", () => {
    expect(getVelocityChartData(undefined)).toEqual([]);
  });

  it("getVelocityBaseline returns 0 for null", () => {
    expect(getVelocityBaseline(null)).toBe(0);
  });

  it("getParticipationData returns empty array for null", () => {
    expect(getParticipationData(null)).toEqual([]);
  });

  it("getSentimentData returns 100% neutral for null", () => {
    expect(getSentimentData(null)).toEqual({
      positive: 0,
      neutral: 100,
      negative: 0,
    });
  });

  it("getConstructivenessData returns empty array for null", () => {
    expect(getConstructivenessData(null)).toEqual([]);
  });

  it("getRiskMarkers returns all-inactive markers for null", () => {
    const markers = getRiskMarkers(null);
    expect(markers).toHaveLength(5);
    expect(markers.every((m) => !m.active)).toBe(true);
  });

  it("getVelocityChartData handles empty object (DB default '{}')", () => {
    expect(getVelocityChartData({} as ArticleMetrics)).toEqual([]);
  });

  it("getRiskMarkers handles empty object (DB default '{}')", () => {
    const markers = getRiskMarkers({} as ArticleMetrics);
    expect(markers).toHaveLength(5);
    expect(markers.every((m) => !m.active)).toBe(true);
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
    expect(markers[0]).toEqual({ label: "Frequency Penalty", active: true });
    expect(markers[1]).toEqual({ label: "Short Content", active: true });
    expect(markers[2]).toEqual({ label: "No Engagement", active: false });
    expect(markers[3]).toEqual({
      label: "Promotional Keywords",
      active: true,
    });
    expect(markers[4]).toEqual({ label: "Repeated Links", active: false });
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
